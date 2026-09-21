import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET — order detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      statusHistory: {
        orderBy: { createdAt: "desc" },
      },
      paymentHistory: {
        orderBy: { changedAt: "desc" },
      }
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

    const serialized = {
    ...order,
    subtotal: order.subtotal.toString(),
    shippingCost: order.shippingCost.toString(),
    discount: order.discount.toString(),
    total: order.total.toString(),
    paymentAmount: order.paymentAmount ? order.paymentAmount.toString() : null,
    source: order.source,
    carrier: order.carrier || null,
    trackingCode: order.trackingCode || null,
    estimatedDeliveryDate: order.estimatedDeliveryDate
      ? order.estimatedDeliveryDate.toISOString()
      : null,
    modality: order.modality || null,
    internalNotes: order.internalNotes || null,
    customerNotes: order.customerNotes || null,
    paymentStatus: order.paymentStatus || "a_combinar",
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      ...item,
      unitPrice: item.unitPrice.toString(),
      totalPrice: item.totalPrice.toString(),
    })),
    statusHistory: order.statusHistory.map((h) => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
    })),
    paymentHistory: order.paymentHistory.map((h) => ({
      ...h,
      changedAt: h.changedAt.toISOString(),
    })),
  };

  return NextResponse.json(serialized);
}

// PATCH — update order status, payment status, modality, notes and delivery info
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const {
      status,
      paymentStatus,
      modality,
      carrier,
      trackingCode,
      estimatedDeliveryDate,
      internalNotes,
      customerNotes,
      note,
    } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, source: true, paymentStatus: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const { paymentAmount } = body;

    // Update order and create status history entry in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Build dynamic update data
      const updateData: Record<string, unknown> = {};

      if (status !== undefined && status !== null) {
        updateData.status = status;
      }
      if (paymentStatus !== undefined && paymentStatus !== null) {
        updateData.paymentStatus = paymentStatus;
        if (paymentStatus === 'aprovado' && order.paymentStatus !== 'aprovado') {
           updateData.paymentPaidAt = new Date();
           if (paymentAmount !== undefined) {
             updateData.paymentAmount = paymentAmount;
           }
        }
      }
      if (modality !== undefined) {
        updateData.modality = modality || null;
      }
      if (carrier !== undefined) {
        updateData.carrier = carrier ? String(carrier).trim() : null;
      }
      if (trackingCode !== undefined) {
        updateData.trackingCode = trackingCode ? String(trackingCode).trim() : null;
      }
      if (estimatedDeliveryDate !== undefined) {
        updateData.estimatedDeliveryDate = estimatedDeliveryDate
          ? new Date(estimatedDeliveryDate)
          : null;
      }
      if (internalNotes !== undefined) {
        updateData.internalNotes = internalNotes ? String(internalNotes).trim() : null;
      }
      if (customerNotes !== undefined) {
        updateData.customerNotes = customerNotes ? String(customerNotes).trim() : null;
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: updateData,
      });

      const changedBy = session.user.name || session.user.email || "admin";

      if (status && status !== order.status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status,
            note: note || `Status operacional alterado para ${status}`,
            changedBy,
          },
        });
      }

      if (paymentStatus && paymentStatus !== order.paymentStatus) {
        await tx.paymentStatusHistory.create({
          data: {
            orderId: id,
            oldStatus: order.paymentStatus,
            newStatus: paymentStatus,
            observation: note || `Status de pagamento alterado para ${paymentStatus}`,
            changedBy,
          },
        });
      }

      const items = await tx.orderItem.findMany({
        where: { orderId: id },
      });

      // WHATSAPP orders: decrement stock when payment is approved if not already decremented
      const isNowPaymentConfirmed =
        (paymentStatus === "aprovado" ||
          paymentStatus === "APPROVED" ||
          paymentStatus === "CONFIRMED" ||
          status === "PAYMENT_CONFIRMED") &&
        order.paymentStatus !== "aprovado" &&
        order.paymentStatus !== "APPROVED" &&
        order.paymentStatus !== "CONFIRMED" &&
        order.status !== "PAYMENT_CONFIRMED";

      if (isNowPaymentConfirmed && order.source === "WHATSAPP") {
        for (const item of items) {
          if (item.variantId) {
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              select: { stock: true, name: true },
            });
            if (!variant) continue;

            if (item.isBackorder) {
              if (variant.stock > 0) {
                await tx.productVariant.update({
                  where: { id: item.variantId },
                  data: { stock: { decrement: Math.min(item.quantity, variant.stock) } },
                });
              }
            } else {
              const updated = await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { decrement: item.quantity } },
                select: { stock: true, name: true },
              });

              if (updated.stock < 0) {
                throw new Error(
                  `Estoque insuficiente para "${item.productName}" (${updated.name}) ao confirmar pagamento.`
                );
              }
            }
          } else {
            const prod = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stock: true, name: true },
            });
            if (!prod) continue;

            if (item.isBackorder) {
              if (prod.stock > 0) {
                await tx.product.update({
                  where: { id: item.productId },
                  data: { stock: { decrement: Math.min(item.quantity, prod.stock) } },
                });
              }
            } else {
              const updated = await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
                select: { stock: true, name: true },
              });

              if (updated.stock < 0) {
                throw new Error(
                  `Estoque insuficiente para "${item.productName}" ao confirmar pagamento.`
                );
              }
            }
          }
        }
      }

      // If cancelled, restore stock for orders that already had stock decremented
      const wasStockDecremented =
        order.source !== "WHATSAPP" ||
        order.status === "PAYMENT_CONFIRMED" ||
        order.paymentStatus === "aprovado" ||
        order.paymentStatus === "APPROVED" ||
        order.paymentStatus === "CONFIRMED" ||
        order.status === "PROCESSING" ||
        order.status === "SHIPPED" ||
        order.status === "DELIVERED" ||
        order.status === "INVOICED" ||
        order.status === "SEPARATING" ||
        order.status === "PACKING" ||
        order.status === "IN_TRANSIT" ||
        order.status === "READY_FOR_PICKUP" ||
        order.status === "COMPLETED";

      if (status === "CANCELLED" && order.status !== "CANCELLED" && wasStockDecremented) {
        for (const item of items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      return updatedOrder;
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      modality: updated.modality,
      carrier: updated.carrier,
      trackingCode: updated.trackingCode,
      estimatedDeliveryDate: updated.estimatedDeliveryDate
        ? updated.estimatedDeliveryDate.toISOString()
        : null,
      internalNotes: updated.internalNotes,
      customerNotes: updated.customerNotes,
    });
  } catch (error) {
    console.error("Order update error:", error);
    const message = error instanceof Error ? error.message : "Erro ao atualizar pedido";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

