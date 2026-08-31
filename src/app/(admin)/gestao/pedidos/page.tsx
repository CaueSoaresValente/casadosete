"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { toast } from "react-toastify";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: string;
  shippingCost: string;
  discount: string;
  total: string;
  createdAt: string;
  _count: { items: number };
};

const statusConfig: Record<
  string,
  { label: string; color: string; icon: typeof Clock }
> = {
  PENDING_PAYMENT: {
    label: "Aguardando pagamento",
    color: "bg-amber-100 text-amber-700",
    icon: Clock,
  },
  PAYMENT_CONFIRMED: {
    label: "Pagamento confirmado",
    color: "bg-blue-100 text-blue-700",
    icon: CheckCircle2,
  },
  PROCESSING: {
    label: "Em preparação",
    color: "bg-indigo-100 text-indigo-700",
    icon: Package,
  },
  SHIPPED: {
    label: "Enviado",
    color: "bg-purple-100 text-purple-700",
    icon: Truck,
  },
  DELIVERED: {
    label: "Entregue",
    color: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelado",
    color: "bg-night-100 text-night-500",
    icon: XCircle,
  },
  REFUNDED: {
    label: "Reembolsado",
    color: "bg-ruby-100 text-ruby-600",
    icon: RefreshCw,
  },
};

const paymentLabels: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão",
  DEBIT_CARD: "Débito",
  BOLETO: "Boleto",
};

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<Record<string, unknown> | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchOrderDetail = async (orderId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const data = await res.json();
      setOrderDetail(data);
      setSelectedOrder(orderId);
    } catch {
      setOrderDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        toast.error("Erro ao atualizar status do pedido");
        return;
      }

      toast.success("Status do pedido atualizado com sucesso!");
      fetchOrders();
      if (selectedOrder === orderId) {
        fetchOrderDetail(orderId);
      }
    } catch {
      toast.error("Erro de conexão ao atualizar pedido");
    }
  };

  return (
    <div>
      <h1
        className="text-2xl font-bold text-night-900 mb-6"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Pedidos
      </h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-400" />
          <input
            type="text"
            placeholder="Buscar por número, nome ou e-mail..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
        >
          <option value="">Todos os status</option>
          {Object.entries(statusConfig).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-night-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-night-100 bg-night-50">
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                  Pedido
                </th>
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                  Cliente
                </th>
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                  Pagamento
                </th>
                <th className="text-right text-xs font-semibold text-night-500 px-4 py-3">
                  Total
                </th>
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">
                  Data
                </th>
                <th className="text-right text-xs font-semibold text-night-500 px-4 py-3">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-night-400 text-sm">
                    Carregando...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-night-400 text-sm">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const sc = statusConfig[order.status] || statusConfig.PENDING_PAYMENT;
                  const StatusIcon = sc.icon;
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-night-50 hover:bg-night-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-medium text-night-800">
                          {order.orderNumber}
                        </span>
                        <span className="block text-xs text-night-400">
                          {order._count.items} {order._count.items === 1 ? "item" : "itens"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-night-800">{order.customerName}</span>
                        <span className="block text-xs text-night-400">
                          {order.customerPhone}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                            sc.color
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-night-600">
                          {paymentLabels[order.paymentMethod] || order.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-night-900">
                          {formatPrice(parseFloat(order.total) * 100)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-night-500">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => fetchOrderDetail(order.id)}
                          className="p-1.5 rounded hover:bg-night-100 text-night-500 hover:text-gold-600 transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-night-100">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 rounded hover:bg-night-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 text-night-500" />
            </button>
            <span className="text-sm text-night-600">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded hover:bg-night-100 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4 text-night-500" />
            </button>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && orderDetail && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="p-5 border-b border-night-100 flex items-center justify-between">
              <h2
                className="text-lg font-semibold text-night-900"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Pedido {(orderDetail as { orderNumber?: string }).orderNumber || ""}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded hover:bg-night-100 text-night-500"
              >
                ✕
              </button>
            </div>

            {loadingDetail ? (
              <div className="p-8 text-center text-night-400">Carregando...</div>
            ) : (
              <div className="p-5 space-y-5">
                {/* Status update */}
                <div>
                  <label className="block text-sm font-medium text-night-700 mb-1">
                    Atualizar status
                  </label>
                  <select
                    value={(orderDetail as { status?: string }).status || ""}
                    onChange={(e) =>
                      updateOrderStatus(selectedOrder, e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
                  >
                    {Object.entries(statusConfig).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer info */}
                <div>
                  <h3 className="text-sm font-semibold text-night-800 mb-2">
                    Cliente
                  </h3>
                  <p className="text-sm text-night-600">
                    {(orderDetail as { customerName?: string }).customerName}
                  </p>
                  <p className="text-xs text-night-400">
                    {(orderDetail as { customerEmail?: string }).customerEmail}
                  </p>
                  <p className="text-xs text-night-400">
                    {(orderDetail as { customerPhone?: string }).customerPhone}
                  </p>
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-sm font-semibold text-night-800 mb-2">
                    Itens
                  </h3>
                  <div className="space-y-2">
                    {((orderDetail as { items?: Array<{
                      id: string;
                      productName: string;
                      variantName: string | null;
                      quantity: number;
                      unitPrice: string;
                      totalPrice: string;
                    }> }).items || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <div>
                          <span className="text-night-800">
                            {item.productName}
                          </span>
                          {item.variantName && (
                            <span className="text-night-400 text-xs block">
                              {item.variantName}
                            </span>
                          )}
                          <span className="text-night-400 text-xs">
                            {item.quantity}x{" "}
                            {formatPrice(parseFloat(item.unitPrice) * 100)}
                          </span>
                        </div>
                        <span className="font-medium text-night-800">
                          {formatPrice(parseFloat(item.totalPrice) * 100)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t border-night-100 pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-night-500">Subtotal</span>
                    <span>{formatPrice(parseFloat((orderDetail as { subtotal?: string }).subtotal || "0") * 100)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-night-500">Frete</span>
                    <span>{formatPrice(parseFloat((orderDetail as { shippingCost?: string }).shippingCost || "0") * 100)}</span>
                  </div>
                  {parseFloat((orderDetail as { discount?: string }).discount || "0") > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Desconto</span>
                      <span>-{formatPrice(parseFloat((orderDetail as { discount?: string }).discount || "0") * 100)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-night-100">
                    <span>Total</span>
                    <span>{formatPrice(parseFloat((orderDetail as { total?: string }).total || "0") * 100)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
