import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const boxItemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  price: z.number().min(0, "Preço não pode ser negativo"),
  imageUrl: z.string().nullable().optional(),
  maxQuantity: z
    .number()
    .int("Quantidade máxima deve ser um número inteiro")
    .positive("Quantidade máxima deve ser maior que 0")
    .nullable()
    .optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  isPartOfFullBox: z.boolean().default(true),
});

function isAdmin(role: string | null | undefined) {
  return role === "ADMIN" || role === "STAFF";
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const items = await prisma.boxItem.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(
    items.map((item) => ({
      ...item,
      price: item.price.toString(),
    }))
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = boxItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const {
      name,
      price,
      imageUrl,
      maxQuantity,
      sortOrder,
      isActive,
      isPartOfFullBox,
    } = parsed.data;

    const item = await prisma.boxItem.create({
      data: {
        name,
        price: new Prisma.Decimal(price.toString()),
        imageUrl: imageUrl || null,
        maxQuantity: maxQuantity ?? null,
        sortOrder,
        isActive,
        isPartOfFullBox,
      },
    });

    return NextResponse.json(
      {
        ...item,
        price: item.price.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating box item:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
