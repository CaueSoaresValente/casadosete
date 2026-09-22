import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const boxObjectOptionSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  price: z.number().min(0, "Preço deve ser maior ou igual a 0"),
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

  const options = await prisma.boxObjectOption.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(
    options.map((option) => ({
      ...option,
      price: option.price.toString(),
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
    const parsed = boxObjectOptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { name, price, sortOrder, isActive } = parsed.data;

    const option = await prisma.boxObjectOption.create({
      data: {
        name,
        price: new Prisma.Decimal(price.toString()),
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
    console.error("Error creating box object option:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
