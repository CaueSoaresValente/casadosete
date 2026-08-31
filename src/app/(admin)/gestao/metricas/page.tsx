"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Eye,
  Star,
  Loader2,
} from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";

type MetricsData = {
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

export default function AdminMetricsPage() {
  const [data, setData] = useState<MetricsData | null>(null);
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
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-night-400">
        Erro ao carregar métricas. Recarregue a página.
      </div>
    );
  }

  const avgTicket =
    data.orders.total > 0 ? data.revenue.total / data.orders.total : 0;

  const conversionRate =
    data.customers.total > 0 && data.orders.total > 0
      ? ((data.orders.total / data.customers.total) * 100).toFixed(1)
      : "0";

  const metrics = [
    {
      title: "Receita Total",
      value: formatPrice(data.revenue.total * 100),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Receita do Mês",
      value: formatPrice(data.revenue.thisMonth * 100),
      subtitle: data.revenue.growth
        ? `${data.revenue.growth > 0 ? "+" : ""}${data.revenue.growth}% vs mês passado`
        : undefined,
      growth: data.revenue.growth,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Ticket Médio",
      value: formatPrice(avgTicket * 100),
      subtitle: `Baseado em ${data.orders.total} pedidos`,
      icon: ShoppingCart,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Pedidos do Mês",
      value: data.orders.thisMonth.toString(),
      subtitle: data.orders.growth
        ? `${data.orders.growth > 0 ? "+" : ""}${data.orders.growth}% vs mês passado`
        : undefined,
      growth: data.orders.growth,
      icon: Package,
      color: "text-gold-600",
      bg: "bg-gold-50",
    },
    {
      title: "Total de Clientes",
      value: data.customers.total.toString(),
      subtitle: `+${data.customers.thisMonth} neste mês`,
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Taxa de Conversão",
      value: `${conversionRate}%`,
      subtitle: "Clientes com pedido / Total de clientes",
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-night-900"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Métricas & Relatórios
          </h1>
          <p className="text-sm text-night-500 mt-1">
            Acompanhe o desempenho da sua loja em tempo real
          </p>
        </div>
        <span className="text-xs text-night-400">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.title}
              className="bg-white rounded-xl border border-night-100 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-night-500 uppercase tracking-wider">
                  {metric.title}
                </span>
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    metric.bg
                  )}
                >
                  <Icon className={cn("w-4 h-4", metric.color)} />
                </div>
              </div>
              <div className="text-2xl font-bold text-night-900 mb-1">
                {metric.value}
              </div>
              <div className="flex items-center gap-2">
                {metric.subtitle && (
                  <span className="text-xs text-night-400">
                    {metric.subtitle}
                  </span>
                )}
                {metric.growth !== undefined && metric.growth !== 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-xs font-medium",
                      metric.growth > 0 ? "text-emerald-600" : "text-ruby-500"
                    )}
                  >
                    {metric.growth > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(metric.growth)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products summary */}
        <div className="bg-white rounded-xl border border-night-100 p-5">
          <h2
            className="text-base font-semibold text-night-800 mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Resumo de Produtos
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-night-600">Total de produtos</span>
              <span className="text-sm font-semibold text-night-800">
                {data.products.total}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-night-600">Produtos ativos</span>
              <span className="text-sm font-semibold text-emerald-600">
                {data.products.active}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-night-600">Produtos inativos</span>
              <span className="text-sm font-semibold text-night-400">
                {data.products.total - data.products.active}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-night-600">
                ⚠️ Estoque baixo (≤5 un.)
              </span>
              <span
                className={cn(
                  "text-sm font-semibold",
                  data.products.lowStock > 0
                    ? "text-amber-600"
                    : "text-emerald-600"
                )}
              >
                {data.products.lowStock} variantes
              </span>
            </div>
          </div>
        </div>

        {/* Leads summary */}
        <div className="bg-white rounded-xl border border-night-100 p-5">
          <h2
            className="text-base font-semibold text-night-800 mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Resumo de Captação
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-night-600">Leads (contatos captados)</span>
              <span className="text-sm font-semibold text-night-800">
                {data.leads}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-night-600">
                Clientes cadastrados
              </span>
              <span className="text-sm font-semibold text-night-800">
                {data.customers.total}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-night-600">
                Novos clientes (mês)
              </span>
              <span className="text-sm font-semibold text-emerald-600">
                +{data.customers.thisMonth}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-night-600">
                Pedidos totais
              </span>
              <span className="text-sm font-semibold text-night-800">
                {data.orders.total}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-night-100">
        <div className="p-4 border-b border-night-100">
          <h2
            className="text-base font-semibold text-night-800"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Últimos Pedidos Pagos
          </h2>
        </div>
        <div className="divide-y divide-night-50">
          {data.recentOrders.length === 0 ? (
            <div className="p-8 text-center text-night-400 text-sm">
              Nenhum pedido registrado
            </div>
          ) : (
            data.recentOrders.map((order) => {
              const st =
                statusLabels[order.status] || statusLabels.PENDING_PAYMENT;
              return (
                <div
                  key={order.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-night-50/50 transition-colors"
                >
                  <div>
                    <span className="text-sm font-mono font-medium text-night-800">
                      {order.orderNumber}
                    </span>
                    <span className="block text-xs text-night-400">
                      {order.customerName} •{" "}
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </span>
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
    </div>
  );
}
