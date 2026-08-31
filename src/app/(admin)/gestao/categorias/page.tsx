"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  FolderTree,
  Loader2,
  X,
  Check,
} from "lucide-react";
import { slugify } from "@/lib/utils";
import { toast } from "react-toastify";
import { ConfirmModal } from "@/components/common/ConfirmModal";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children: Category[];
  _count: { products: number };
};

type FormData = {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm: FormData = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    categoryId: string | null;
    categoryName: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    categoryId: null,
    categoryName: "",
    isDeleting: false,
  });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch {
      toast.error("Falha ao carregar categorias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : slugify(name),
    }));
  };

  const openCreateForm = (parentId?: string) => {
    setEditingId(null);
    setForm({ ...emptyForm, parentId: parentId || "" });
    setShowForm(true);
    setError("");
  };

  const openEditForm = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      parentId: cat.parentId || "",
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    });
    setShowForm(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      parentId: form.parentId || null,
      description: form.description || null,
      imageUrl: null,
    };

    try {
      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg = data.error || "Erro ao salvar";
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success(
        editingId
          ? `Categoria "${form.name}" atualizada com sucesso!`
          : `Categoria "${form.name}" criada com sucesso!`
      );
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchCategories();
    } catch {
      setError("Erro de conexão");
      toast.error("Erro de conexão ao salvar categoria");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      categoryId: id,
      categoryName: name,
      isDeleting: false,
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.categoryId) return;
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      const res = await fetch(`/api/admin/categories/${deleteModal.categoryId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao excluir categoria");
        setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
        return;
      }

      toast.success(`Categoria "${deleteModal.categoryName}" excluída com sucesso!`);
      setDeleteModal({
        isOpen: false,
        categoryId: null,
        categoryName: "",
        isDeleting: false,
      });
      fetchCategories();
    } catch {
      toast.error("Erro de conexão ao excluir categoria");
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Flatten categories for parent select
  const allCategories: { id: string; name: string; depth: number }[] = [];
  const flattenCategories = (cats: Category[], depth = 0) => {
    for (const cat of cats) {
      allCategories.push({ id: cat.id, name: cat.name, depth });
      if (cat.children) flattenCategories(cat.children, depth + 1);
    }
  };
  flattenCategories(categories);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-bold text-night-900"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Categorias
          </h1>
          <p className="text-sm text-night-500 mt-1">
            Gerencie as categorias da loja
          </p>
        </div>
        <button
          onClick={() => openCreateForm()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: "var(--color-gold-500)" }}
        >
          <Plus className="w-4 h-4" />
          Nova categoria
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-night-100">
              <h2
                className="text-lg font-semibold text-night-900"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {editingId ? "Editar categoria" : "Nova categoria"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 rounded hover:bg-night-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="bg-ruby-50 border border-ruby-200 text-ruby-600 text-sm px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200 font-mono text-night-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-night-700 mb-1">
                  Categoria pai (opcional)
                </label>
                <select
                  value={form.parentId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, parentId: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                >
                  <option value="">Nenhuma (raiz)</option>
                  {allCategories
                    .filter((c) => c.id !== editingId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {"—".repeat(c.depth)} {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-night-700 mb-1">
                    Ordem
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sortOrder: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                  />
                </div>
                <div className="pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded accent-gold-500"
                    />
                    <span className="text-sm text-night-700">Ativa</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-night-600 hover:bg-night-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-gold-500)" }}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingId ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-night-100 p-8 text-center">
          <FolderTree className="w-10 h-10 text-night-300 mx-auto mb-3" />
          <p className="text-night-500 text-sm">
            Nenhuma categoria cadastrada ainda.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-night-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-night-50">
              <tr>
                <th className="text-left text-xs font-medium text-night-500 uppercase tracking-wider px-4 py-3">
                  Nome
                </th>
                <th className="text-left text-xs font-medium text-night-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                  Slug
                </th>
                <th className="text-center text-xs font-medium text-night-500 uppercase tracking-wider px-4 py-3">
                  Produtos
                </th>
                <th className="text-center text-xs font-medium text-night-500 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-night-500 uppercase tracking-wider px-4 py-3">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-night-100">
              {categories.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  category={cat}
                  depth={0}
                  onEdit={openEditForm}
                  onDelete={openDeleteModal}
                  onAddChild={(parentId) => openCreateForm(parentId)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Custom Styled Confirm Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Excluir categoria"
        message={`Deseja realmente excluir a categoria "${deleteModal.categoryName}"? Subcategorias e produtos vinculados devem ser removidos antes.`}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteModal.isDeleting}
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteModal({
            isOpen: false,
            categoryId: null,
            categoryName: "",
            isDeleting: false,
          })
        }
      />
    </div>
  );
}

function CategoryRow({
  category,
  depth,
  onEdit,
  onDelete,
  onAddChild,
}: {
  category: Category;
  depth: number;
  onEdit: (cat: Category) => void;
  onDelete: (id: string, name: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  return (
    <>
      <tr className="hover:bg-night-50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 1.25}rem` }}>
            {depth > 0 && (
              <ChevronRight className="w-3 h-3 text-night-300 shrink-0" />
            )}
            <span className="text-sm font-medium text-night-800">
              {category.name}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 hidden sm:table-cell">
          <span className="text-xs text-night-400 font-mono">
            {category.slug}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-sm text-night-600">
            {category._count.products}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
              category.isActive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-night-100 text-night-500"
            }`}
          >
            {category.isActive ? "Ativa" : "Inativa"}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => onAddChild(category.id)}
              className="p-1.5 rounded hover:bg-gold-50 text-night-400 hover:text-gold-600 transition-colors"
              title="Adicionar subcategoria"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onEdit(category)}
              className="p-1.5 rounded hover:bg-gold-50 text-night-400 hover:text-gold-600 transition-colors"
              title="Editar"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(category.id, category.name)}
              className="p-1.5 rounded hover:bg-ruby-50 text-night-400 hover:text-ruby-600 transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {category.children?.map((child) => (
        <CategoryRow
          key={child.id}
          category={child}
          depth={depth + 1}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
        />
      ))}
    </>
  );
}
