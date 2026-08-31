import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Package,
  CreditCard,
  MapPin,
  Clock,
  QrCode,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pedido confirmado — Casa do 7",
};

const paymentIcons: Record<string, typeof CreditCard> = {
  PIX: QrCode,
  CREDIT_CARD: CreditCard,
  DEBIT_CARD: CreditCard,
  BOLETO: Receipt,
};

const paymentLabels: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  BOLETO: "Boleto bancário",
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
    },
  });

  if (!order) notFound();

  const PaymentIcon = paymentIcons[order.paymentMethod] || CreditCard;
  const shippingAddress = order.shippingAddress as {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h1
          className="text-2xl md:text-3xl font-bold text-night-900 mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Pedido confirmado!
        </h1>
        <p className="text-night-500 text-sm">
          Seu pedido <strong className="text-night-800">{order.orderNumber}</strong> foi
          registrado com sucesso.
        </p>
      </div>

      {/* Order details */}
      <div className="bg-white rounded-xl border border-night-100 overflow-hidden mb-6">
        {/* Status */}
        <div className="bg-gold-50 px-5 py-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gold-600" />
          <span className="text-sm font-medium text-gold-700">
            {order.paymentMethod === "PIX"
              ? "Aguardando pagamento via PIX"
              : order.paymentMethod === "BOLETO"
                ? "Aguardando pagamento do boleto"
                : "Pagamento em processamento"}
          </span>
        </div>

        {/* Payment info */}
        {order.paymentMethod === "PIX" && (
          <div className="px-5 py-4 bg-cream-50 border-b border-night-100">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="w-5 h-5 text-gold-600" />
              <span className="text-sm font-semibold text-night-800">
                Pague com PIX
              </span>
            </div>
            <p className="text-xs text-night-500 mb-3">
              O código PIX será enviado para o seu e-mail{" "}
              <strong>{order.customerEmail}</strong>. Você tem até 30 minutos para
              efetuar o pagamento.
            </p>
            <div className="bg-white rounded-lg border border-night-100 p-4 text-center">
              <div className="w-32 h-32 mx-auto bg-night-100 rounded-lg flex items-center justify-center mb-2">
                <QrCode className="w-12 h-12 text-night-300" />
              </div>
              <p className="text-xs text-night-400">
                QR Code será gerado após integração com gateway de pagamento
              </p>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="px-5 py-4">
          <h3 className="text-sm font-semibold text-night-800 mb-3">
            Itens do pedido
          </h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-night-800">{item.productName}</p>
                  {item.variantName && (
                    <p className="text-xs text-night-400">{item.variantName}</p>
                  )}
                  <p className="text-xs text-night-400">
                    Qtd: {item.quantity} × {formatPrice(Number(item.unitPrice) * 100)}
                  </p>
                </div>
                <span className="text-sm font-medium text-night-800">
                  {formatPrice(Number(item.totalPrice) * 100)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="px-5 py-4 border-t border-night-100 bg-night-50 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-night-500">Subtotal</span>
            <span className="text-night-700">{formatPrice(Number(order.subtotal) * 100)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-night-500">Frete</span>
            <span className={Number(order.shippingCost) === 0 ? "text-emerald-600" : "text-night-700"}>
              {Number(order.shippingCost) === 0
                ? "Grátis"
                : formatPrice(Number(order.shippingCost) * 100)}
            </span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600">Desconto</span>
              <span className="text-emerald-600">
                -{formatPrice(Number(order.discount) * 100)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold pt-1.5 border-t border-night-200">
            <span className="text-night-800">Total</span>
            <span className="text-night-900">{formatPrice(Number(order.total) * 100)}</span>
          </div>
        </div>

        {/* Delivery address */}
        <div className="px-5 py-4 border-t border-night-100">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gold-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-night-800">
                Endereço de entrega
              </h3>
              <p className="text-sm text-night-500 mt-0.5">
                {shippingAddress.street}, {shippingAddress.number}
                {shippingAddress.complement
                  ? ` — ${shippingAddress.complement}`
                  : ""}
                <br />
                {shippingAddress.neighborhood}, {shippingAddress.city} —{" "}
                {shippingAddress.state}
                <br />
                CEP: {shippingAddress.zipCode.replace(/(\d{5})(\d{3})/, "$1-$2")}
              </p>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="px-5 py-4 border-t border-night-100">
          <div className="flex items-center gap-2">
            <PaymentIcon className="w-4 h-4 text-gold-500" />
            <span className="text-sm text-night-700">
              {paymentLabels[order.paymentMethod] || order.paymentMethod}
            </span>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="bg-cream-50 rounded-xl border border-border-light p-5 mb-6">
        <h3
          className="text-sm font-semibold text-night-800 mb-3"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Próximos passos
        </h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-sm text-night-600">
            <Package className="w-4 h-4 text-gold-500 mt-0.5 shrink-0" />
            Você receberá atualizações por e-mail e WhatsApp
          </li>
          <li className="flex items-start gap-2 text-sm text-night-600">
            <Clock className="w-4 h-4 text-gold-500 mt-0.5 shrink-0" />
            Após confirmação do pagamento, seu pedido será preparado em até 24h úteis
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Link
          href="/produtos"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-medium text-sm"
          style={{ backgroundColor: "var(--color-gold-500)" }}
        >
          Continuar comprando
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-night-200 text-night-600 font-medium text-sm hover:bg-night-50 transition-colors"
        >
          Voltar à página inicial
        </Link>
      </div>
    </div>
  );
}
