"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [validating, setValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setIsValidToken(false);
      return;
    }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setIsValidToken(true);
          setUserEmail(data.email);
        } else {
          setIsValidToken(false);
        }
      })
      .catch(() => {
        setIsValidToken(false);
      })
      .finally(() => {
        setValidating(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas informadas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.error || "Erro ao redefinir a senha. O link pode ter expirado.");
      }
    } catch {
      setError("Erro de rede. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin mx-auto mb-3" />
        <p className="text-sm text-night-600">Validando link de recuperação...</p>
      </div>
    );
  }

  if (!token || !isValidToken) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-surface rounded-2xl border border-border p-8 space-y-4">
          <div className="w-14 h-14 bg-ruby-50 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 text-ruby-500" />
          </div>
          <h1
            className="text-2xl font-bold text-night-900"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Link Inválido ou Expirado
          </h1>
          <p className="text-sm text-night-600">
            Este link de recuperação de senha não é mais válido ou já expirou (o link expira em 1 hora por segurança).
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block w-full py-3 px-4 rounded-xl text-white font-medium text-sm transition-opacity shadow-sm hover:opacity-95"
              style={{ backgroundColor: "var(--color-gold-500)" }}
            >
              Solicitar Novo Link de Recuperação
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-surface rounded-2xl border border-border p-8 space-y-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <h1
            className="text-2xl font-bold text-night-900"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Senha Alterada com Sucesso!
          </h1>
          <p className="text-sm text-night-600">
            Sua senha foi redefinida com sucesso. Você será redirecionado para a página de login em alguns segundos...
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block w-full py-3 px-4 rounded-xl text-white font-medium text-sm transition-opacity shadow-sm hover:opacity-95"
              style={{ backgroundColor: "var(--color-gold-500)" }}
            >
              Ir para o Login Agora
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6 text-gold-600" />
        </div>
        <h1
          className="text-2xl font-bold text-night-900 mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Redefinir Senha
        </h1>
        <p className="text-sm text-night-500">
          Crie uma nova senha para a conta <strong>{userEmail}</strong>
        </p>
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 sm:p-8">
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-ruby-50 border border-ruby-200 text-ruby-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-night-700 mb-1.5">
              Nova Senha (mínimo 8 caracteres)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-sm text-night-900 focus:outline-none focus:ring-2 focus:ring-gold-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-night-400 hover:text-night-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-night-700 mb-1.5">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-sm text-night-900 focus:outline-none focus:ring-2 focus:ring-gold-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-night-400 hover:text-night-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-white font-medium text-sm transition-all shadow-sm hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            style={{ backgroundColor: "var(--color-gold-500)" }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando nova senha...
              </>
            ) : (
              "Salvar Nova Senha"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <Loader2 className="w-8 h-8 text-gold-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-night-600">Carregando...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
