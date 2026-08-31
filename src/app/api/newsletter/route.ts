import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  phone: z.string().min(10, "Telefone inválido").optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
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

    const { phone, email, name } = parsed.data;

    if (!phone && !email) {
      return NextResponse.json(
        { error: "Informe pelo menos um telefone ou e-mail" },
        { status: 400 }
      );
    }

    // Check for existing lead by phone or email to avoid duplicates
    const conditions = [];
    if (phone) conditions.push({ phone });
    if (email) conditions.push({ email });

    const existing = await prisma.newsletterLead.findFirst({
      where: { OR: conditions },
    });

    if (existing) {
      // Reactivate if previously deactivated, update name if provided
      await prisma.newsletterLead.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          name: name || existing.name,
          phone: phone || existing.phone,
          email: email || existing.email,
        },
      });
      return NextResponse.json({ success: true, reactivated: true });
    }

    await prisma.newsletterLead.create({
      data: {
        phone: phone || null,
        email: email || null,
        name: name || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json(
      { error: "Erro ao cadastrar" },
      { status: 500 }
    );
  }
}

