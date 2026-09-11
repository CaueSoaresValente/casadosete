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
  Plus,
  X,
  Loader2,
  MessageCircle,
  Store,
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
  source: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: string;
  shippingCost: string;
  discount: string;
  total: string;
  createdAt: string;
  _count: { items: number };
};

type ProductSearchResult = {
  id: string;
  name: string;
  basePrice: number;
  stock: number;
  stockUnit: string;
  variants: { id: string; name: string; price: number | null; stock: number }[];
};

type ManualItem = {
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  price: number;
  quantity: number;
  stock: number;
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

const originConfig: Record<string, { label: string; color: string; icon: typeof Store }> = {
  WHATSAPP: {
    label: "Via WhatsApp",
    color: "bg-emerald-100 text-emerald-700",
    icon: MessageCircle,
  },
  IN_PERSON: {
    label: "Presencial",
    color: "bg-violet-100 text-violet-700",
    icon: Store,
  },
};

function OriginBadge({ source }: { source: string }) {
  const config = originConfig[source];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5",
        config.color
      )}
    >
      <Icon className="w-2.5 h-2.5" />
      {config.label}
    </span>
  );
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<Record<string, unknown> | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Manual order modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPayment, setManualPayment] = useState<"PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "BOLETO">("PIX");
  const [manualStatus, setManualStatus] = useState<"PENDING_PAYMENT" | "PAYMENT_CONFIRMED">("PAYMENT_CONFIRMED");
  const [manualNotes, setManualNotes] = useState("");
  const [manualItems, setManualItems] = useState<ManualItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (originFilter) params.set("origin", originFilter);

      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, originFilter]);

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
        const data = await res.json();
        toast.error(data.error || "Erro ao atualizar status do pedido");
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

  // Product search for manual order modal
  const searchProducts = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setProductResults([]);
      return;
    }
    setSearchingProducts(true);
    try {
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(q)}&limit=8&isActive=true`);
      const data = await res.json();
      setProductResults(data.products || []);
    } catch {
      setProductResults([]);
    } finally {
      setSearchingProducts(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(productSearch), 300);
    return () => clearTimeout(t);
  }, [productSearch, searchProducts]);

  const addManualItem = (
    product: ProductSearchResult,
    variant?: ProductSearchResult["variants"][number]
  ) => {
    const variantId = variant?.id ?? null;
    const exists = manualItems.find(
      (i) => i.productId === product.id && i.variantId === variantId
    );
    if (exists) {
      toast.info("Produto já adicionado. Ajuste a quantidade na lista.");
      return;
    }
    const price = variant?.price ?? product.basePrice;
    const stock = variant?.stock ?? product.stock;
    setManualItems((prev) => [
      ...prev,
      {
        productId: product.id,
        variantId,
        productName: product.name,
        variantName: variant?.name ?? null,
        price,
        quantity: 1,
        stock,
      },
    ]);
    setProductSearch("");
    setProductResults([]);
  };

  const updateItemQty = (idx: number, qty: number) => {
    setManualItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, quantity: Math.max(1, qty) } : item))
    );
  };

  const removeManualItem = (idx: number) => {
    setManualItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const manualTotal = manualItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleManualPhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) setManualPhone(digits);
    else if (digits.length <= 7) setManualPhone(`(${digits.slice(0, 2)}) ${digits.slice(2)}`);
    else setManualPhone(`(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`);
  };

  const resetManualModal = () => {
    setManualName("");
    setManualPhone("");
    setManualEmail("");
    setManualPayment("PIX");
    setManualStatus("PAYMENT_CONFIRMED");
    setManualNotes("");
    setManualItems([]);
    setProductSearch("");
    setProductResults([]);
  };

  const submitManualOrder = async () => {
    if (!manualName.trim() || manualName.trim().length < 2) {
      toast.error("Informe o nome do cliente");
      return;
    }
    if (manualPhone.replace(/\D/g, "").length < 10) {
      toast.error("Informe um telefone válido");
      return;
    }
    if (manualItems.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }

    setSubmittingManual(true);
    try {
      const res = await fetch("/api/admin/orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: manualName.trim(),
          customerPhone: manualPhone.replace(/\D/g, ""),
          customerEmail: manualEmail.trim() || null,
          paymentMethod: manualPayment,
          status: manualStatus,
          notes: manualNotes.trim() || undefined,
          items: manualItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao criar pedido");
        return;
      }

      toast.success(`Pedido ${data.orderNumber} criado com sucesso!`);
      setShowManualModal(false);
      resetManualModal();
      fetchOrders();
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setSubmittingManual(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold text-night-900"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Pedidos
        </h1>
        <button
          onClick={() => { resetManualModal(); setShowManualModal(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:shadow-gold hover:scale-[1.01] active:scale-[0.99]"
          style={{ backgroundColor: "var(--color-gold-500)" }}
        >
          <Plus className="w-4 h-4" />
          Pedido presencial
        </button>
      </div>

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
        <select
          value={originFilter}
          onChange={(e) => {
            setOriginFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
        >
          <option value="">Todas as origens</option>
          <option value="WEBSITE">Site</option>
          <option value="WHATSAPP">Via WhatsApp</option>
          <option value="IN_PERSON">Presencial</option>
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
                        <OriginBadge source={order.source} />
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
              <div>
                <h2
                  className="text-lg font-semibold text-night-900"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Pedido {(orderDetail as { orderNumber?: string }).orderNumber || ""}
                </h2>
                <OriginBadge source={(orderDetail as { source?: string }).source || "WEBSITE"} />
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded hover:bg-night-100 text-night-500"
              >
                <X className="w-4 h-4" />
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
                  {(orderDetail as { source?: string }).source === "WHATSAPP" &&
                    (orderDetail as { status?: string }).status === "PENDING_PAYMENT" && (
                      <p className="text-xs text-emerald-600 mt-1">
                        💡 Ao confirmar o pagamento, o estoque será descontado automaticamente.
                      </p>
                    )}
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

      {/* Manual order modal */}
      {showManualModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => { setShowManualModal(false); resetManualModal(); }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
              {/* Modal header */}
              <div className="p-5 border-b border-night-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-violet-600" />
                  <h2
                    className="text-lg font-semibold text-night-900"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Novo pedido presencial
                  </h2>
                </div>
                <button
                  onClick={() => { setShowManualModal(false); resetManualModal(); }}
                  className="p-1.5 rounded hover:bg-night-100 text-night-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Customer info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-night-800">Dados do cliente</h3>
                  <div>
                    <label className="block text-xs font-medium text-night-600 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Nome do cliente"
                      className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-night-600 mb-1">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      value={manualPhone}
                      onChange={(e) => handleManualPhoneChange(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-night-600 mb-1">
                      E-mail (opcional)
                    </label>
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
                    />
                  </div>
                </div>

                {/* Products */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-night-800">Produtos</h3>

                  {/* Product search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Buscar produto por nome..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
                    />
                    {searchingProducts && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500 animate-spin" />
                    )}
                    {/* Search results dropdown */}
                    {productResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-night-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {productResults.map((product) => (
                          <div key={product.id}>
                            {product.variants.length > 0 ? (
                              product.variants.map((variant) => (
                                <button
                                  key={variant.id}
                                  onClick={() => addManualItem(product, variant)}
                                  className="w-full text-left px-3 py-2 hover:bg-night-50 transition-colors text-sm"
                                >
                                  <span className="font-medium text-night-800">
                                    {product.name}
                                  </span>
                                  <span className="text-night-500"> — {variant.name}</span>
                                  <span className="block text-xs text-night-400">
                                    {formatPrice((variant.price ?? product.basePrice) * 100)} · Estoque: {variant.stock}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <button
                                onClick={() => addManualItem(product)}
                                className="w-full text-left px-3 py-2 hover:bg-night-50 transition-colors text-sm"
                              >
                                <span className="font-medium text-night-800">{product.name}</span>
                                <span className="block text-xs text-night-400">
                                  {formatPrice(product.basePrice * 100)} · Estoque: {product.stock}
                                </span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Added items */}
                  {manualItems.length > 0 && (
                    <div className="space-y-2">
                      {manualItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2 rounded-lg border border-night-100 bg-night-50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-night-800 truncate">
                              {item.productName}
                              {item.variantName && (
                                <span className="text-night-500 font-normal"> — {item.variantName}</span>
                              )}
                            </p>
                            <p className="text-xs text-night-400">
                              {formatPrice(item.price * 100)} · Estoque disp.: {item.stock}
                            </p>
                          </div>
                          <div className="flex items-center border border-night-200 rounded bg-white">
                            <button
                              onClick={() => updateItemQty(idx, item.quantity - 1)}
                              className="px-2 py-1 text-night-500 hover:text-night-800 text-xs"
                            >
                              −
                            </button>
                            <span className="px-2 text-sm font-medium text-night-800 min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateItemQty(idx, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              className="px-2 py-1 text-night-500 hover:text-night-800 text-xs disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-night-900 w-20 text-right">
                            {formatPrice(item.price * item.quantity * 100)}
                          </span>
                          <button
                            onClick={() => removeManualItem(idx)}
                            className="p-1 rounded hover:bg-ruby-50 text-night-400 hover:text-ruby-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold text-night-900 pt-1 border-t border-night-100">
                        <span>Total</span>
                        <span>{formatPrice(manualTotal * 100)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment & status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-night-600 mb-1">
                      Forma de pagamento *
                    </label>
                    <select
                      value={manualPayment}
                      onChange={(e) => setManualPayment(e.target.value as typeof manualPayment)}
                      className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
                    >
                      <option value="PIX">PIX</option>
                      <option value="CREDIT_CARD">Cartão de crédito</option>
                      <option value="DEBIT_CARD">Cartão de débito</option>
                      <option value="BOLETO">Dinheiro / Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-night-600 mb-1">
                      Status inicial *
                    </label>
                    <select
                      value={manualStatus}
                      onChange={(e) => setManualStatus(e.target.value as typeof manualStatus)}
                      className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
                    >
                      <option value="PAYMENT_CONFIRMED">Pago (confirmado)</option>
                      <option value="PENDING_PAYMENT">Aguardando pagamento</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-night-600 mb-1">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Notas internas sobre o pedido..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setShowManualModal(false); resetManualModal(); }}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-night-200 text-sm text-night-600 hover:bg-night-50 transition-colors"
                    disabled={submittingManual}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submitManualOrder}
                    disabled={submittingManual || manualItems.length === 0}
                    className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all hover:shadow-gold disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    style={{ backgroundColor: "var(--color-gold-500)" }}
                  >
                    {submittingManual ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar pedido"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

