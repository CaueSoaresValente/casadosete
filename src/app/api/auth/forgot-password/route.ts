import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { z } from "zod";
import { sendPasswordResetEmail } from "@/lib/notifications";

const forgotSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "E-mail inválido" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: "insensitive",
        },
      },
    });

    // Se o usuário não existir, por segurança respondemos sucesso genérico para evitar user enumeration
    if (!user) {
      return NextResponse.json({
        message:
          "Se este e-mail estiver cadastrado, você receberá instruções para redefinir sua senha em instantes.",
      });
    }

    // Remove tokens anteriores deste usuário
    await prisma.verificationToken.deleteMany({
      where: { identifier: cleanEmail },
    });

    // Gera token seguro e expiração de 1 hora
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: cleanEmail,
        token,
        expires,
      },
    });

    // Determina a base URL da aplicação respeitando o domínio atual (Vercel / Produção / Localhost)
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const origin = request.headers.get("origin");

    let baseUrl = "";
    if (origin && !origin.includes("localhost")) {
      baseUrl = origin;
    } else if (host && !host.includes("localhost")) {
      baseUrl = `${proto}://${host}`;
    } else if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")) {
      baseUrl = process.env.NEXTAUTH_URL;
    } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      baseUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    } else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      baseUrl = origin || (host ? `${proto}://${host}` : process.env.NEXTAUTH_URL || "http://localhost:3000");
    }

    const resetUrl = `${baseUrl}/redefinir-senha?token=${token}`;

    await sendPasswordResetEmail(cleanEmail, user.name, resetUrl);

    return NextResponse.json({
      message:
        "Se este e-mail estiver cadastrado, você receberá instruções para redefinir sua senha em instantes.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a solicitação." },
      { status: 500 }
    );
  }
}
