"use client";

import { Suspense } from "react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";

function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/gestao";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("E-mail ou senha inválidos.");
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-night-800 rounded-xl border border-night-700 p-6 space-y-4"
    >
      <div className="flex items-center justify-center mb-2">
        <div className="p-3 rounded-full bg-night-700">
          <Lock className="w-5 h-5 text-gold-400" />
        </div>
      </div>

      {error && (
        <div className="bg-ruby-500/10 border border-ruby-500/20 text-ruby-300 text-sm px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="admin-email"
          className="block text-sm font-medium text-night-300 mb-1.5"
        >
          E-mail
        </label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-night-600 bg-night-700 text-cream-100 text-sm
                     placeholder:text-night-400
                     focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
          placeholder="casadosete77@gmail.com"
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="block text-sm font-medium text-night-300 mb-1.5"
        >
          Senha
        </label>
        <div className="relative">
          <input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 pr-10 rounded-lg border border-night-600 bg-night-700 text-cream-100 text-sm
                       placeholder:text-night-400
                       focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-night-400 hover:text-night-300"
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
        className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-all
                   disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: "var(--color-gold-500)" }}
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-night-900 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold mb-1"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--color-gold-400)",
            }}
          >
            Casa do 7
          </h1>
          <p className="text-night-400 text-sm">Acesso restrito</p>
        </div>

        {/* Form wrapped in Suspense for useSearchParams */}
        <Suspense
          fallback={
            <div className="bg-night-800 rounded-xl border border-night-700 p-6 flex items-center justify-center h-64">
              <div className="text-night-400 text-sm">Carregando...</div>
            </div>
          }
        >
          <AdminLoginForm />
        </Suspense>

        <p className="text-center text-xs text-night-500 mt-6">
          Área de gestão — acesso restrito a administradores
        </p>
      </div>
    </div>
  );
}
