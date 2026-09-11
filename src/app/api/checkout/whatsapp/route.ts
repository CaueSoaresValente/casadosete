import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const whatsappItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().nullable(),
  quantity: z.number().int().positive(),
});

const whatsappCheckoutSchema = z.object({
  customerName: z.string().min(2, "Nome é obrigatório"),
  customerEmail: z.string().email("E-mail inválido").optional().nullable(),
  customerPhone: z.string().min(10, "Telefone inválido"),

  shippingAddress: z.object({
    street: z.string().min(1),
    number: z.string().min(1),
    complement: z.string().optional(),
    neighborhood: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    zipCode: z.string().min(8),
  }),

  items: z.array(whatsappItemSchema).min(1, "Carrinho vazio"),
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
    const parsed = whatsappCheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const shippingAddressJson = {
      street: data.shippingAddress.street,
      number: data.shippingAddress.number,
      complement: data.shippingAddress.complement || "",
      neighborhood: data.shippingAddress.neighborhood,
      city: data.shippingAddress.city,
      state: data.shippingAddress.state,
      zipCode: data.shippingAddress.zipCode,
    };

    const order = await prisma.$transaction(async (tx) => {
      // 1. Validate items (check existence and active status — stock NOT checked here;
      //    WhatsApp orders are pending intent, stock decremented on payment confirmation)
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
          select: { id: true, name: true, basePrice: true, isActive: true },
        });

        if (!product) {
          throw new Error(`Produto não encontrado. Por favor, atualize seu carrinho.`);
        }

        if (!product.isActive) {
          throw new Error(`O produto "${product.name}" não está mais disponível.`);
        }

        let price = product.basePrice;
        let variantName: string | null = null;

        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { id: true, name: true, price: true, isActive: true },
          });

          if (!variant) {
            throw new Error(`Variação de "${product.name}" não encontrada.`);
          }

          if (!variant.isActive) {
            throw new Error(`Variação "${variant.name}" de "${product.name}" não está disponível.`);
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

      // 2. Calculate totals (shipping to be negotiated on WhatsApp — set to 0)
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

      // 4. Create the order — source: WHATSAPP
      //    Stock is NOT decremented here; it will be decremented when admin
      //    confirms payment (moves status to PAYMENT_CONFIRMED)
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName: data.customerName,
          customerEmail: data.customerEmail || null,
          customerPhone: data.customerPhone,
          shippingAddress: shippingAddressJson,
          shippingCost,
          shippingMethod: "A combinar",
          paymentMethod: "PIX",
          paymentStatus: "PENDING",
          status: "PENDING_PAYMENT",
          source: "WHATSAPP",
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
              status: "PENDING_PAYMENT",
              note: "Pedido enviado pelo WhatsApp — aguardando confirmação de pagamento",
            },
          },
        },
      });

      return newOrder;
    }, {
      timeout: 15000,
    });

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
    console.error("[WHATSAPP CHECKOUT] Error:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao registrar pedido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
