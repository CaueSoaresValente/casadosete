import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  productId: z.string(),
  variantId: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().nullable(),
  phone: z.string().min(10).optional().nullable(),
}).refine((d) => d.email || d.phone, {
  message: "Informe e-mail ou telefone",
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { productId, variantId, email, phone } = parsed.data;

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    await prisma.stockAlert.create({
      data: {
        productId,
        variantId: variantId || null,
        email: email || null,
        phone: phone || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stock alert error:", error);
    return NextResponse.json(
      { error: "Erro ao cadastrar alerta" },
      { status: 500 }
    );
  }
}
