"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Tag,
  Plus,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Percent,
  DollarSign,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { toast } from "react-toastify";
import { ConfirmModal } from "@/components/common/ConfirmModal";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: string;
  minOrderValue: string | null;
  maxUses: number | null;
  currentUses: number;
  startsAt: string;
  expiresAt: string | null;
  isActive: boolean;
};

export default function AdminCuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    couponId: string | null;
    couponCode: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    couponId: null,
    couponCode: "",
    isDeleting: false,
  });

  // Form State
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/coupons?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Falha ao carregar cupons");
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const openCreateModal = () => {
    setEditingId(null);
    setCode("");
    setDescription("");
    setDiscountType("PERCENTAGE");
    setDiscountValue("");
    setMinOrderValue("");
    setMaxUses("");
    setExpiresAt("");
    setIsActive(true);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setCode(coupon.code);
    setDescription(coupon.description || "");
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue);
    setMinOrderValue(coupon.minOrderValue || "");
    setMaxUses(coupon.maxUses ? coupon.maxUses.toString() : "");
    setExpiresAt(coupon.expiresAt ? coupon.expiresAt.split("T")[0] : "");
    setIsActive(coupon.isActive);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      const payload = {
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isActive,
      };

      const url = editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || "Erro ao salvar cupom";
        setFormError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      toast.success(
        editingId
          ? `Cupom "${payload.code}" atualizado com sucesso!`
          : `Cupom "${payload.code}" criado com sucesso!`
      );
      setIsModalOpen(false);
      fetchCoupons();
    } catch {
      setFormError("Erro de conexão");
      toast.error("Erro de conexão ao salvar cupom");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (id: string, couponCode: string) => {
    setDeleteModal({
      isOpen: true,
      couponId: id,
      couponCode,
      isDeleting: false,
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.couponId) return;
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      const res = await fetch(`/api/admin/coupons/${deleteModal.couponId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao excluir cupom");
        setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
        return;
      }
      toast.success(`Cupom "${deleteModal.couponCode}" excluído com sucesso!`);
      setDeleteModal({
        isOpen: false,
        couponId: null,
        couponCode: "",
        isDeleting: false,
      });
      fetchCoupons();
    } catch {
      toast.error("Erro ao excluir cupom");
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1
          className="text-2xl font-bold text-night-900"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Cupons de Desconto
        </h1>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium text-sm transition-all hover:shadow-gold"
          style={{ backgroundColor: "var(--color-gold-500)" }}
        >
          <Plus className="w-4 h-4" />
          Novo Cupom
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-400" />
        <input
          type="text"
          placeholder="Buscar por código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-night-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-night-100 bg-night-50">
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">Código</th>
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">Desconto</th>
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">Mínimo</th>
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">Usos</th>
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">Validade</th>
                <th className="text-left text-xs font-semibold text-night-500 px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-night-500 px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-night-400 text-sm">
                    Carregando...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-night-400 text-sm">
                    Nenhum cupom cadastrado
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-night-50 hover:bg-night-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-night-900">
                      {coupon.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-night-800 font-semibold">
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}%`
                        : formatPrice(parseFloat(coupon.discountValue) * 100)}
                    </td>
                    <td className="px-4 py-3 text-sm text-night-600">
                      {coupon.minOrderValue
                        ? formatPrice(parseFloat(coupon.minOrderValue) * 100)
                        : "Sem mínimo"}
                    </td>
                    <td className="px-4 py-3 text-sm text-night-600">
                      {coupon.currentUses} {coupon.maxUses ? `/ ${coupon.maxUses}` : "usos"}
                    </td>
                    <td className="px-4 py-3 text-xs text-night-500">
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString("pt-BR")
                        : "Indeterminado"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          coupon.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-night-100 text-night-500"
                        }`}
                      >
                        {coupon.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEditModal(coupon)}
                        className="p-1.5 rounded hover:bg-night-100 text-night-500 hover:text-gold-600 transition-colors mr-1"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(coupon.id, coupon.code)}
                        className="p-1.5 rounded hover:bg-ruby-50 text-night-500 hover:text-ruby-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h2
              className="text-lg font-bold text-night-900 mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {editingId ? "Editar Cupom" : "Novo Cupom"}
            </h2>

            {formError && (
              <div className="bg-ruby-50 text-ruby-600 text-sm p-3 rounded-lg mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-night-700 mb-1">
                  Código do Cupom *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="EX: OFF10"
                  className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm font-mono focus:outline-none focus:border-gold-400 uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-night-700 mb-1">
                    Tipo de Desconto
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(e.target.value as "PERCENTAGE" | "FIXED")
                    }
                    className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm"
                  >
                    <option value="PERCENTAGE">Porcentagem (%)</option>
                    <option value="FIXED">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-night-700 mb-1">
                    Valor *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "PERCENTAGE" ? "10" : "15.00"}
                    className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-night-700 mb-1">
                    Valor Mínimo do Pedido
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    placeholder="0.00 (opcional)"
                    className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-night-700 mb-1">
                    Limite de Usos
                  </label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Sem limite"
                    className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-night-700 mb-1">
                  Data de Validade
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="couponActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-night-300 text-gold-600 focus:ring-gold-500"
                />
                <label htmlFor="couponActive" className="text-sm text-night-700">
                  Cupom Ativo
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-night-200 text-sm text-night-600 hover:bg-night-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-white font-medium text-sm disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-gold-500)" }}
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Styled Confirm Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Excluir cupom"
        message={`Deseja realmente excluir o cupom "${deleteModal.couponCode}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteModal.isDeleting}
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteModal({
            isOpen: false,
            couponId: null,
            couponCode: "",
            isDeleting: false,
          })
        }
      />
    </div>
  );
}
