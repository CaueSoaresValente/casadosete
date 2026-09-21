import {
  Clock,
  FileCheck2,
  Package,
  PackageCheck,
  Truck,
  Store,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Globe,
  MessageCircle,
  MapPin,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

// ========================================================================
// 1. STATUS DO PEDIDO (Andamento físico e operacional da venda)
// ========================================================================
export type OrderOperationalStatus =
  | "ORDER_PLACED"
  | "INVOICED"
  | "SEPARATING"
  | "PACKING"
  | "IN_TRANSIT"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED"
  // Compatibilidade com valores legados no banco:
  | "PENDING_PAYMENT"
  | "PAYMENT_CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "REFUNDED";

export interface StatusConfig {
  key: string;
  label: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  icon: LucideIcon;
  step: number; // 1 a 6 para a timeline (ou 0 para cancelado/reembolsado)
}

export const ORDER_STATUS_CONFIG: Record<string, StatusConfig> = {
  ORDER_PLACED: {
    key: "ORDER_PLACED",
    label: "Pedido realizado",
    color: "amber",
    badgeBg: "bg-amber-50 border-amber-200",
    badgeText: "text-amber-800",
    icon: Clock,
    step: 1,
  },
  INVOICED: {
    key: "INVOICED",
    label: "Faturamento",
    color: "blue",
    badgeBg: "bg-blue-50 border-blue-200",
    badgeText: "text-blue-800",
    icon: FileCheck2,
    step: 2,
  },
  SEPARATING: {
    key: "SEPARATING",
    label: "Em separação",
    color: "indigo",
    badgeBg: "bg-indigo-50 border-indigo-200",
    badgeText: "text-indigo-800",
    icon: Package,
    step: 3,
  },
  PACKING: {
    key: "PACKING",
    label: "Embalando",
    color: "purple",
    badgeBg: "bg-purple-50 border-purple-200",
    badgeText: "text-purple-800",
    icon: PackageCheck,
    step: 4,
  },
  IN_TRANSIT: {
    key: "IN_TRANSIT",
    label: "Em entrega",
    color: "sky",
    badgeBg: "bg-sky-50 border-sky-200",
    badgeText: "text-sky-800",
    icon: Truck,
    step: 5,
  },
  READY_FOR_PICKUP: {
    key: "READY_FOR_PICKUP",
    label: "Pronto para retirada",
    color: "teal",
    badgeBg: "bg-teal-50 border-teal-200",
    badgeText: "text-teal-800",
    icon: Store,
    step: 5,
  },
  COMPLETED: {
    key: "COMPLETED",
    label: "Finalizado",
    color: "emerald",
    badgeBg: "bg-emerald-50 border-emerald-200",
    badgeText: "text-emerald-800",
    icon: CheckCircle2,
    step: 6,
  },
  CANCELLED: {
    key: "CANCELLED",
    label: "Cancelado",
    color: "night",
    badgeBg: "bg-night-100 border-night-200",
    badgeText: "text-night-600",
    icon: XCircle,
    step: 0,
  },

  // Mapeamentos retroativos para compatibilidade:
  PENDING_PAYMENT: {
    key: "ORDER_PLACED",
    label: "Pedido realizado",
    color: "amber",
    badgeBg: "bg-amber-50 border-amber-200",
    badgeText: "text-amber-800",
    icon: Clock,
    step: 1,
  },
  PAYMENT_CONFIRMED: {
    key: "INVOICED",
    label: "Faturamento",
    color: "blue",
    badgeBg: "bg-blue-50 border-blue-200",
    badgeText: "text-blue-800",
    icon: FileCheck2,
    step: 2,
  },
  PROCESSING: {
    key: "SEPARATING",
    label: "Em separação",
    color: "indigo",
    badgeBg: "bg-indigo-50 border-indigo-200",
    badgeText: "text-indigo-800",
    icon: Package,
    step: 3,
  },
  SHIPPED: {
    key: "IN_TRANSIT",
    label: "Em entrega",
    color: "sky",
    badgeBg: "bg-sky-50 border-sky-200",
    badgeText: "text-sky-800",
    icon: Truck,
    step: 5,
  },
  DELIVERED: {
    key: "COMPLETED",
    label: "Finalizado",
    color: "emerald",
    badgeBg: "bg-emerald-50 border-emerald-200",
    badgeText: "text-emerald-800",
    icon: CheckCircle2,
    step: 6,
  },
  REFUNDED: {
    key: "CANCELLED",
    label: "Reembolsado",
    color: "ruby",
    badgeBg: "bg-ruby-50 border-ruby-200",
    badgeText: "text-ruby-700",
    icon: RefreshCw,
    step: 0,
  },
};

export function getOrderStatusConfig(status?: string | null): StatusConfig {
  if (!status) return ORDER_STATUS_CONFIG.ORDER_PLACED;
  const upper = status.toUpperCase().trim();
  return (
    ORDER_STATUS_CONFIG[upper] || {
      key: status,
      label: status,
      color: "night",
      badgeBg: "bg-night-100 border-night-200",
      badgeText: "text-night-700",
      icon: HelpCircle,
      step: 1,
    }
  );
}

// Opções disponíveis para seleção pelo administrador na gestão:
export const ADMIN_ORDER_STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ORDER_PLACED", label: "Pedido realizado" },
  { value: "INVOICED", label: "Faturamento" },
  { value: "SEPARATING", label: "Em separação" },
  { value: "PACKING", label: "Embalando" },
  { value: "IN_TRANSIT", label: "Em entrega" },
  { value: "READY_FOR_PICKUP", label: "Pronto para retirada" },
  { value: "COMPLETED", label: "Finalizado" },
  { value: "CANCELLED", label: "Cancelado" },
];

// ========================================================================
// 2. STATUS DO PAGAMENTO (Controle financeiro independente)
//    Valores canônicos: a_combinar, pendente, aprovado, recusado, cancelado, reembolsado
// ========================================================================
export type PaymentStatusType =
  | "a_combinar"
  | "pendente"
  | "aprovado"
  | "recusado"
  | "cancelado"
  | "reembolsado";

export interface PaymentStatusConfig {
  key: PaymentStatusType;
  label: string;
  badgeBg: string;
  badgeText: string;
  icon: LucideIcon;
}

export const PAYMENT_STATUS_CONFIG: Record<string, PaymentStatusConfig> = {
  a_combinar: {
    key: "a_combinar",
    label: "Pagamento a combinar",
    badgeBg: "bg-amber-50 border-amber-200",
    badgeText: "text-amber-800",
    icon: Clock,
  },
  pendente: {
    key: "pendente",
    label: "Pagamento pendente",
    badgeBg: "bg-amber-50 border-amber-200",
    badgeText: "text-amber-800",
    icon: Clock,
  },
  aprovado: {
    key: "aprovado",
    label: "Pagamento aprovado",
    badgeBg: "bg-emerald-50 border-emerald-200",
    badgeText: "text-emerald-800",
    icon: CheckCircle2,
  },
  recusado: {
    key: "recusado",
    label: "Pagamento recusado",
    badgeBg: "bg-ruby-50 border-ruby-200",
    badgeText: "text-ruby-700",
    icon: AlertCircle,
  },
  cancelado: {
    key: "cancelado",
    label: "Pagamento cancelado",
    badgeBg: "bg-night-100 border-night-200",
    badgeText: "text-night-600",
    icon: XCircle,
  },
  reembolsado: {
    key: "reembolsado",
    label: "Pagamento reembolsado",
    badgeBg: "bg-violet-50 border-violet-200",
    badgeText: "text-violet-800",
    icon: RefreshCw,
  },

  // ---- Aliases legados (valores que podem existir no banco antes do backfill) ----
  PENDING: { key: "a_combinar", label: "Pagamento a combinar", badgeBg: "bg-amber-50 border-amber-200", badgeText: "text-amber-800", icon: Clock },
  pending: { key: "a_combinar", label: "Pagamento a combinar", badgeBg: "bg-amber-50 border-amber-200", badgeText: "text-amber-800", icon: Clock },
  CONFIRMED: { key: "aprovado", label: "Pagamento aprovado", badgeBg: "bg-emerald-50 border-emerald-200", badgeText: "text-emerald-800", icon: CheckCircle2 },
  confirmed: { key: "aprovado", label: "Pagamento aprovado", badgeBg: "bg-emerald-50 border-emerald-200", badgeText: "text-emerald-800", icon: CheckCircle2 },
  APPROVED: { key: "aprovado", label: "Pagamento aprovado", badgeBg: "bg-emerald-50 border-emerald-200", badgeText: "text-emerald-800", icon: CheckCircle2 },
  paid: { key: "aprovado", label: "Pagamento aprovado", badgeBg: "bg-emerald-50 border-emerald-200", badgeText: "text-emerald-800", icon: CheckCircle2 },
  CANCELLED: { key: "cancelado", label: "Pagamento cancelado", badgeBg: "bg-night-100 border-night-200", badgeText: "text-night-600", icon: XCircle },
  DECLINED: { key: "recusado", label: "Pagamento recusado", badgeBg: "bg-ruby-50 border-ruby-200", badgeText: "text-ruby-700", icon: AlertCircle },
  REFUNDED: { key: "reembolsado", label: "Pagamento reembolsado", badgeBg: "bg-violet-50 border-violet-200", badgeText: "text-violet-800", icon: RefreshCw },
  refunded: { key: "reembolsado", label: "Pagamento reembolsado", badgeBg: "bg-violet-50 border-violet-200", badgeText: "text-violet-800", icon: RefreshCw },
};

export function getPaymentStatusConfig(paymentStatus?: string | null): PaymentStatusConfig {
  if (!paymentStatus) return PAYMENT_STATUS_CONFIG.a_combinar;
  return (
    PAYMENT_STATUS_CONFIG[paymentStatus] ||
    PAYMENT_STATUS_CONFIG[paymentStatus.toUpperCase().trim()] || {
      key: "a_combinar",
      label: "Status não identificado",
      badgeBg: "bg-night-100 border-night-200",
      badgeText: "text-night-700",
      icon: Clock,
    }
  );
}

export const ADMIN_PAYMENT_STATUS_OPTIONS: Array<{ value: PaymentStatusType; label: string }> = [
  { value: "a_combinar", label: "Pagamento a combinar" },
  { value: "pendente", label: "Pagamento pendente" },
  { value: "aprovado", label: "Pagamento aprovado" },
  { value: "recusado", label: "Pagamento recusado" },
  { value: "cancelado", label: "Pagamento cancelado" },
  { value: "reembolsado", label: "Pagamento reembolsado" },
];

// ========================================================================
// 3. MODALIDADES / ORIGEM DO PEDIDO
// ========================================================================
export type OrderModality =
  | "WEBSITE"
  | "WHATSAPP"
  | "IN_PERSON"
  | "OWN_DELIVERY"
  | "PICKUP"
  | "OTHER";

export interface ModalityConfig {
  key: OrderModality;
  label: string;
  color: string;
  icon: LucideIcon;
  requiresShippingAddress: boolean;
  canHaveTracking: boolean;
}

export const MODALITY_CONFIG: Record<string, ModalityConfig> = {
  WEBSITE: {
    key: "WEBSITE",
    label: "Compra pelo site",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Globe,
    requiresShippingAddress: true,
    canHaveTracking: true,
  },
  WHATSAPP: {
    key: "WHATSAPP",
    label: "Venda pelo WhatsApp",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: MessageCircle,
    requiresShippingAddress: true,
    canHaveTracking: true,
  },
  IN_PERSON: {
    key: "IN_PERSON",
    label: "Venda presencial",
    color: "bg-violet-50 text-violet-700 border-violet-200",
    icon: Store,
    requiresShippingAddress: false,
    canHaveTracking: false,
  },
  OWN_DELIVERY: {
    key: "OWN_DELIVERY",
    label: "Entrega própria",
    color: "bg-amber-50 text-amber-800 border-amber-200",
    icon: Truck,
    requiresShippingAddress: true,
    canHaveTracking: false,
  },
  PICKUP: {
    key: "PICKUP",
    label: "Retirada na loja",
    color: "bg-teal-50 text-teal-800 border-teal-200",
    icon: MapPin,
    requiresShippingAddress: false,
    canHaveTracking: false,
  },
  OTHER: {
    key: "OTHER",
    label: "Outro",
    color: "bg-night-50 text-night-700 border-night-200",
    icon: HelpCircle,
    requiresShippingAddress: true,
    canHaveTracking: true,
  },
};

export function getModalityConfig(modality?: string | null, source?: string | null): ModalityConfig {
  const key = (modality || source || "WEBSITE").toUpperCase().trim();
  return MODALITY_CONFIG[key] || MODALITY_CONFIG.WEBSITE;
}

export const ADMIN_MODALITY_OPTIONS: Array<{ value: OrderModality; label: string }> = [
  { value: "WEBSITE", label: "Compra pelo site" },
  { value: "WHATSAPP", label: "Venda pelo WhatsApp" },
  { value: "IN_PERSON", label: "Venda presencial" },
  { value: "OWN_DELIVERY", label: "Entrega própria" },
  { value: "PICKUP", label: "Retirada na loja" },
  { value: "OTHER", label: "Outro" },
];
