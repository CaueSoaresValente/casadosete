import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const DEFAULT_SITE_URL = "https://casadosete.vercel.app";

// Normaliza variáveis de ambiente entre Auth.js v5 (AUTH_SECRET/AUTH_URL) e NextAuth v4 (NEXTAUTH_SECRET/NEXTAUTH_URL)
if (!process.env.AUTH_SECRET && process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET;
}
if (!process.env.AUTH_TRUST_HOST) {
  process.env.AUTH_TRUST_HOST = "true";
}

// Garante que NEXTAUTH_URL e AUTH_URL usem sempre o domínio padrão oficial (https://casadosete.vercel.app)
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
if (vercelHost) {
  process.env.NEXTAUTH_URL = `https://${vercelHost}`;
  process.env.AUTH_URL = `https://${vercelHost}`;
} else if (!process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL.includes("localhost") || process.env.NEXTAUTH_URL.includes("127.0.0.1")) {
  process.env.NEXTAUTH_URL = DEFAULT_SITE_URL;
  process.env.AUTH_URL = DEFAULT_SITE_URL;
}

const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
const useSecureCookies = isProduction || (process.env.NEXTAUTH_URL?.startsWith("https://") ?? false);
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "casadosete-auth-secret-key-2026-production",
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}authjs.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: `${useSecureCookies ? "__Host-" : ""}authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: (process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID)?.trim(),
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET)?.trim(),
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "CUSTOMER" as UserRole,
        };
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const cleanEmail = email.trim().toLowerCase();

        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: cleanEmail,
              mode: "insensitive",
            },
          },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role || "CUSTOMER";
      }
      // Garante que o role esteja sempre preenchido no token
      if (!token.role && token.email) {
        try {
          const dbUser = await prisma.user.findFirst({
            where: {
              email: {
                equals: token.email,
                mode: "insensitive",
              },
            },
            select: { id: true, role: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        } catch {
          // fallback silencioso
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || session.user.id;
        session.user.role = (token.role as UserRole) || "CUSTOMER";
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      const siteBaseUrl =
        process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")
          ? process.env.NEXTAUTH_URL
          : DEFAULT_SITE_URL;

      if (url.startsWith("/")) {
        return `${siteBaseUrl}${url}`;
      }
      try {
        const parsed = new URL(url);
        if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
          return `${siteBaseUrl}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
        if (parsed.origin === siteBaseUrl || parsed.origin === baseUrl) {
          return `${siteBaseUrl}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } catch {
        // fallback
      }
      return siteBaseUrl;
    },
  },
});
