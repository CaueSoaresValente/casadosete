import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { checkAndNotifyStock } from "@/lib/notifications";

const manualItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().nullable().optional(),
  quantity: z.number().int().positive(),
});

const manualOrderSchema = z.object({
  customerName: z.string().min(2, "Nome é obrigatório"),
  customerPhone: z.string().min(10, "Telefone inválido"),
  customerEmail: z.string().email("E-mail inválido").optional().nullable(),

  paymentMethod: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "BOLETO"]),
  status: z.enum([
    "PENDING_PAYMENT",
    "PAYMENT_CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
  ]).default("PAYMENT_CONFIRMED"),

  items: z.array(manualItemSchema).min(1, "Adicione pelo menos um produto"),

  notes: z.string().optional(),
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
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = manualOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Presential orders don't have a shipping address
    const shippingAddressJson = {
      street: "Presencial",
      number: "-",
      complement: "",
      neighborhood: "-",
      city: "-",
      state: "SP",
      zipCode: "00000000",
    };

    const { order, itemDetails } = await prisma.$transaction(async (tx) => {
      // 1. Validate items: product active, variant active, stock sufficient
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
          select: { id: true, name: true, basePrice: true, isActive: true, stock: true },
        });

        if (!product) {
          throw new Error(`Produto não encontrado.`);
        }

        if (!product.isActive) {
          throw new Error(`O produto "${product.name}" está inativo.`);
        }

        let price = product.basePrice;
        let variantName: string | null = null;
        const variantId = item.variantId ?? null;

        if (variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: variantId },
            select: { id: true, name: true, price: true, stock: true, isActive: true },
          });

          if (!variant) {
            throw new Error(`Variação de "${product.name}" não encontrada.`);
          }

          if (!variant.isActive) {
            throw new Error(`Variação "${variant.name}" de "${product.name}" está inativa.`);
          }

          if (variant.stock < item.quantity) {
            throw new Error(
              `Estoque insuficiente para "${product.name}" (${variant.name}). Disponível: ${variant.stock} unidade(s).`
            );
          }

          if (variant.price) price = variant.price;
          variantName = variant.name;
        } else {
          if (product.stock < item.quantity) {
            throw new Error(
              `Estoque insuficiente para "${product.name}". Disponível: ${product.stock} unidade(s).`
            );
          }
        }

        itemDetails.push({
          productId: product.id,
          variantId,
          productName: product.name,
          variantName,
          unitPrice: price,
          quantity: item.quantity,
          totalPrice: new Prisma.Decimal(price.toString()).mul(item.quantity),
        });
      }

      // 2. Calculate totals (no shipping for in-person orders)
      const subtotal = itemDetails.reduce(
        (sum, item) => sum.add(item.totalPrice),
        new Prisma.Decimal(0)
      );
      const shippingCost = new Prisma.Decimal(0);
      const discount = new Prisma.Decimal(0);
      const total = subtotal;

      // 3. Generate unique order number with retry
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

      // 4. Create the order — source: IN_PERSON
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName: data.customerName,
          customerEmail: data.customerEmail || null,
          customerPhone: data.customerPhone,
          shippingAddress: shippingAddressJson,
          shippingCost,
          shippingMethod: "Presencial",
          paymentMethod: data.paymentMethod,
          paymentStatus: data.status === "PAYMENT_CONFIRMED" ? "CONFIRMED" : "PENDING",
          status: data.status,
          source: "IN_PERSON",
          subtotal,
          discount,
          total,
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
              status: data.status,
              note: data.notes
                ? `Pedido presencial criado pelo admin. ${data.notes}`
                : "Pedido presencial criado pelo admin.",
              changedBy: "admin",
            },
          },
        },
      });

      // 5. Decrement stock (inside transaction — atomic)
      for (const item of itemDetails) {
        if (item.variantId) {
          const updated = await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
            select: { stock: true, name: true },
          });

          if (updated.stock < 0) {
            throw new Error(
              `Estoque de "${item.productName}" (${updated.name}) esgotou durante o processamento.`
            );
          }
        } else {
          const updated = await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
            select: { stock: true, name: true },
          });

          if (updated.stock < 0) {
            throw new Error(
              `Estoque de "${item.productName}" esgotou durante o processamento.`
            );
          }
        }
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
        console.error("[NOTIFICATION] Error checking stock after manual order:", e);
      }
    })();

    return NextResponse.json(
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total.toString(),
        status: order.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[MANUAL ORDER] Error:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao criar pedido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
