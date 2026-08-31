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
      select: { id: true, status: true },
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

      // If cancelled, restore stock
      if (status === "CANCELLED" && order.status !== "CANCELLED") {
        const items = await tx.orderItem.findMany({
          where: { orderId: id },
        });

        for (const item of items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
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
    return NextResponse.json(
      { error: "Erro ao atualizar pedido" },
      { status: 500 }
    );
  }
}
