import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const patchBoxObjectOptionSchema = z.object({
  name: z.string().min(1, "Nome não pode ficar vazio").max(100).optional(),
  price: z.number().min(0, "Preço deve ser maior ou igual a 0").optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

function isAdmin(role: string | null | undefined) {
  return role === "ADMIN" || role === "STAFF";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = patchBoxObjectOptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { name, price, sortOrder, isActive } = parsed.data;

    const data: Prisma.BoxObjectOptionUpdateInput = {};
    if (name !== undefined) data.name = name;
    if (price !== undefined) data.price = new Prisma.Decimal(price.toString());
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (isActive !== undefined) data.isActive = isActive;

    const option = await prisma.boxObjectOption.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      ...option,
      price: option.price.toString(),
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Opção de objeto não encontrada" },
        { status: 404 }
      );
    }
    console.error("Error updating box object option:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.boxObjectOption.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Opção de objeto não encontrada" },
        { status: 404 }
      );
    }
    console.error("Error deleting box object option:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
