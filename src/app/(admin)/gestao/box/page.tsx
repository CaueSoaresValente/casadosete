"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Pencil, Trash2, Plus, Loader2, Image as ImageIcon } from "lucide-react";
import { ConfirmModal } from "@/components/common/ConfirmModal";

// ─── Types ──────────────────────────────────────────────────────────────────

type Orixa = {
  id: string;
  name: string;
  colorHex: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

type BoxItem = {
  id: string;
  name: string;
  price: string;
  imageUrl: string | null;
  maxQuantity: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

type BoxImageOption = {
  id: string;
  name: string;
  price: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

type BoxObjectOption = {
  id: string;
  name: string;
  price: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

type BoxConfig = {
  id: string;
  minItems: number | null;
  basePrice: string; // Decimal serialized as string
  boxImageUrl: string | null;
  updatedAt?: string;
};

// ─── Empty forms ─────────────────────────────────────────────────────────────

const emptyOrixaForm = {
  name: "",
  colorHex: "#7c3aed",
  sortOrder: 0,
  isActive: true,
};

const emptyItemForm = {
  name: "",
  price: "0.00",
  imageUrl: "",
  maxQuantity: "",
  sortOrder: 0,
  isActive: true,
};

const emptyImageOptionForm = {
  name: "",
  price: "0.00",
  imageUrl: "",
  sortOrder: 0,
  isActive: true,
};

const emptyOptionForm = {
  name: "",
  price: "0.00",
  sortOrder: 0,
  isActive: true,
};

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = "orixas" | "items" | "image-options" | "options" | "config";

// ─── Main page ───────────────────────────────────────────────────────────────

export default function BoxPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("orixas");

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/gestao/login");
    }
  }, [status, router]);

  if (
    status === "loading" ||
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "STAFF")
  ) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-night-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-night-900">Box de Orixá</h1>

      {/* Tabs */}
      <div className="border-b border-night-200">
        <nav className="flex gap-1 -mb-px">
          {[
            { id: "orixas", label: "Orixás" },
            { id: "items", label: "Itens da box" },
            { id: "image-options", label: "Opções de imagem" },
            { id: "options", label: "Opções de objeto" },
            { id: "config", label: "Configuração" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={[
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-gold-500 text-gold-600"
                  : "border-transparent text-night-500 hover:text-night-800 hover:border-night-300",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "orixas" && <OrixasTab />}
      {activeTab === "items" && <BoxItemsTab />}
      {activeTab === "image-options" && <BoxImageOptionsTab />}
      {activeTab === "options" && <BoxObjectOptionsTab />}
      {activeTab === "config" && <ConfigTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OrixasTab
// ═══════════════════════════════════════════════════════════════════════════

function OrixasTab() {
  const [orixas, setOrixas] = useState<Orixa[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyOrixaForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    isDeleting: boolean;
  }>({ isOpen: false, id: "", name: "", isDeleting: false });

  const fetchOrixas = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/box/orixas");
      if (!res.ok) throw new Error("Erro ao carregar");
      const data: Orixa[] = await res.json();
      setOrixas(data);
    } catch {
      toast.error("Erro ao carregar Orixás");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrixas();
  }, [fetchOrixas]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyOrixaForm);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (o: Orixa) => {
    setEditingId(o.id);
    setForm({
      name: o.name,
      colorHex: o.colorHex,
      sortOrder: o.sortOrder,
      isActive: o.isActive,
    });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyOrixaForm);
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const url = editingId
        ? `/api/admin/box/orixas/${editingId}`
        : "/api/admin/box/orixas";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sortOrder: Number(form.sortOrder),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg = data.error || "Erro ao salvar";
        setFormError(msg);
        toast.error(msg);
        return;
      }

      toast.success(
        editingId
          ? `Orixá "${form.name}" atualizado!`
          : `Orixá "${form.name}" criado!`
      );
      closeForm();
      fetchOrixas();
    } catch {
      setFormError("Erro de conexão");
      toast.error("Erro de conexão ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      const res = await fetch(`/api/admin/box/orixas/${deleteModal.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao excluir");
        return;
      }
      toast.success(`Orixá "${deleteModal.name}" excluído.`);
      setDeleteModal({ isOpen: false, id: "", name: "", isDeleting: false });
      fetchOrixas();
    } catch {
      toast.error("Erro de conexão ao excluir");
    } finally {
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-night-800">Orixás</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gold-600 text-white text-sm font-medium rounded-lg hover:bg-gold-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Orixá
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-night-400" />
        </div>
      ) : orixas.length === 0 ? (
        <p className="text-night-400 text-sm py-6 text-center">
          Nenhum Orixá cadastrado.
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-night-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-night-50 border-b border-night-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Cor
                </th>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Nome
                </th>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Ordem
                </th>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-night-50">
              {orixas.map((o) => (
                <tr key={o.id} className="hover:bg-night-50 transition-colors">
                  <td className="px-4 py-3">
                    <span
                      className="inline-block w-7 h-7 rounded-full border border-night-200"
                      style={{ backgroundColor: o.colorHex }}
                      title={o.colorHex}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-night-800">
                    {o.name}
                  </td>
                  <td className="px-4 py-3 text-night-500">{o.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "px-2 py-0.5 rounded-full text-xs font-semibold",
                        o.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-night-100 text-night-500",
                      ].join(" ")}
                    >
                      {o.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(o)}
                        className="p-1.5 rounded hover:bg-night-100 text-night-500 hover:text-night-800 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            id: o.id,
                            name: o.name,
                            isDeleting: false,
                          })
                        }
                        className="p-1.5 rounded hover:bg-red-50 text-night-400 hover:text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => e.target === e.currentTarget && closeForm()}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-night-900 mb-5">
              {editingId ? "Editar Orixá" : "Novo Orixá"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-night-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="Ex.: Oxóssi"
                />
              </div>

              {/* Cor */}
              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Cor principal *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.colorHex}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, colorHex: e.target.value }))
                    }
                    className="w-10 h-10 rounded cursor-pointer border border-night-200 p-0.5"
                  />
                  <input
                    type="text"
                    value={form.colorHex}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((f) => ({ ...f, colorHex: val }));
                    }}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    maxLength={7}
                    className="w-32 px-3 py-2 border border-night-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="#7c3aed"
                  />
                  <span
                    className="w-8 h-8 rounded-full border border-night-200 flex-shrink-0"
                    style={{
                      backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(form.colorHex)
                        ? form.colorHex
                        : "#ccc",
                    }}
                  />
                </div>
                {form.colorHex && !/^#[0-9A-Fa-f]{6}$/.test(form.colorHex) && (
                  <p className="text-red-500 text-xs mt-1">
                    Formato inválido — use #RRGGBB
                  </p>
                )}
              </div>

              {/* Ordem */}
              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Ordem
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sortOrder: Number(e.target.value),
                    }))
                  }
                  className="w-28 px-3 py-2 border border-night-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              {/* Ativo */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="w-4 h-4 accent-gold-600"
                />
                <span className="text-sm text-night-700">Ativo</span>
              </label>

              {formError && <p className="text-red-500 text-sm">{formError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm text-night-600 border border-night-200 rounded-lg hover:bg-night-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !/^#[0-9A-Fa-f]{6}$/.test(form.colorHex)}
                  className="px-4 py-2 text-sm bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingId ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Excluir Orixá"
        message={`Tem certeza que deseja excluir o Orixá "${deleteModal.name}"? Esta ação não pode ser desfeita.`}
        confirmText={deleteModal.isDeleting ? "Excluindo…" : "Excluir"}
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteModal({ isOpen: false, id: "", name: "", isDeleting: false })
        }
        isLoading={deleteModal.isDeleting}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BoxItemsTab
// ═══════════════════════════════════════════════════════════════════════════

function BoxItemsTab() {
  const [items, setItems] = useState<BoxItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyItemForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    isDeleting: boolean;
  }>({ isOpen: false, id: "", name: "", isDeleting: false });

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/box/items");
      if (!res.ok) throw new Error("Erro ao carregar");
      const data: BoxItem[] = await res.json();
      setItems(data);
    } catch {
      toast.error("Erro ao carregar itens da box");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, [fetchItems]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyItemForm);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (item: BoxItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl || "",
      maxQuantity: item.maxQuantity != null ? String(item.maxQuantity) : "",
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyItemForm);
    setFormError("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Falha no upload");
      const data: { url: string } = await res.json();
      setForm((f) => ({ ...f, imageUrl: data.url }));
      toast.success("Foto do item enviada!");
    } catch {
      toast.error("Erro ao enviar foto");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleItemActive = async (item: BoxItem) => {
    const nextActive = !item.isActive;
    // Otimista
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isActive: nextActive } : i))
    );

    try {
      const res = await fetch(`/api/admin/box/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar status");
      toast.success(
        `"${item.name}" agora está ${nextActive ? "ativo" : "inativo"}.`
      );
    } catch {
      toast.error("Erro ao alterar status");
      // Reverter estado se falhar
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isActive: item.isActive } : i
        )
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    const parsedPrice = parseFloat(form.price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError("Preço deve ser um valor numérico maior ou igual a zero.");
      setSaving(false);
      return;
    }

    const parsedMaxQty =
      form.maxQuantity.trim() === ""
        ? null
        : parseInt(form.maxQuantity, 10);

    if (
      parsedMaxQty !== null &&
      (isNaN(parsedMaxQty) || parsedMaxQty < 1)
    ) {
      setFormError("Quantidade máxima deve ser um número inteiro maior que 0.");
      setSaving(false);
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/box/items/${editingId}`
        : "/api/admin/box/items";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          price: parsedPrice,
          imageUrl: form.imageUrl || null,
          maxQuantity: parsedMaxQty,
          sortOrder: Number(form.sortOrder),
          isActive: form.isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg = data.error || "Erro ao salvar item";
        setFormError(msg);
        toast.error(msg);
        return;
      }

      toast.success(
        editingId
          ? `Item "${form.name}" atualizado!`
          : `Item "${form.name}" criado!`
      );
      closeForm();
      fetchItems();
    } catch {
      setFormError("Erro de conexão");
      toast.error("Erro de conexão ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      const res = await fetch(`/api/admin/box/items/${deleteModal.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao excluir");
        return;
      }
      toast.success(`Item "${deleteModal.name}" excluído.`);
      setDeleteModal({ isOpen: false, id: "", name: "", isDeleting: false });
      fetchItems();
    } catch {
      toast.error("Erro de conexão ao excluir");
    } finally {
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-night-800">
            Itens da Box
          </h2>
          <p className="text-xs text-night-500">
            Itens exclusivos do montador da box. Clique no status para ativar/desativar rapidamente quando um item faltar.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gold-600 text-white text-sm font-medium rounded-lg hover:bg-gold-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Item
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-night-400" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-night-400 text-sm py-6 text-center">
          Nenhum item da box cadastrado.
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-night-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-night-50 border-b border-night-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Foto
                </th>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Nome
                </th>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Preço
                </th>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Qtd. Máxima
                </th>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Ordem
                </th>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Status (Clique p/ alternar)
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-night-50">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-night-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    {item.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-lg border border-night-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-night-100 border border-night-200 flex items-center justify-center text-night-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-night-800">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-night-700 font-medium">
                    R${" "}
                    {Number(item.price).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 text-night-500">
                    {item.maxQuantity != null ? (
                      <span className="px-2 py-0.5 bg-night-100 text-night-700 rounded text-xs">
                        Máx: {item.maxQuantity}
                      </span>
                    ) : (
                      <span className="text-night-400 text-xs">Sem limite</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-night-500">{item.sortOrder}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleItemActive(item)}
                      className={[
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border",
                        item.isActive
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
                      ].join(" ")}
                      title={
                        item.isActive
                          ? "Item ativo. Clique para desativar (marcar falta)"
                          : "Item inativo. Clique para reativar"
                      }
                    >
                      <span
                        className={[
                          "w-2 h-2 rounded-full",
                          item.isActive ? "bg-green-500" : "bg-red-400",
                        ].join(" ")}
                      />
                      {item.isActive ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded hover:bg-night-100 text-night-500 hover:text-night-800 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            id: item.id,
                            name: item.name,
                            isDeleting: false,
                          })
                        }
                        className="p-1.5 rounded hover:bg-red-50 text-night-400 hover:text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto p-4"
          onClick={(e) => e.target === e.currentTarget && closeForm()}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-8 p-6">
            <h3 className="text-lg font-bold text-night-900 mb-5">
              {editingId ? "Editar Item da Box" : "Novo Item da Box"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Nome do item *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-night-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="Ex.: Vela de 7 dias"
                />
              </div>

              {/* Preço */}
              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Preço unitário (R$) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-night-500">R$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                    className="w-36 px-3 py-2 border border-night-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Foto do item */}
              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Foto do item
                </label>
                {form.imageUrl && (
                  <div className="mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.imageUrl}
                      alt="Prévia"
                      className="w-24 h-24 object-cover rounded-lg border border-night-200"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-sm border border-night-200 rounded-lg hover:bg-night-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {uploadingImage && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    {uploadingImage ? "Enviando…" : "Escolher foto"}
                  </button>
                  {form.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>

              {/* Quantidade máxima */}
              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Quantidade máxima por box (opcional)
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={form.maxQuantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maxQuantity: e.target.value }))
                  }
                  className="w-36 px-3 py-2 border border-night-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="Sem limite"
                />
                <p className="text-xs text-night-400 mt-1">
                  Deixe vazio para não ter limite de unidades deste item por pedido.
                </p>
              </div>

              {/* Ordem */}
              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Ordem
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sortOrder: Number(e.target.value),
                    }))
                  }
                  className="w-28 px-3 py-2 border border-night-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              {/* Ativo */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="w-4 h-4 accent-gold-600"
                />
                <span className="text-sm text-night-700">Ativo</span>
              </label>

              {formError && <p className="text-red-500 text-sm">{formError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm text-night-600 border border-night-200 rounded-lg hover:bg-night-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-4 py-2 text-sm bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingId ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Excluir Item da Box"
        message={`Tem certeza que deseja excluir o item "${deleteModal.name}"? Os pedidos já feitos mantêm o histórico salvo.`}
        confirmText={deleteModal.isDeleting ? "Excluindo…" : "Excluir"}
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteModal({ isOpen: false, id: "", name: "", isDeleting: false })
        }
        isLoading={deleteModal.isDeleting}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BoxImageOptionsTab
// ═══════════════════════════════════════════════════════════════════════════

function BoxImageOptionsTab() {
  const [options, setOptions] = useState<BoxImageOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyImageOptionForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    isDeleting: boolean;
  }>({ isOpen: false, id: "", name: "", isDeleting: false });

  const fetchOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/box/image-options");
      if (!res.ok) throw new Error("Erro ao carregar");
      const data: BoxImageOption[] = await res.json();
      setOptions(data);
    } catch {
      toast.error("Erro ao carregar opções de imagem");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOptions();
  }, [fetchOptions]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyImageOptionForm);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (opt: BoxImageOption) => {
    setEditingId(opt.id);
    setForm({
      name: opt.name,
      price: opt.price,
      imageUrl: opt.imageUrl || "",
      sortOrder: opt.sortOrder,
      isActive: opt.isActive,
    });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyImageOptionForm);
    setFormError("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Falha no upload");
      const data: { url: string } = await res.json();
      setForm((f) => ({ ...f, imageUrl: data.url }));
      toast.success("Foto da opção de imagem enviada!");
    } catch {
      toast.error("Erro ao enviar foto");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleOptionActive = async (opt: BoxImageOption) => {
    const nextActive = !opt.isActive;
    setOptions((prev) =>
      prev.map((o) => (o.id === opt.id ? { ...o, isActive: nextActive } : o))
    );

    try {
      const res = await fetch(`/api/admin/box/image-options/${opt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar status");
      toast.success(
        `"${opt.name}" agora está ${nextActive ? "ativo" : "inativo"}.`
      );
    } catch {
      toast.error("Erro ao alterar status");
      setOptions((prev) =>
        prev.map((o) => (o.id === opt.id ? { ...o, isActive: opt.isActive } : o))
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    const parsedPrice = parseFloat(form.price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError("Preço deve ser um valor numérico maior ou igual a zero.");
      setSaving(false);
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/box/image-options/${editingId}`
        : "/api/admin/box/image-options";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          price: parsedPrice,
          imageUrl: form.imageUrl || null,
          sortOrder: Number(form.sortOrder),
          isActive: form.isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg = data.error || "Erro ao salvar opção de imagem";
        setFormError(msg);
        toast.error(msg);
        return;
      }

      toast.success(
        editingId
          ? `Opção "${form.name}" atualizada!`
          : `Opção "${form.name}" criada!`
      );
      closeForm();
      fetchOptions();
    } catch {
      setFormError("Erro de comunicação com o servidor.");
      toast.error("Erro de comunicação com o servidor.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (opt: BoxImageOption) => {
    setDeleteModal({
      isOpen: true,
      id: opt.id,
      name: opt.name,
      isDeleting: false,
    });
  };

  const confirmDelete = async () => {
    setDeleteModal((m) => ({ ...m, isDeleting: true }));
    try {
      const res = await fetch(
        `/api/admin/box/image-options/${deleteModal.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success(`Opção "${deleteModal.name}" excluída!`);
      setDeleteModal({ isOpen: false, id: "", name: "", isDeleting: false });
      fetchOptions();
    } catch {
      toast.error("Não foi possível excluir a opção.");
      setDeleteModal((m) => ({ ...m, isDeleting: false }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-night-500">
          Materiais de imagem disponíveis para a box ({options.length})
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors shadow-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nova Opção de Imagem
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-night-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Carregando opções de imagem…
        </div>
      ) : options.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-night-200 rounded-xl text-night-400 text-sm">
          Nenhuma opção de imagem cadastrada ainda.
        </div>
      ) : (
        <div className="bg-white border border-night-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-night-50 border-b border-night-100 text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Foto
                </th>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Material
                </th>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Preço
                </th>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Ordem
                </th>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Status (Clique p/ alternar)
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-night-50">
              {options.map((opt) => (
                <tr
                  key={opt.id}
                  className="hover:bg-night-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    {opt.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={opt.imageUrl}
                        alt={opt.name}
                        className="w-10 h-10 object-cover rounded-lg border border-night-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-night-100 border border-night-200 flex items-center justify-center text-night-400">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-night-800">
                    {opt.name}
                  </td>
                  <td className="px-4 py-3 text-night-700 font-medium">
                    R${" "}
                    {Number(opt.price).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 text-night-500">{opt.sortOrder}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleOptionActive(opt)}
                      className={[
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border",
                        opt.isActive
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
                      ].join(" ")}
                      title={
                        opt.isActive
                          ? "Clique para desativar"
                          : "Clique para ativar"
                      }
                    >
                      <span
                        className={[
                          "w-1.5 h-1.5 rounded-full",
                          opt.isActive ? "bg-green-500" : "bg-red-400",
                        ].join(" ")}
                      />
                      {opt.isActive ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(opt)}
                        className="p-1.5 text-night-400 hover:text-night-700 hover:bg-night-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(opt)}
                        className="p-1.5 text-night-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-night-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-night-900">
              {editingId ? "Editar Opção de Imagem" : "Nova Opção de Imagem"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome do material */}
              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Nome do material *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-night-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="Ex.: Resina, Biscuit"
                />
              </div>

              {/* Preço */}
              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Preço (R$) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-night-500">R$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                    className="w-36 px-3 py-2 border border-night-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Upload de foto */}
              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Foto da opção
                </label>
                <div className="flex items-center gap-3">
                  {form.imageUrl ? (
                    <div className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.imageUrl}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg border border-night-200"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600 transition-colors"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-night-100 border border-night-200 flex items-center justify-center text-night-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-option-upload-input"
                    />
                    <label
                      htmlFor="image-option-upload-input"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-night-200 rounded-lg cursor-pointer hover:bg-night-50 text-night-700 font-medium transition-colors"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Enviando…
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          {form.imageUrl ? "Trocar foto" : "Escolher foto"}
                        </>
                      )}
                    </label>
                    <p className="text-[11px] text-night-400 mt-1">
                      PNG, JPG ou WEBP até 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Ordem */}
              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Ordem
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sortOrder: Number(e.target.value),
                    }))
                  }
                  className="w-28 px-3 py-2 border border-night-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              {/* Ativo */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="w-4 h-4 accent-gold-600"
                />
                <span className="text-sm text-night-700">Ativo</span>
              </label>

              {formError && <p className="text-red-500 text-sm">{formError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm text-night-600 border border-night-200 rounded-lg hover:bg-night-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingId ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Excluir Opção de Imagem"
        message={`Tem certeza que deseja excluir a opção "${deleteModal.name}"? Os pedidos já feitos mantêm o histórico salvo.`}
        confirmText={deleteModal.isDeleting ? "Excluindo…" : "Excluir"}
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteModal({ isOpen: false, id: "", name: "", isDeleting: false })
        }
        isLoading={deleteModal.isDeleting}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BoxObjectOptionsTab
// ═══════════════════════════════════════════════════════════════════════════

function BoxObjectOptionsTab() {
  const [options, setOptions] = useState<BoxObjectOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyOptionForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    isDeleting: boolean;
  }>({ isOpen: false, id: "", name: "", isDeleting: false });

  const fetchOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/box/object-options");
      if (!res.ok) throw new Error("Erro ao carregar");
      const data: BoxObjectOption[] = await res.json();
      setOptions(data);
    } catch {
      toast.error("Erro ao carregar opções de objeto");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOptions();
  }, [fetchOptions]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyOptionForm);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (opt: BoxObjectOption) => {
    setEditingId(opt.id);
    setForm({
      name: opt.name,
      price: opt.price,
      sortOrder: opt.sortOrder,
      isActive: opt.isActive,
    });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyOptionForm);
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    const parsedPrice = parseFloat(form.price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError("Preço deve ser um valor numérico maior ou igual a zero.");
      setSaving(false);
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/box/object-options/${editingId}`
        : "/api/admin/box/object-options";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          price: parsedPrice,
          sortOrder: Number(form.sortOrder),
          isActive: form.isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg = data.error || "Erro ao salvar opção";
        setFormError(msg);
        toast.error(msg);
        return;
      }

      toast.success(
        editingId
          ? `Opção "${form.name}" atualizada!`
          : `Opção "${form.name}" criada!`
      );
      closeForm();
      fetchOptions();
    } catch {
      setFormError("Erro de conexão");
      toast.error("Erro de conexão ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      const res = await fetch(
        `/api/admin/box/object-options/${deleteModal.id}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao excluir");
        return;
      }
      toast.success(`Opção "${deleteModal.name}" excluída.`);
      setDeleteModal({ isOpen: false, id: "", name: "", isDeleting: false });
      fetchOptions();
    } catch {
      toast.error("Erro de conexão ao excluir");
    } finally {
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-night-800">
            Opções de Objeto
          </h2>
          <p className="text-xs text-night-500">
            Opções como &quot;Objeto + pulseira&quot; ou &quot;2 objetos&quot; com preço fixo que soma ao total da box. Os modelos de objeto específicos são definidos posteriormente via WhatsApp.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gold-600 text-white text-sm font-medium rounded-lg hover:bg-gold-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Opção
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-night-400" />
        </div>
      ) : options.length === 0 ? (
        <p className="text-night-400 text-sm py-6 text-center">
          Nenhuma opção de objeto cadastrada.
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-night-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-night-50 border-b border-night-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Nome da Opção
                </th>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Preço Fixo
                </th>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Ordem
                </th>
                <th className="px-4 py-3 text-left font-medium text-night-600">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-night-50">
              {options.map((opt) => (
                <tr
                  key={opt.id}
                  className="hover:bg-night-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-night-800">
                    {opt.name}
                  </td>
                  <td className="px-4 py-3 text-night-700 font-medium">
                    R${" "}
                    {Number(opt.price).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 text-night-500">{opt.sortOrder}</td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "px-2 py-0.5 rounded-full text-xs font-semibold",
                        opt.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-night-100 text-night-500",
                      ].join(" ")}
                    >
                      {opt.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(opt)}
                        className="p-1.5 rounded hover:bg-night-100 text-night-500 hover:text-night-800 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            id: opt.id,
                            name: opt.name,
                            isDeleting: false,
                          })
                        }
                        className="p-1.5 rounded hover:bg-red-50 text-night-400 hover:text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeForm()}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-night-900 mb-5">
              {editingId ? "Editar Opção de Objeto" : "Nova Opção de Objeto"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Nome da opção *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-night-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="Ex.: Objeto + pulseira"
                />
              </div>

              {/* Preço */}
              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Preço fixo obrigatório (R$) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-night-500">R$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    required
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                    className="w-36 px-3 py-2 border border-night-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Ordem */}
              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Ordem
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sortOrder: Number(e.target.value),
                    }))
                  }
                  className="w-28 px-3 py-2 border border-night-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              {/* Ativo */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="w-4 h-4 accent-gold-600"
                />
                <span className="text-sm text-night-700">Ativo</span>
              </label>

              {formError && <p className="text-red-500 text-sm">{formError}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm text-night-600 border border-night-200 rounded-lg hover:bg-night-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingId ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Excluir Opção de Objeto"
        message={`Tem certeza que deseja excluir a opção "${deleteModal.name}"? Os pedidos já feitos mantêm o histórico salvo.`}
        confirmText={deleteModal.isDeleting ? "Excluindo…" : "Excluir"}
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteModal({ isOpen: false, id: "", name: "", isDeleting: false })
        }
        isLoading={deleteModal.isDeleting}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ConfigTab
// ═══════════════════════════════════════════════════════════════════════════

function ConfigTab() {
  const [config, setConfig] = useState<BoxConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local form state (strings for inputs)
  const [minItems, setMinItems] = useState<string>("");
  const [basePrice, setBasePrice] = useState<string>("0");
  const [boxImageUrl, setBoxImageUrl] = useState<string>("");

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/box/config");
      if (!res.ok) throw new Error("Erro ao carregar");
      const data: BoxConfig = await res.json();
      setConfig(data);
      setMinItems(data.minItems != null ? String(data.minItems) : "");
      setBasePrice(data.basePrice ?? "0");
      setBoxImageUrl(data.boxImageUrl ?? "");
    } catch {
      toast.error("Erro ao carregar configuração");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConfig();
  }, [fetchConfig]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Falha no upload");
      const data: { url: string } = await res.json();
      setBoxImageUrl(data.url);
      toast.success("Imagem enviada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const parsedMin = minItems.trim() === "" ? null : parseInt(minItems, 10);
    const parsedPrice = parseFloat(basePrice) || 0;

    if (parsedMin !== null && (isNaN(parsedMin) || parsedMin < 1)) {
      setError("Mínimo de unidades deve ser um número inteiro positivo.");
      setSaving(false);
      return;
    }
    if (parsedPrice < 0) {
      setError("Valor base não pode ser negativo.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/box/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minItems: parsedMin,
          basePrice: parsedPrice,
          boxImageUrl: boxImageUrl || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg = data.error || "Erro ao salvar";
        setError(msg);
        toast.error(msg);
        return;
      }

      const updated: BoxConfig = await res.json();
      setConfig(updated);
      toast.success("Configuração salva!");
    } catch {
      setError("Erro de conexão");
      toast.error("Erro de conexão ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-night-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg">
      <h2 className="text-lg font-semibold text-night-800">
        Configuração da Box
      </h2>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-xl border border-night-100 p-6 space-y-5"
      >
        {/* Mínimo de unidades */}
        <div>
          <label className="block text-sm font-medium text-night-700 mb-1">
            Mínimo de unidades
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={minItems}
            onChange={(e) => setMinItems(e.target.value)}
            className="w-40 px-3 py-2 border border-night-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            placeholder="Sem mínimo"
          />
          <p className="text-xs text-night-400 mt-1">
            Vazio = sem mínimo. Conta o total de unidades escolhidas (não itens
            distintos).
          </p>
        </div>

        {/* Valor base */}
        <div>
          <label className="block text-sm font-medium text-night-700 mb-1">
            Valor base da caixa (R$)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-night-500">R$</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-40 px-3 py-2 border border-night-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
              placeholder="0,00"
            />
          </div>
          <p className="text-xs text-night-400 mt-1">0 = sem valor base.</p>
        </div>

        {/* Foto da box */}
        <div>
          <label className="block text-sm font-medium text-night-700 mb-1">
            Foto da box
          </label>

          {boxImageUrl && (
            <div className="mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={boxImageUrl}
                alt="Foto da box"
                className="w-32 h-32 object-cover rounded-lg border border-night-200"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              type="button"
              disabled={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-sm border border-night-200 rounded-lg hover:bg-night-50 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {uploadingImage && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {uploadingImage ? "Enviando…" : "Escolher foto"}
            </button>
            {boxImageUrl && (
              <button
                type="button"
                onClick={() => setBoxImageUrl("")}
                className="text-xs text-red-500 hover:underline"
              >
                Remover
              </button>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="pt-1">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-gold-600 text-white text-sm font-medium rounded-lg hover:bg-gold-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Salvar configuração
          </button>
        </div>
      </form>

      {config?.updatedAt && (
        <p className="text-xs text-night-400">
          Última atualização:{" "}
          {new Date(config.updatedAt).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}
