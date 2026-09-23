import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const boxCustomizationSchema = z.object({
  primaryOrixa: z.object({
    id: z.string(),
    name: z.string(),
    colorHex: z.string(),
  }),
  primaryImage: z
    .object({
      id: z.string(),
      name: z.string(),
      material: z.string().optional(),
      price: z.number(),
    })
    .optional()
    .nullable(),
  secondaryImage: z
    .object({
      orixa: z.object({
        id: z.string(),
        name: z.string(),
        colorHex: z.string(),
      }),
      id: z.string(),
      name: z.string(),
      material: z.string().optional(),
      price: z.number(),
    })
    .optional()
    .nullable(),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      quantity: z.number().int().positive(),
    })
  ),
  objectOption: z
    .object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
    })
    .optional()
    .nullable(),
  note: z.string().optional().nullable(),
  total: z.number().optional(),
});

const whatsappItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().nullable(),
  quantity: z.number().int().positive(),
  isBackorder: z.boolean().optional().default(false),
  boxCustomization: boxCustomizationSchema.optional().nullable(),
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

    const order = await prisma.$transaction(
      async (tx) => {
        // 1. Validate items and recalculate box items securely on server
        const itemDetails: Array<{
          productId: string;
          variantId: string | null;
          productName: string;
          variantName: string | null;
          unitPrice: typeof Prisma.Decimal.prototype;
          quantity: number;
          totalPrice: typeof Prisma.Decimal.prototype;
          isBackorder: boolean;
        }> = [];

        let orderBoxData: {
          primaryOrixaName: string;
          primaryOrixaColor: string;
          secondaryOrixaName: string | null;
          secondaryOrixaColor: string | null;
          basePrice: typeof Prisma.Decimal.prototype;
          objectOptionName: string | null;
          objectOptionPrice: typeof Prisma.Decimal.prototype | null;
          notes: string | null;
          itemsSnapshot: Prisma.InputJsonValue;
        } | null = null;

        for (const item of data.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { id: true, name: true, basePrice: true, isActive: true, stock: true },
          });

          if (!product) {
            throw new Error(`Produto não encontrado. Por favor, atualize seu carrinho.`);
          }

          if (!product.isActive) {
            throw new Error(`O produto "${product.name}" não está mais disponível.`);
          }

          let price = product.basePrice;
          let variantName: string | null = null;
          let currentStock = product.stock;

          if (item.variantId) {
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              select: { id: true, name: true, price: true, isActive: true, stock: true },
            });

            if (!variant) {
              throw new Error(`Variação de "${product.name}" não encontrada.`);
            }

            if (!variant.isActive) {
              throw new Error(`Variação "${variant.name}" de "${product.name}" não está disponível.`);
            }

            if (variant.price) price = variant.price;
            variantName = variant.name;
            currentStock = variant.stock;
          }

          // ─── Box Customization Recalculation & Validation ──────────────────
          if (item.boxCustomization) {
            const box = item.boxCustomization;

            // Validate primary orixa
            const dbPrimaryOrixa = await tx.orixa.findUnique({
              where: { id: box.primaryOrixa.id },
              select: { id: true, name: true, colorHex: true, isActive: true },
            });
            if (!dbPrimaryOrixa || !dbPrimaryOrixa.isActive) {
              throw new Error(`Orixá principal selecionado não está mais disponível.`);
            }

            // Validate primary image (if present)
            let dbPrimaryImage: { id: string; name: string; price: Prisma.Decimal } | null = null;
            if (box.primaryImage) {
              const img = await tx.boxImageOption.findUnique({
                where: { id: box.primaryImage.id },
                select: { id: true, name: true, price: true, isActive: true },
              });
              if (!img || !img.isActive) {
                throw new Error(`Opção de imagem "${box.primaryImage.material || box.primaryImage.name}" não está mais disponível.`);
              }
              dbPrimaryImage = { id: img.id, name: img.name, price: img.price };
            }

            // Validate secondary image (if present)
            let dbSecondaryImage: {
              orixa: { id: string; name: string; colorHex: string };
              id: string;
              name: string;
              price: Prisma.Decimal;
            } | null = null;
            if (box.secondaryImage) {
              const secOrixa = await tx.orixa.findUnique({
                where: { id: box.secondaryImage.orixa.id },
                select: { id: true, name: true, colorHex: true, isActive: true },
              });
              if (!secOrixa || !secOrixa.isActive) {
                throw new Error(`Orixá da imagem secundária não está mais disponível.`);
              }
              const img = await tx.boxImageOption.findUnique({
                where: { id: box.secondaryImage.id },
                select: { id: true, name: true, price: true, isActive: true },
              });
              if (!img || !img.isActive) {
                throw new Error(`Opção de imagem secundária "${box.secondaryImage.material || box.secondaryImage.name}" não está mais disponível.`);
              }
              dbSecondaryImage = {
                orixa: { id: secOrixa.id, name: secOrixa.name, colorHex: secOrixa.colorHex },
                id: img.id,
                name: img.name,
                price: img.price,
              };
            }

            // Validate items in box
            if (!box.items || box.items.length === 0) {
              throw new Error(`A Box personalizada precisa conter ao menos um item.`);
            }

            const dbBoxItems: Array<{
              id: string;
              name: string;
              unitPrice: number;
              quantity: number;
              totalPrice: number;
            }> = [];
            let boxItemsSum = new Prisma.Decimal(0);

            for (const bi of box.items) {
              const boxItem = await tx.boxItem.findUnique({
                where: { id: bi.id },
                select: { id: true, name: true, price: true, maxQuantity: true, isActive: true },
              });
              if (!boxItem || !boxItem.isActive) {
                throw new Error(`O item "${bi.name}" da Box não está mais disponível.`);
              }
              if (boxItem.maxQuantity != null && bi.quantity > boxItem.maxQuantity) {
                throw new Error(`A quantidade do item "${boxItem.name}" excede o máximo permitido (${boxItem.maxQuantity}).`);
              }
              const itemTotal = boxItem.price.mul(bi.quantity);
              boxItemsSum = boxItemsSum.add(itemTotal);
              dbBoxItems.push({
                id: boxItem.id,
                name: boxItem.name,
                unitPrice: Number(boxItem.price),
                quantity: bi.quantity,
                totalPrice: Number(itemTotal),
              });
            }

            // Validate object option (if present)
            let dbObjectOption: { id: string; name: string; price: Prisma.Decimal } | null = null;
            if (box.objectOption) {
              const obj = await tx.boxObjectOption.findUnique({
                where: { id: box.objectOption.id },
                select: { id: true, name: true, price: true, isActive: true },
              });
              if (!obj || !obj.isActive) {
                throw new Error(`A opção de objeto "${box.objectOption.name}" não está mais disponível.`);
              }
              dbObjectOption = { id: obj.id, name: obj.name, price: obj.price };
            }

            // Server-calculated unit price
            let recalculatedUnitPrice = boxItemsSum;
            if (dbPrimaryImage) {
              recalculatedUnitPrice = recalculatedUnitPrice.add(dbPrimaryImage.price);
            }
            if (dbSecondaryImage) {
              recalculatedUnitPrice = recalculatedUnitPrice.add(dbSecondaryImage.price);
            }
            if (dbObjectOption) {
              recalculatedUnitPrice = recalculatedUnitPrice.add(dbObjectOption.price);
            }

            price = recalculatedUnitPrice;

            // Prepare snapshot for OrderBox
            const itemsSnapshot: Prisma.InputJsonValue = {
              primaryOrixa: {
                id: dbPrimaryOrixa.id,
                name: dbPrimaryOrixa.name,
                colorHex: dbPrimaryOrixa.colorHex,
              },
              primaryImage: dbPrimaryImage
                ? {
                    id: dbPrimaryImage.id,
                    material: dbPrimaryImage.name,
                    name: `${dbPrimaryImage.name} de ${dbPrimaryOrixa.name}`,
                    price: Number(dbPrimaryImage.price),
                  }
                : null,
              secondaryImage: dbSecondaryImage
                ? {
                    orixa: dbSecondaryImage.orixa,
                    id: dbSecondaryImage.id,
                    material: dbSecondaryImage.name,
                    name: `${dbSecondaryImage.name} de ${dbSecondaryImage.orixa.name}`,
                    price: Number(dbSecondaryImage.price),
                  }
                : null,
              items: dbBoxItems,
              objectOption: dbObjectOption
                ? {
                    id: dbObjectOption.id,
                    name: dbObjectOption.name,
                    price: Number(dbObjectOption.price),
                  }
                : null,
              note: box.note?.trim() || null,
              unitTotal: Number(recalculatedUnitPrice),
            };

            orderBoxData = {
              primaryOrixaName: dbPrimaryOrixa.name,
              primaryOrixaColor: dbPrimaryOrixa.colorHex,
              secondaryOrixaName: dbSecondaryImage ? dbSecondaryImage.orixa.name : null,
              secondaryOrixaColor: dbSecondaryImage ? dbSecondaryImage.orixa.colorHex : null,
              basePrice: recalculatedUnitPrice,
              objectOptionName: dbObjectOption ? dbObjectOption.name : null,
              objectOptionPrice: dbObjectOption ? dbObjectOption.price : null,
              notes: box.note?.trim() || null,
              itemsSnapshot,
            };
          }

          const isBackorder = Boolean(item.isBackorder || currentStock <= 0);

          itemDetails.push({
            productId: product.id,
            variantId: item.variantId,
            productName: product.name,
            variantName,
            unitPrice: price,
            quantity: item.quantity,
            totalPrice: new Prisma.Decimal(price.toString()).mul(item.quantity),
            isBackorder,
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
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            customerName: data.customerName,
            customerEmail: data.customerEmail || null,
            customerPhone: data.customerPhone,
            shippingAddress: shippingAddressJson,
            shippingCost,
            shippingMethod: "A combinar",
            paymentMethod: "WHATSAPP",
            paymentStatus: "a_combinar",
            paymentProvider: null,
            paymentTransactionId: null,
            paymentPaidAt: null,
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
                isBackorder: item.isBackorder,
              })),
            },
            box: orderBoxData
              ? {
                  create: {
                    primaryOrixaName: orderBoxData.primaryOrixaName,
                    primaryOrixaColor: orderBoxData.primaryOrixaColor,
                    secondaryOrixaName: orderBoxData.secondaryOrixaName,
                    secondaryOrixaColor: orderBoxData.secondaryOrixaColor,
                    basePrice: orderBoxData.basePrice,
                    objectOptionName: orderBoxData.objectOptionName,
                    objectOptionPrice: orderBoxData.objectOptionPrice,
                    notes: orderBoxData.notes,
                    itemsSnapshot: orderBoxData.itemsSnapshot,
                  },
                }
              : undefined,
            statusHistory: {
              create: {
                status: "PENDING_PAYMENT",
                note: "Pedido enviado pelo WhatsApp — aguardando confirmação de pagamento",
              },
            },
          },
        });

        return newOrder;
      },
      {
        timeout: 15000,
      }
    );

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
