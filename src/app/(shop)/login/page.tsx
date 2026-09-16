"use client";

import { useState, Suspense } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, User, Heart, ShoppingBag, LogOut, ShieldCheck, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

type Mode = "login" | "register" | "forgot";

function LoginFormContent() {
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl") || "/";
  const callbackUrl = (() => {
    try {
      if (rawCallbackUrl.startsWith("/")) return rawCallbackUrl;
      const parsed = new URL(rawCallbackUrl);
      return parsed.pathname + parsed.search + parsed.hash || "/";
    } catch {
      return "/";
    }
  })();

  // Se o usuário já estiver conectado, exibe painel informativo em vez do formulário
  if (status === "authenticated" && session?.user) {
    const isStaffOrAdmin = session.user.role === "ADMIN" || session.user.role === "STAFF";
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center mx-auto text-xl font-bold">
            {session.user.name?.charAt(0).toUpperCase() || <User className="w-8 h-8 text-gold-600" />}
          </div>
          <div>
            <h1
              className="text-2xl font-bold text-night-900"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Você já está conectado!
            </h1>
            <p className="text-sm text-night-600 mt-1">
              Olá, <strong>{session.user.name}</strong> ({session.user.email})
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              href="/conta/favoritos"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium text-sm transition-all shadow-sm hover:opacity-95"
              style={{ backgroundColor: "var(--color-gold-500)" }}
            >
              <Heart className="w-4 h-4" />
              Meus Favoritos
            </Link>

            <Link
              href="/produtos"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-night-100 text-night-800 font-medium text-sm hover:bg-night-200 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Continuar Comprando
            </Link>

            {isStaffOrAdmin && (
              <Link
                href="/gestao"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-night-900 text-white font-medium text-sm hover:bg-night-800 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-gold-400" />
                Acessar Painel de Gestão
              </Link>
            )}

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-ruby-600 hover:text-ruby-700 font-medium transition-colors pt-2"
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (mode === "register") {
        // Register via API, then sign in
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: cleanEmail, password }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Erro ao criar conta.");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email: cleanEmail,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(
          mode === "login"
            ? "E-mail ou senha inválidos."
            : "Conta criada, mas houve um erro ao entrar. Tente fazer login."
        );
      } else {
        let targetUrl = callbackUrl || "/";
        if (result?.url) {
          try {
            const parsed = new URL(result.url, window.location.origin);
            targetUrl = parsed.pathname + parsed.search + parsed.hash || "/";
          } catch {
            targetUrl = callbackUrl || "/";
          }
        }
        window.location.href = targetUrl;
      }
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setForgotLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao solicitar recuperação de senha.");
      } else {
        setForgotSuccess(true);
        setForgotMessage(
          data.message ||
            "Se este e-mail estiver cadastrado, você receberá instruções para redefinir sua senha em instantes."
        );
      }
    } catch {
      setError("Erro de rede ao enviar solicitação. Tente novamente.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1
          className="text-2xl font-bold text-night-900 mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {mode === "login"
            ? "Bem-vindo de volta"
            : mode === "register"
            ? "Crie sua conta"
            : "Recuperar senha"}
        </h1>
        <p className="text-sm text-night-500">
          {mode === "login"
            ? "Entre para acompanhar pedidos e acessar seus favoritos"
            : mode === "register"
            ? "Salve favoritos, acompanhe pedidos e receba ofertas exclusivas"
            : "Digite seu e-mail cadastrado e enviaremos um link seguro para você redefinir sua senha."}
        </p>
      </div>

      {mode === "forgot" ? (
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 sm:p-8 space-y-4">
          {forgotSuccess ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-night-900">E-mail Enviado!</h2>
              <p className="text-sm text-night-600 leading-relaxed">
                {forgotMessage}
              </p>
              <p className="text-xs text-night-400">
                Verifique sua caixa de entrada, aba de promoções e pasta de lixo eletrônico (spam).
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setForgotSuccess(false);
                }}
                className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-all shadow-sm hover:opacity-95 mt-4"
                style={{ backgroundColor: "var(--color-gold-500)" }}
              >
                Voltar para o Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              {error && (
                <div className="bg-ruby-50 border border-ruby-200 text-ruby-600 text-sm px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-sm font-medium text-night-700 mb-1.5"
                >
                  E-mail cadastrado
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-cream-50 text-sm
                             placeholder:text-text-muted
                             focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-all hover:shadow-gold
                           disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--color-gold-500)" }}
              >
                {forgotLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando link...
                  </>
                ) : (
                  "Enviar Link de Recuperação"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setForgotSuccess(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-night-600 hover:text-night-900 font-medium transition-colors pt-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o Login
              </button>
            </form>
          )}
        </div>
      ) : (
        <>
          {/* Google login */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-white hover:bg-night-50 text-sm font-medium text-night-700 transition-colors mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar com Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border-light" />
            <span className="text-xs text-night-400">ou</span>
            <div className="flex-1 h-px bg-border-light" />
          </div>

          {/* Credentials form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {error && (
              <div className="bg-ruby-50 border border-ruby-200 text-ruby-600 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {mode === "register" && (
              <div>
                <label
                  htmlFor="customer-name"
                  className="block text-sm font-medium text-night-700 mb-1.5"
                >
                  Nome
                </label>
                <input
                  id="customer-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-cream-50 text-sm
                             placeholder:text-text-muted
                             focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            )}

            <div>
              <label
                htmlFor="customer-email"
                className="block text-sm font-medium text-night-700 mb-1.5"
              >
                E-mail
              </label>
              <input
                id="customer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-cream-50 text-sm
                           placeholder:text-text-muted
                           focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="customer-password"
                  className="block text-sm font-medium text-night-700"
                >
                  Senha
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError("");
                      setForgotSuccess(false);
                    }}
                    className="text-xs text-gold-600 hover:text-gold-700 font-medium transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="customer-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-cream-50 text-sm
                             placeholder:text-text-muted
                             focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-night-400 hover:text-night-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-all hover:shadow-gold
                         disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--color-gold-500)" }}
            >
              {loading
                ? "Aguarde..."
                : mode === "login"
                  ? "Entrar"
                  : "Criar conta"}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-sm text-night-500 mt-6">
            {mode === "login" ? (
              <>
                Não tem conta?{" "}
                <button
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  className="text-gold-600 font-medium hover:text-gold-700 transition-colors"
                >
                  Crie agora
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className="text-gold-600 font-medium hover:text-gold-700 transition-colors"
                >
                  Faça login
                </button>
              </>
            )}
          </p>

          <p className="text-center text-xs text-night-400 mt-4">
            Ao criar uma conta, você concorda com nossos{" "}
            <Link href="/termos-de-uso" className="text-gold-600 hover:underline">
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link
              href="/politica-privacidade"
              className="text-gold-600 hover:underline"
            >
              Política de Privacidade
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-12 flex items-center justify-center min-h-[400px]">
          <div className="text-night-400 text-sm">Carregando...</div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
