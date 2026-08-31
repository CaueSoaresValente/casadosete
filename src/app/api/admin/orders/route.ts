import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search } },
    ];
  }

  if (status) {
    // Admin chose a specific status filter
    where.status = status;
  } else {
    // By default, hide orders that haven't been paid yet
    where.status = { notIn: ["PENDING_PAYMENT"] };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        subtotal: true,
        shippingCost: true,
        discount: true,
        total: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  const serialized = orders.map((o) => ({
    ...o,
    subtotal: o.subtotal.toString(),
    shippingCost: o.shippingCost.toString(),
    discount: o.discount.toString(),
    total: o.total.toString(),
    createdAt: o.createdAt.toISOString(),
  }));

  return NextResponse.json({
    orders: serialized,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
