import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato #RRGGBB")
    .optional(),
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
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const orixa = await prisma.orixa.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(orixa);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error
    ) {
      const code = (error as { code: string }).code;
      if (code === "P2025") {
        return NextResponse.json({ error: "Orixá não encontrado" }, { status: 404 });
      }
      if (code === "P2002") {
        return NextResponse.json(
          { error: "Já existe um Orixá com esse nome" },
          { status: 409 }
        );
      }
    }
    console.error("Error updating orixa:", error);
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
    await prisma.orixa.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Orixá não encontrado" }, { status: 404 });
    }
    console.error("Error deleting orixa:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
