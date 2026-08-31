import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET — coupon detail
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: { _count: { select: { orders: true } } },
  });

  if (!coupon) {
    return NextResponse.json({ error: "Cupom não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ...coupon,
    discountValue: coupon.discountValue.toString(),
    minOrderValue: coupon.minOrderValue?.toString() || null,
    startsAt: coupon.startsAt.toISOString(),
    expiresAt: coupon.expiresAt?.toISOString() || null,
    createdAt: coupon.createdAt.toISOString(),
  });
}

// PUT — update coupon
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    // Check code uniqueness if code is being changed
    if (body.code) {
      const existing = await prisma.coupon.findFirst({
        where: { code: body.code.toUpperCase(), id: { not: id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Código de cupom já existe" },
          { status: 400 }
        );
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: body.code ? body.code.toUpperCase() : undefined,
        description: body.description,
        discountType: body.discountType,
        discountValue: body.discountValue,
        minOrderValue: body.minOrderValue || null,
        maxUses: body.maxUses || null,
        maxUsesPerUser: body.maxUsesPerUser,
        startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({
      ...coupon,
      discountValue: coupon.discountValue.toString(),
      minOrderValue: coupon.minOrderValue?.toString() || null,
    });
  } catch (error) {
    console.error("Coupon update error:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE — delete coupon
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Check if coupon has been used in orders
    const usageCount = await prisma.order.count({
      where: { couponId: id },
    });

    if (usageCount > 0) {
      // Just deactivate instead of deleting
      await prisma.coupon.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ deactivated: true });
    }

    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Coupon delete error:", error);
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}

