import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const orixaSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(80),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato #RRGGBB"),
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

  const orixas = await prisma.orixa.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(orixas);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = orixaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { name, colorHex, sortOrder, isActive } = parsed.data;

    const orixa = await prisma.orixa.create({
      data: { name, colorHex, sortOrder, isActive },
    });

    return NextResponse.json(orixa, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe um Orixá com esse nome" },
        { status: 409 }
      );
    }
    console.error("Error creating orixa:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
