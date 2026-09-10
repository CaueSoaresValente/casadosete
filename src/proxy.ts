import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Proxy (Next.js 16) — substitui middleware.ts
 * 
 * Protege rotas administrativas (/gestao/*) verificando:
 * 1. Existência de sessão válida
 * 2. Role ADMIN ou STAFF no token JWT
 * 
 * Também adiciona headers de segurança a todas as respostas.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================
  // Headers de segurança para TODAS as respostas
  // ============================================
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  // ============================================
  // Proteção da área administrativa
  // ============================================
  if (pathname.startsWith("/gestao")) {
    // Permite acesso à página de login admin sem sessão
    if (pathname === "/gestao/login") {
      return response;
    }

    let session = null;
    try {
      session = await auth();
    } catch (authError) {
      console.error("Erro ao verificar sessão no proxy:", authError);
    }

    if (!session?.user) {
      const loginUrl = new URL("/gestao/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
      // Usuário autenticado mas sem permissão de admin:
      // Redireciona para o login do admin com indicação de erro em vez de tela preta "Acesso negado"
      const loginUrl = new URL("/gestao/login", request.url);
      loginUrl.searchParams.set("error", "unauthorized");
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ============================================
  // Prevent /gestao from being indexed
  // ============================================
  if (pathname.startsWith("/gestao")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|assets/|uploads/).*)",
  ],
};
