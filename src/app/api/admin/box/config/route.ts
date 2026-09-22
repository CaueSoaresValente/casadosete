import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getBoxConfig } from "@/lib/box-config";

const configSchema = z.object({
  minItems: z
    .number()
    .int()
    .positive("Mínimo de unidades deve ser maior que 0")
    .nullable()
    .optional(),
  basePrice: z
    .number()
    .min(0, "Valor base não pode ser negativo")
    .optional(),
  boxImageUrl: z.string().url("URL inválida").nullable().optional(),
});

function isAdmin(role: string | null | undefined) {
  return role === "ADMIN" || role === "STAFF";
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const config = await getBoxConfig();
  return NextResponse.json({
    ...config,
    basePrice: config.basePrice.toString(),
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = configSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { minItems, basePrice, boxImageUrl } = parsed.data;

    const data: Prisma.BoxConfigUpdateInput = {};
    if (minItems !== undefined) data.minItems = minItems;
    if (basePrice !== undefined)
      data.basePrice = new Prisma.Decimal(basePrice.toString());
    if (boxImageUrl !== undefined) data.boxImageUrl = boxImageUrl;

    const config = await prisma.boxConfig.upsert({
      where: { id: "default" },
      update: data,
      create: {
        id: "default",
        minItems: minItems ?? null,
        basePrice: new Prisma.Decimal(
          (basePrice ?? 0).toString()
        ),
        boxImageUrl: boxImageUrl ?? null,
      },
    });

    return NextResponse.json({
      ...config,
      basePrice: config.basePrice.toString(),
    });
  } catch (error) {
    console.error("Error updating box config:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
