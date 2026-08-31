import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { checkAndNotifyStock } from "@/lib/notifications";

const checkoutItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().nullable(),
  quantity: z.number().int().positive(),
});

const checkoutSchema = z.object({
  // Customer info (guest checkout)
  customerName: z.string().min(2, "Nome é obrigatório"),
  customerEmail: z.string().email("E-mail inválido"),
  customerPhone: z.string().min(10, "Telefone inválido"),
  customerCpf: z.string().min(11, "CPF inválido").optional().nullable(),

  // Shipping address
  shippingAddress: z.object({
    street: z.string().min(3),
    number: z.string().min(1),
    complement: z.string().optional(),
    neighborhood: z.string().min(2),
    city: z.string().min(2),
    state: z.string().length(2),
    zipCode: z.string().length(8),
  }),

  // Payment
  paymentMethod: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "BOLETO"]),

  // Items
  items: z.array(checkoutItemSchema).min(1, "Carrinho vazio"),

  // Coupon
  couponCode: z.string().optional().nullable(),
});

function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `CD7-${y}${m}${d}-${rand}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Format shipping address as JSON
    const shippingAddressJson = {
      street: data.shippingAddress.street,
      number: data.shippingAddress.number,
      complement: data.shippingAddress.complement || "",
      neighborhood: data.shippingAddress.neighborhood,
      city: data.shippingAddress.city,
      state: data.shippingAddress.state,
      zipCode: data.shippingAddress.zipCode,
    };

    // =====================================================
    // EVERYTHING inside the transaction to prevent races
    // =====================================================
    const { order, itemDetails } = await prisma.$transaction(async (tx) => {
      // 1. Validate all items: product active, variant active, stock sufficient
      const itemDetails: Array<{
        productId: string;
        variantId: string | null;
        productName: string;
        variantName: string | null;
        unitPrice: typeof Prisma.Decimal.prototype;
        quantity: number;
        totalPrice: typeof Prisma.Decimal.prototype;
      }> = [];

      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, basePrice: true, slug: true, isActive: true },
        });

        if (!product) {
          throw new Error(`Produto não existe mais. Por favor, atualize seu carrinho.`);
        }

        if (!product.isActive) {
          throw new Error(`O produto "${product.name}" foi desativado e não está mais disponível. Remova-o do carrinho.`);
        }

        let price = product.basePrice;
        let variantName: string | null = null;

        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { id: true, name: true, price: true, stock: true, isActive: true },
          });

          if (!variant) {
            throw new Error(`A variação selecionada de "${product.name}" não existe mais. Atualize seu carrinho.`);
          }

          if (!variant.isActive) {
            throw new Error(`A variação "${variant.name}" de "${product.name}" foi desativada. Escolha outra opção.`);
          }

          if (variant.stock < item.quantity) {
            if (variant.stock === 0) {
              throw new Error(`"${product.name}" (${variant.name}) está esgotado.`);
            }
            throw new Error(
              `Estoque insuficiente para "${product.name}" (${variant.name}). Disponível: ${variant.stock} unidade(s).`
            );
          }

          if (variant.price) price = variant.price;
          variantName = variant.name;
        }

        itemDetails.push({
          productId: product.id,
          variantId: item.variantId,
          productName: product.name,
          variantName,
          unitPrice: price,
          quantity: item.quantity,
          totalPrice: new Prisma.Decimal(price.toString()).mul(item.quantity),
        });
      }

      // 2. Calculate totals
      const subtotal = itemDetails.reduce(
        (sum, item) => sum.add(item.totalPrice),
        new Prisma.Decimal(0)
      );

      const shippingCost = subtotal.gte(299)
        ? new Prisma.Decimal(0)
        : new Prisma.Decimal(19.9);

      // 3. Apply coupon (validated inside transaction to prevent race)
      let discount = new Prisma.Decimal(0);
      let couponId: string | null = null;

      if (data.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: data.couponCode },
        });

        if (!coupon) {
          throw new Error(`Cupom "${data.couponCode}" não encontrado.`);
        }

        if (!coupon.isActive) {
          throw new Error(`O cupom "${data.couponCode}" não está mais ativo.`);
        }

        const now = new Date();

        if (coupon.startsAt > now) {
          throw new Error(`O cupom "${data.couponCode}" ainda não entrou em vigor.`);
        }

        if (coupon.expiresAt && coupon.expiresAt <= now) {
          throw new Error(`O cupom "${data.couponCode}" já expirou.`);
        }

        if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
          throw new Error(`O cupom "${data.couponCode}" atingiu o limite máximo de usos.`);
        }

        if (coupon.minOrderValue && subtotal.lt(coupon.minOrderValue)) {
          throw new Error(
            `Pedido mínimo de R$ ${coupon.minOrderValue.toFixed(2)} para usar o cupom "${data.couponCode}".`
          );
        }

        if (coupon.discountType === "PERCENTAGE") {
          discount = subtotal.mul(coupon.discountValue).div(100);
        } else {
          discount = coupon.discountValue;
        }

        // Don't let discount exceed subtotal
        if (discount.gt(subtotal)) {
          discount = subtotal;
        }

        couponId = coupon.id;
      }

      const total = subtotal.add(shippingCost).sub(discount);

      // Prevent negative/zero totals
      if (total.lte(0)) {
        throw new Error("Valor total do pedido inválido.");
      }

      // 4. Generate unique order number with retry
      let orderNumber = generateOrderNumber();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await tx.order.findUnique({
          where: { orderNumber },
          select: { id: true },
        });
        if (!existing) break;
        orderNumber = generateOrderNumber();
        attempts++;
      }
      if (attempts >= 5) {
        throw new Error("Erro ao gerar número do pedido. Tente novamente.");
      }

      // 5. Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          customerCpf: data.customerCpf,
          shippingAddress: shippingAddressJson,
          shippingCost,
          shippingMethod: "PAC",
          paymentMethod: data.paymentMethod,
          paymentStatus: "PENDING",
          status: "PENDING_PAYMENT",
          subtotal,
          discount,
          total,
          couponId,
          couponCode: data.couponCode || null,
          items: {
            create: itemDetails.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              totalPrice: item.totalPrice,
            })),
          },
          statusHistory: {
            create: {
              status: "PENDING_PAYMENT",
              note: "Pedido criado",
            },
          },
        },
      });

      // 6. Decrement stock (inside transaction — atomic)
      for (const item of itemDetails) {
        if (item.variantId) {
          const updated = await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
            select: { stock: true, name: true, productId: true },
          });

          // Safety net: stock should never go negative
          if (updated.stock < 0) {
            throw new Error(
              `Estoque de "${item.productName}" (${updated.name}) esgotou durante o processamento. Tente novamente.`
            );
          }
        } else {
          // Decrement product-level stock for non-variant products
          const updated = await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
            select: { stock: true, name: true },
          });

          if (updated.stock < 0) {
            throw new Error(
              `Estoque de "${item.productName}" esgotou durante o processamento. Tente novamente.`
            );
          }
        }
      }

      // 7. Increment coupon usage (inside transaction)
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { currentUses: { increment: 1 } },
        });
      }

      return { order: newOrder, itemDetails };
    }, {
      timeout: 15000,
    });

    // Fire-and-forget: check stock levels and send notifications
    (async () => {
      try {
        for (const item of itemDetails) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { name: true, stock: true, stockUnit: true, lowStockThreshold: true },
          });
          if (!product) continue;

          if (item.variantId) {
            const variant = await prisma.productVariant.findUnique({
              where: { id: item.variantId },
              select: { stock: true, name: true },
            });
            if (variant) {
              checkAndNotifyStock(
                `${product.name} (${variant.name})`,
                variant.stock,
                product.stockUnit,
                product.lowStockThreshold
              );
            }
          } else {
            checkAndNotifyStock(
              product.name,
              product.stock,
              product.stockUnit,
              product.lowStockThreshold
            );
          }
        }
      } catch (e) {
        console.error("[NOTIFICATION] Error checking stock after checkout:", e);
      }
    })();

    return NextResponse.json(
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total.toString(),
        paymentMethod: order.paymentMethod,
        status: order.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao processar pedido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
