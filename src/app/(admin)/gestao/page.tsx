"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Mail,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Eye,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

type DashboardData = {
  orders: { total: number; thisMonth: number; pending: number; growth: number };
  revenue: { total: number; thisMonth: number; growth: number };
  products: { total: number; active: number; lowStock: number };
  customers: { total: number; thisMonth: number };
  leads: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: string;
    status: string;
    paymentMethod: string;
    createdAt: string;
  }>;
};

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: "Aguardando", color: "bg-amber-100 text-amber-700" },
  PAYMENT_CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
  PROCESSING: { label: "Preparando", color: "bg-indigo-100 text-indigo-700" },
  SHIPPED: { label: "Enviado", color: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "Entregue", color: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Cancelado", color: "bg-night-100 text-night-500" },
  REFUNDED: { label: "Reembolsado", color: "bg-ruby-100 text-ruby-600" },
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1
          className="text-2xl font-bold text-night-900"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Dashboard
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-night-100 p-5 animate-pulse"
            >
              <div className="h-4 bg-night-100 rounded w-24 mb-3" />
              <div className="h-8 bg-night-100 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    {
      title: "Receita (mês)",
      value: formatPrice(data.revenue.thisMonth * 100),
      subtitle: `Total: ${formatPrice(data.revenue.total * 100)}`,
      growth: data.revenue.growth,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Pedidos (mês)",
      value: data.orders.thisMonth.toString(),
      subtitle: `Total: ${data.orders.total} | ${data.orders.pending} pendentes`,
      growth: data.orders.growth,
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Produtos ativos",
      value: `${data.products.active} / ${data.products.total}`,
      subtitle: data.products.lowStock > 0
        ? `⚠️ ${data.products.lowStock} com estoque baixo`
        : "Estoque OK",
      icon: Package,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Clientes",
      value: data.customers.total.toString(),
      subtitle: `+${data.customers.thisMonth} este mês | ${data.leads} leads`,
      icon: Users,
      color: "text-gold-600",
      bg: "bg-gold-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-bold text-night-900"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Dashboard
        </h1>
        <span className="text-xs text-night-400">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl border border-night-100 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-night-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    card.bg
                  )}
                >
                  <Icon className={cn("w-4 h-4", card.color)} />
                </div>
              </div>
              <div className="text-2xl font-bold text-night-900 mb-1">
                {card.value}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-night-400">{card.subtitle}</span>
                {card.growth !== undefined && card.growth !== 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-xs font-medium",
                      card.growth > 0 ? "text-emerald-600" : "text-ruby-500"
                    )}
                  >
                    {card.growth > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(card.growth)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-night-100">
          <div className="p-4 border-b border-night-100 flex items-center justify-between">
            <h2
              className="text-sm font-semibold text-night-800"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Pedidos recentes
            </h2>
            <Link
              href="/gestao/pedidos"
              className="text-xs text-gold-600 hover:text-gold-700 font-medium inline-flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-night-50">
            {data.recentOrders.length === 0 ? (
              <div className="p-8 text-center text-night-400 text-sm">
                Nenhum pedido ainda
              </div>
            ) : (
              data.recentOrders.map((order) => {
                const st = statusLabels[order.status] || statusLabels.PENDING_PAYMENT;
                return (
                  <div
                    key={order.id}
                    className="px-4 py-3 flex items-center justify-between hover:bg-night-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-sm font-mono font-medium text-night-800">
                          {order.orderNumber}
                        </span>
                        <span className="block text-xs text-night-400">
                          {order.customerName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "text-[0.65rem] font-medium px-2 py-0.5 rounded-full",
                          st.color
                        )}
                      >
                        {st.label}
                      </span>
                      <span className="text-sm font-semibold text-night-900 min-w-[5rem] text-right">
                        {formatPrice(parseFloat(order.total) * 100)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-night-100 p-4">
          <h2
            className="text-sm font-semibold text-night-800 mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Ações rápidas
          </h2>
          <div className="space-y-2">
            {[
              { label: "Novo produto", href: "/gestao/produtos/novo", icon: Package },
              { label: "Ver pedidos", href: "/gestao/pedidos", icon: ShoppingCart },
              { label: "Leads & alertas", href: "/gestao/leads", icon: Mail },
              { label: "Categorias", href: "/gestao/categorias", icon: Package },
            ].map(({ label, href, icon: ActionIcon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-night-600 hover:bg-gold-50 hover:text-gold-700 transition-colors"
              >
                <ActionIcon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Alerts */}
          {data.products.lowStock > 0 && (
            <div className="mt-4 pt-4 border-t border-night-100">
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-amber-700">
                    Estoque baixo
                  </span>
                  <p className="text-xs text-amber-600 mt-0.5">
                    {data.products.lowStock} variantes com ≤5 unidades
                  </p>
                </div>
              </div>
            </div>
          )}

          {data.orders.pending > 0 && (
            <div className="mt-2">
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-blue-700">
                    Pedidos pendentes
                  </span>
                  <p className="text-xs text-blue-600 mt-0.5">
                    {data.orders.pending} aguardando pagamento
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
