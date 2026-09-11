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
    source: order.source,
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
  };

  return NextResponse.json(serialized);
}

// PATCH — update order status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { status, trackingCode, note } = await request.json();

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, source: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    // Update order and create status history entry in transaction
    const updated = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: status || undefined,
          trackingCode: trackingCode || undefined,
          paymentStatus:
            status === "PAYMENT_CONFIRMED"
              ? "CONFIRMED"
              : status === "CANCELLED"
                ? "CANCELLED"
                : undefined,
        },
      });

      if (status && status !== order.status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status,
            note: note || `Status alterado para ${status}`,
            changedBy: "admin",
          },
        });
      }

      const items = await tx.orderItem.findMany({
        where: { orderId: id },
      });

      // WHATSAPP orders: decrement stock only when payment is confirmed (Option A)
      if (
        status === "PAYMENT_CONFIRMED" &&
        order.status !== "PAYMENT_CONFIRMED" &&
        order.source === "WHATSAPP"
      ) {
        for (const item of items) {
          if (item.variantId) {
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

      // If cancelled, restore stock for orders that already had stock decremented
      // (WEBSITE orders: always decremented; IN_PERSON: always decremented;
      //  WHATSAPP: only if was already PAYMENT_CONFIRMED)
      const wasStockDecremented =
        order.source !== "WHATSAPP" ||
        order.status === "PAYMENT_CONFIRMED" ||
        order.status === "PROCESSING" ||
        order.status === "SHIPPED" ||
        order.status === "DELIVERED";

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

