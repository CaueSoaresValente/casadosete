"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        // Register via API, then sign in
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Erro ao criar conta.");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        setError(
          mode === "login"
            ? "E-mail ou senha inválidos."
            : "Conta criada, mas houve um erro ao entrar. Tente fazer login."
        );
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1
          className="text-2xl font-bold text-night-900 mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
        </h1>
        <p className="text-sm text-night-500">
          {mode === "login"
            ? "Entre para acompanhar pedidos e acessar seus favoritos"
            : "Salve favoritos, acompanhe pedidos e receba ofertas exclusivas"}
        </p>
      </div>

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
          <label
            htmlFor="customer-password"
            className="block text-sm font-medium text-night-700 mb-1.5"
          >
            Senha
          </label>
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
    </div>
  );
}
