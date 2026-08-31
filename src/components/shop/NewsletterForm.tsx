"use client";

import { useState } from "react";
import { Loader2, Phone } from "lucide-react";

export function NewsletterForm() {
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) {
      setPhone(digits);
    } else if (digits.length <= 7) {
      setPhone(`(${digits.slice(0, 2)}) ${digits.slice(2)}`);
    } else {
      setPhone(`(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Informe um número de WhatsApp válido");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao cadastrar");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-4">
        <p className="text-gold-600 font-medium text-sm">
          ✓ WhatsApp cadastrado com sucesso!
        </p>
        <p className="text-night-500 text-xs mt-1">
          Você receberá nossas novidades e ofertas exclusivas no WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-night-400" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="Seu WhatsApp (ex: 11 99999-9999)"
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-cream-50 text-sm
                       placeholder:text-text-muted
                       focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-lg text-white font-medium text-sm shadow-gold hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          style={{ backgroundColor: "var(--color-gold-500)" }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Quero receber ofertas
        </button>
      </form>
      {error && (
        <p className="text-xs text-ruby-500 mt-2">{error}</p>
      )}
      <p className="text-xs text-night-400 mt-3">
        Ao cadastrar, você concorda em receber mensagens com novidades e promoções.{" "}
        <a
          href="/politica-privacidade"
          className="text-gold-600 hover:underline"
        >
          Política de Privacidade
        </a>
      </p>
    </>
  );
}
