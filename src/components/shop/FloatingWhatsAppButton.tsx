"use client";

import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5511976672291";

function WhatsAppIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className={className}
    >
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.476-.15-.676.15-.2.3-.776.978-.952 1.178-.176.2-.351.226-.652.075-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.676-2.084-.176-.301-.019-.464.132-.614.135-.135.301-.351.451-.527.151-.175.2-.3.301-.501.101-.2.05-.376-.025-.526-.075-.15-.677-1.631-.927-2.233-.244-.587-.492-.507-.676-.516l-.577-.01c-.2 0-.526.075-.802.376-.276.301-1.052 1.028-1.052 2.508 0 1.48 1.078 2.909 1.228 3.11.15.2 2.12 3.238 5.137 4.542.718.31 1.278.496 1.716.635.722.23 1.378.197 1.898.12.578-.087 1.78-.727 2.03-1.43.25-.702.25-1.304.175-1.43-.075-.126-.275-.201-.576-.351z" />
      <path d="M12.004 0C5.378 0 0 5.378 0 12.004c0 2.116.553 4.175 1.604 5.996L.06 24l6.186-1.623A11.94 11.94 0 0012.004 24c6.626 0 12.004-5.378 12.004-12.004 0-6.626-5.378-12.004-12.004-12.004zm0 21.792c-1.879 0-3.719-.504-5.327-1.458l-.382-.227-3.957 1.038 1.056-3.859-.249-.396A9.768 9.768 0 012.21 12.004c0-5.4 4.394-9.794 9.794-9.794 5.4 0 9.794 4.394 9.794 9.794 0 5.4-4.394 9.794-9.794 9.794z" />
    </svg>
  );
}

export function FloatingWhatsAppButton() {
  const { items, subtotal } = useCart();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    let text = "";

    if (items.length > 0) {
      const itemsList = items
        .map(
          (item) =>
            `• ${item.quantity}x ${item.name}${
              item.variantName ? ` (${item.variantName})` : ""
            } — ${formatPrice(item.price * item.quantity * 100)}`
        )
        .join("\n");

      text = `Olá, Casa do 7! 🌿\n\nGostaria de finalizar a compra dos seguintes itens:\n\n${itemsList}\n\n*Subtotal: ${formatPrice(
        subtotal * 100
      )}*\n\nComo posso prosseguir com o atendimento e envio?`;
    } else {
      text =
        "Olá, Casa do 7! 🌿 Gostaria de tirar uma dúvida sobre os produtos da loja.";
    }

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      text
    )}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      onClick={handleClick}
      aria-label="Falar pelo WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group shadow-emerald-950/20"
    >
      <div className="relative flex items-center justify-center">
        <WhatsAppIcon className="w-6 h-6 text-white" />
        {items.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-ruby-500 text-white text-[0.65rem] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#25D366] animate-pulse">
            {items.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        )}
      </div>
      <span className="hidden sm:inline-block text-xs font-bold tracking-wide">
        {items.length > 0 ? "Comprar via WhatsApp" : "Atendimento"}
      </span>
    </a>
  );
}
