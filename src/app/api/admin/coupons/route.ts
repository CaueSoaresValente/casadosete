import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const couponSchema = z.object({
  code: z.string().min(3).max(30),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive(),
  minOrderValue: z.number().positive().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  maxUsesPerUser: z.number().int().positive().optional().nullable(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET — list coupons
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.code = { contains: search, mode: "insensitive" };
  }

  const coupons = await prisma.coupon.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
    },
  });

  const serialized = coupons.map((c) => ({
    ...c,
    discountValue: c.discountValue.toString(),
    minOrderValue: c.minOrderValue?.toString() || null,
    startsAt: c.startsAt.toISOString(),
    expiresAt: c.expiresAt?.toISOString() || null,
    createdAt: c.createdAt.toISOString(),
  }));

  return NextResponse.json(serialized);
}

// POST — create coupon
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = couponSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check unique code
    const existing = await prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Código de cupom já existe" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderValue: data.minOrderValue || null,
        maxUses: data.maxUses || null,
        maxUsesPerUser: data.maxUsesPerUser ?? 1,
        startsAt: data.startsAt ? new Date(data.startsAt) : new Date(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json(
      {
        ...coupon,
        discountValue: coupon.discountValue.toString(),
        minOrderValue: coupon.minOrderValue?.toString() || null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Coupon creation error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
