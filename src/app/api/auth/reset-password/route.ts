import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetSchema = z.object({
  token: z.string().min(1, "Token obrigatório"),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
});

// GET /api/auth/reset-password?token=... — Valida se o token ainda é válido
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, error: "Token não fornecido" }, { status: 400 });
  }

  const record = await prisma.verificationToken.findFirst({
    where: { token },
  });

  if (!record || record.expires < new Date()) {
    return NextResponse.json(
      { valid: false, error: "Link de recuperação inválido ou expirado." },
      { status: 400 }
    );
  }

  return NextResponse.json({ valid: true, email: record.identifier });
}

// POST /api/auth/reset-password — Salva a nova senha
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    const record = await prisma.verificationToken.findFirst({
      where: { token },
    });

    if (!record || record.expires < new Date()) {
      return NextResponse.json(
        { error: "Link de recuperação inválido ou expirado. Solicite novamente." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Atualiza a senha do usuário
    await prisma.user.updateMany({
      where: {
        email: {
          equals: record.identifier,
          mode: "insensitive",
        },
      },
      data: {
        passwordHash,
      },
    });

    // Remove todos os tokens deste usuário
    await prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    });

    return NextResponse.json({
      success: true,
      message: "Senha redefinida com sucesso! Você já pode entrar com a nova senha.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Erro interno ao redefinir a senha." },
      { status: 500 }
    );
  }
}
