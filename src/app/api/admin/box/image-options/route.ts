import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const boxImageOptionSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  price: z.number().min(0, "Preço não pode ser negativo"),
  imageUrl: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

function isAdmin(role: string | null | undefined) {
  return role === "ADMIN" || role === "STAFF";
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const options = await prisma.boxImageOption.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(
      options.map((option) => ({
        ...option,
        price: option.price.toString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching box image options:", error);
    // Return empty list gracefully if table does not exist yet before db push
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = boxImageOptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { name, price, imageUrl, sortOrder, isActive } = parsed.data;

    const option = await prisma.boxImageOption.create({
      data: {
        name,
        price: new Prisma.Decimal(price.toString()),
        imageUrl: imageUrl || null,
        sortOrder,
        isActive,
      },
    });

    return NextResponse.json(
      {
        ...option,
        price: option.price.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating box image option:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
