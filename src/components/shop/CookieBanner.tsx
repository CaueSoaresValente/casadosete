"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";

type CookieConsent = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
};

const COOKIE_CONSENT_KEY = "casa7_cookie_consent";

function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Invalid JSON, treat as no consent
  }
  return null;
}

function storeConsent(consent: CookieConsent) {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    essential: true, // Sempre true — necessário
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      // Mostrar banner após um breve delay para não bloquear a primeira impressão
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const fullConsent: CookieConsent = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    storeConsent(fullConsent);
    setVisible(false);
  };

  const handleAcceptEssential = () => {
    const essentialOnly: CookieConsent = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    storeConsent(essentialOnly);
    setVisible(false);
  };

  const handleSavePreferences = () => {
    storeConsent(consent);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4"
        >
          <div className="max-w-3xl mx-auto bg-surface rounded-xl shadow-xl border border-border-light overflow-hidden">
            <div className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gold-100 shrink-0">
                  <Cookie className="w-5 h-5 text-gold-600" />
                </div>
                <div className="flex-1">
                  <h3
                    className="text-base font-semibold text-night-800 mb-1"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Respeitamos sua privacidade
                  </h3>
                  <p className="text-sm text-night-500 leading-relaxed">
                    Usamos cookies essenciais para o funcionamento do site. Cookies
                    de analytics e marketing são opcionais e só ativados com seu
                    consentimento.{" "}
                    <a
                      href="/politica-privacidade"
                      className="text-gold-600 hover:text-gold-700 underline"
                    >
                      Saiba mais
                    </a>
                  </p>
                </div>
                <button
                  onClick={handleAcceptEssential}
                  className="p-1 rounded hover:bg-night-100 transition-colors shrink-0"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4 text-night-400" />
                </button>
              </div>

              {/* Detailed preferences */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mb-3"
                  >
                    <div className="space-y-3 pt-3 border-t border-border-light">
                      <label className="flex items-center justify-between cursor-not-allowed opacity-70">
                        <div>
                          <p className="text-sm font-medium text-night-700">
                            Essenciais
                          </p>
                          <p className="text-xs text-night-400">
                            Necessários para o funcionamento básico do site
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={true}
                          disabled
                          className="w-4 h-4 rounded accent-gold-500"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-night-700">
                            Analytics
                          </p>
                          <p className="text-xs text-night-400">
                            Nos ajudam a entender como você usa o site
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={consent.analytics}
                          onChange={(e) =>
                            setConsent({ ...consent, analytics: e.target.checked })
                          }
                          className="w-4 h-4 rounded accent-gold-500"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-night-700">
                            Marketing
                          </p>
                          <p className="text-xs text-night-400">
                            Permitem ofertas personalizadas
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={consent.marketing}
                          onChange={(e) =>
                            setConsent({ ...consent, marketing: e.target.checked })
                          }
                          className="w-4 h-4 rounded accent-gold-500"
                        />
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="px-4 py-2 text-sm text-night-500 hover:text-night-700 transition-colors"
                >
                  {showDetails ? "Ocultar opções" : "Personalizar"}
                </button>
                <button
                  onClick={
                    showDetails ? handleSavePreferences : handleAcceptEssential
                  }
                  className="px-4 py-2 text-sm font-medium text-night-700 border border-border rounded-lg hover:bg-surface-hover transition-colors"
                >
                  {showDetails ? "Salvar preferências" : "Apenas essenciais"}
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                  style={{ backgroundColor: "var(--color-gold-500)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "var(--color-gold-600)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "var(--color-gold-500)")
                  }
                >
                  Aceitar todos
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
