"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Truck,
  MapPin,
  User,
  Loader2,
  ArrowLeft,
  Shield,
  Package,
  CheckCircle,
  MessageCircle,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { toast } from "react-toastify";

const WHATSAPP_NUMBER = "5511976672291";

function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.476-.15-.676.15-.2.3-.776.978-.952 1.178-.176.2-.351.226-.652.075-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.676-2.084-.176-.301-.019-.464.132-.614.135-.135.301-.351.451-.527.151-.175.2-.3.301-.501.101-.2.05-.376-.025-.526-.075-.15-.677-1.631-.927-2.233-.244-.587-.492-.507-.676-.516l-.577-.01c-.2 0-.526.075-.802.376-.276.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.11.15.2 2.12 3.238 5.137 4.542.718.31 1.278.496 1.716.635.722.23 1.378.197 1.898.12.578-.087 1.78-.727 2.03-1.43.25-.702.25-1.304.175-1.43-.075-.126-.275-.201-.576-.351z" />
      <path d="M12.004 0C5.378 0 0 5.378 0 12.004c0 2.116.553 4.175 1.604 5.996L.06 24l6.186-1.623A11.94 11.94 0 0012.004 24c6.626 0 12.004-5.378 12.004-12.004 0-6.626-5.378-12.004-12.004-12.004zm0 21.792c-1.879 0-3.719-.504-5.327-1.458l-.382-.227-3.957 1.038 1.056-3.859-.249-.396A9.768 9.768 0 012.21 12.004c0-5.4 4.394-9.794 9.794-9.794 5.4 0 9.794 4.394 9.794 9.794 0 5.4-4.394 9.794-9.794 9.794z" />
    </svg>
  );
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart, removeItem, updateQuantity } = useCart();

  const [step, setStep] = useState(1); // 1: info, 2: endereço
  const [validating, setValidating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const validated = useRef(false);

  // Validate cart items against server on page load
  useEffect(() => {
    if (items.length === 0 || validated.current) {
      setValidating(false);
      return;
    }

    const validateCart = async () => {
      try {
        const res = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
            })),
          }),
        });

        if (!res.ok) {
          setValidating(false);
          return;
        }

        const data = await res.json();

        if (data.hasChanges) {
          for (const result of data.items) {
            if (result.status === "REMOVED") {
              removeItem(result.productId, result.variantId);
            } else if (result.status === "UPDATED") {
              updateQuantity(result.productId, result.variantId, result.quantity);
            }
          }

          for (const warning of data.warnings) {
            toast.warning(warning, { autoClose: 6000 });
          }
        }

        validated.current = true;
      } catch {
        // Validation failed silently
      } finally {
        setValidating(false);
      }
    };

    validateCart();
  }, [items, removeItem, updateQuantity]);

  // Customer info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Address
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);

  const brazilianStates = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
    "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
  ];

  // CEP auto-fill
  const handleCepBlur = async () => {
    const cleanCep = zipCode.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setStreet(data.logradouro || "");
        setNeighborhood(data.bairro || "");
        setCity(data.localidade || "");
        setState(data.uf || "");
      }
    } catch {
      // CEP lookup failed silently
    } finally {
      setLoadingCep(false);
    }
  };

  // Phone mask
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

  // CEP mask
  const handleCepChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) {
      setZipCode(digits);
    } else {
      setZipCode(`${digits.slice(0, 5)}-${digits.slice(5)}`);
    }
  };

  const validateStep1 = () => {
    if (!name.trim() || name.trim().length < 2) {
      setError("Informe seu nome completo");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Informe um e-mail válido");
      return false;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Informe um telefone válido");
      return false;
    }
    setError("");
    return true;
  };

  const validateStep2 = () => {
    if (zipCode.replace(/\D/g, "").length !== 8) {
      setError("Informe um CEP válido");
      return false;
    }
    if (!street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !state) {
      setError("Preencha todos os campos obrigatórios do endereço");
      return false;
    }
    setError("");
    return true;
  };

  const handleWhatsAppCheckout = async () => {
    if (!validateStep2()) return;
    setSubmitting(true);

    try {
      // Register the order in the database before opening WhatsApp
      const res = await fetch("/api/checkout/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          customerEmail: email.trim() || null,
          customerPhone: phone.replace(/\D/g, ""),
          shippingAddress: {
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
            zipCode: zipCode.replace(/\D/g, ""),
          },
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao registrar pedido. Tente novamente.");
        setSubmitting(false);
        return;
      }

      const orderNumber: string = data.orderNumber;

      // Build the WhatsApp message with the order number
      const itemsList = items
        .map(
          (item) =>
            `• ${item.quantity}x ${item.name}${item.variantName ? ` (${item.variantName})` : ""
            } — ${formatPrice(item.price * item.quantity * 100)}`
        )
        .join("\n");

      const addressText = `${street}, ${number}${complement ? `, ${complement}` : ""
        } — ${neighborhood}, ${city}/${state} — CEP: ${zipCode}`;

      const text = `Olá, Casa do 7! 🌿\n\nGostaria de finalizar minha compra:\n\n*🔖 Número do pedido: ${orderNumber}*\n\n*📋 Itens do pedido:*\n${itemsList}\n\n*💰 Subtotal: ${formatPrice(
        subtotal * 100
      )}*\n_(Frete a combinar)_\n\n*👤 Dados do cliente:*\nNome: ${name.trim()}\nE-mail: ${email.trim()}\nTelefone: ${phone}\n\n*📍 Endereço de entrega:*\n${addressText}\n\nComo posso prosseguir com o pagamento e envio? 🙏`;

      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      clearCart();
      toast.success(`Pedido ${orderNumber} registrado! Redirecionando para o WhatsApp...`);
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading while validating cart
  if (validating) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin mx-auto mb-4" />
        <p className="text-night-500 text-sm">Verificando seu carrinho...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-night-200 mx-auto mb-4" />
        <h1
          className="text-2xl font-bold text-night-900 mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Seu carrinho está vazio
        </h1>
        <p className="text-night-500 text-sm mb-6">
          Adicione produtos antes de finalizar a compra.
        </p>
        <Link
          href="/produtos"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium text-sm"
          style={{ backgroundColor: "var(--color-gold-500)" }}
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        href="/produtos"
        className="inline-flex items-center gap-2 text-sm text-night-500 hover:text-gold-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Continuar comprando
      </Link>

      <h1
        className="text-2xl md:text-3xl font-bold text-night-900 mb-8"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Finalizar compra
      </h1>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { n: 1, label: "Dados", icon: User },
          { n: 2, label: "Endereço", icon: MapPin },
          { n: 3, label: "Enviar pelo WhatsApp", icon: MessageCircle },
        ].map(({ n, label, icon: Icon }) => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${step >= n
                  ? "bg-gold-500 text-white"
                  : "bg-night-100 text-night-400"
                }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${step >= n ? "text-night-800" : "text-night-400"
                }`}
            >
              {label}
            </span>
            {n < 3 && (
              <div
                className={`flex-1 h-0.5 rounded ${step > n ? "bg-gold-500" : "bg-night-100"
                  }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          {error && (
            <div className="bg-ruby-50 border border-ruby-200 text-ruby-600 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Step 1: Customer info */}
          {step === 1 && (
            <div className="bg-white rounded-xl border border-night-100 p-5 space-y-4">
              <h2
                className="text-lg font-semibold text-night-800 flex items-center gap-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                <User className="w-5 h-5 text-gold-500" />
                Seus dados
              </h2>

              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Nome completo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-3 py-2.5 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2.5 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Telefone/WhatsApp *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2.5 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                  required
                />
                <p className="text-xs text-night-400 mt-1">
                  Usado para atualizações sobre seu pedido
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => validateStep1() && setStep(2)}
                  className="px-6 py-2.5 rounded-lg text-white font-medium text-sm transition-all hover:shadow-gold"
                  style={{ backgroundColor: "var(--color-gold-500)" }}
                >
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Address */}
          {step === 2 && (
            <div className="bg-white rounded-xl border border-night-100 p-5 space-y-4">
              <h2
                className="text-lg font-semibold text-night-800 flex items-center gap-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                <MapPin className="w-5 h-5 text-gold-500" />
                Endereço de entrega
              </h2>

              <div className="max-w-[10rem]">
                <label className="block text-sm font-medium text-night-700 mb-1">
                  CEP *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => handleCepChange(e.target.value)}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    className="w-full px-3 py-2.5 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                    required
                  />
                  {loadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500 animate-spin" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-night-700 mb-1">
                    Rua *
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-night-700 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Apto, bloco, etc."
                  className="w-full px-3 py-2.5 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-night-700 mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-night-700 mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-night-700 mb-1">
                    Estado *
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                    required
                  >
                    <option value="">UF</option>
                    {brazilianStates.map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* WhatsApp info banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                    <WhatsAppIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Finalize pelo WhatsApp
                    </p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Ao clicar no botão abaixo, seus dados e carrinho serão enviados para o nosso WhatsApp.
                      Nós combinaremos o frete e a forma de pagamento (PIX, transferência, etc.) diretamente com você! 💚
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-sm text-night-600 hover:text-night-800 transition-colors"
                  disabled={submitting}
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleWhatsAppCheckout}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                  style={{ backgroundColor: "#25D366" }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registrando pedido...
                    </>
                  ) : (
                    <>
                      <WhatsAppIcon className="w-5 h-5" />
                      Enviar pedido pelo WhatsApp
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-night-100 p-5 sticky top-24">
            <h3
              className="text-base font-semibold text-night-800 mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Resumo do pedido
            </h3>

            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex gap-3"
                >
                  <div className="w-12 h-12 rounded-lg bg-cream-100 overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-night-200" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-night-800 line-clamp-1">
                      {item.name}
                    </p>
                    {item.variantName && (
                      <p className="text-xs text-night-400">{item.variantName}</p>
                    )}
                    <p className="text-xs text-night-500">
                      {item.quantity}x {formatPrice(item.price * 100)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-night-800 shrink-0">
                    {formatPrice(item.price * item.quantity * 100)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-night-100 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-night-500">Subtotal</span>
                <span className="text-night-800">{formatPrice(subtotal * 100)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-night-500 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> Frete
                </span>
                <span className="text-night-400 text-xs italic">
                  A combinar
                </span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-night-100">
                <span className="text-night-800">Subtotal</span>
                <span className="text-night-900">{formatPrice(subtotal * 100)}</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-4 pt-3 border-t border-night-100 space-y-2">
              <div className="flex items-center gap-2 text-xs text-night-400">
                <Shield className="w-3.5 h-3.5 text-gold-500" />
                Compra 100% segura
              </div>
              <div className="flex items-center gap-2 text-xs text-night-400">
                <CheckCircle className="w-3.5 h-3.5 text-[#25D366]" />
                Pagamento combinado pelo WhatsApp
              </div>
              <div className="flex items-center gap-2 text-xs text-night-400">
                <Truck className="w-3.5 h-3.5 text-gold-500" />
                Frete calculado sob medida para você
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
