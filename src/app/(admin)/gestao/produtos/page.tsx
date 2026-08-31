"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  Loader2,
  Eye,
  EyeOff,
  Star,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { toast } from "react-toastify";
import { ConfirmModal } from "@/components/common/ConfirmModal";

type ProductImage = { url: string; altText: string | null };
type ProductCategory = { category: { id: string; name: string } };
type ProductVariant = { id: string; stock: number; price: number | null };

type Product = {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  isActive: boolean;
  isFeatured: boolean;
  stock: number;
  stockUnit: string;
  lowStockThreshold: number;
  createdAt: string;
  images: ProductImage[];
  categories: ProductCategory[];
  variants: ProductVariant[];
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    productId: string | null;
    productName: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    productId: null,
    productName: "",
    isDeleting: false,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (searchDebounced) params.set("search", searchDebounced);

      const res = await fetch(`/api/admin/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setPagination(data.pagination);
      }
    } catch {
      toast.error("Falha ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }, [searchDebounced]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openDeleteModal = (id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      productId: id,
      productName: name,
      isDeleting: false,
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.productId) return;
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));

    try {
      const res = await fetch(`/api/admin/products/${deleteModal.productId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao excluir produto");
        setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
        return;
      }
      const data = await res.json();
      if (data.deactivated) {
        toast.info(data.message || `Produto "${deleteModal.productName}" foi desativado pois possui pedidos vinculados.`);
      } else {
        toast.success(`Produto "${deleteModal.productName}" excluído com sucesso!`);
      }
      setDeleteModal({
        isOpen: false,
        productId: null,
        productName: "",
        isDeleting: false,
      });
      fetchProducts(pagination.page);
    } catch {
      toast.error("Erro de conexão ao excluir produto");
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const totalStock = (variants: ProductVariant[]) =>
    variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl font-bold text-night-900"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Produtos
          </h1>
          <p className="text-sm text-night-500 mt-1">
            {pagination.total} produto{pagination.total !== 1 ? "s" : ""} cadastrado{pagination.total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/gestao/produtos/novo"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors shrink-0"
          style={{ backgroundColor: "var(--color-gold-500)" }}
        >
          <Plus className="w-4 h-4" />
          Novo produto
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-400" />
        </div>
      </div>

      {/* Products table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-night-100 p-8 text-center">
          <Package className="w-10 h-10 text-night-300 mx-auto mb-3" />
          <p className="text-night-500 text-sm">
            {search
              ? "Nenhum produto encontrado para esta busca."
              : "Nenhum produto cadastrado ainda."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-night-100 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-night-50">
                <tr>
                  <th className="text-left text-xs font-medium text-night-500 uppercase tracking-wider px-4 py-3">
                    Produto
                  </th>
                  <th className="text-left text-xs font-medium text-night-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                    Categorias
                  </th>
                  <th className="text-right text-xs font-medium text-night-500 uppercase tracking-wider px-4 py-3">
                    Preço
                  </th>
                  <th className="text-center text-xs font-medium text-night-500 uppercase tracking-wider px-4 py-3">
                    Estoque
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
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-night-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          <img
                            src={product.images[0].url}
                            alt={product.images[0].altText || product.name}
                            className="w-10 h-10 rounded-lg object-cover border border-night-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-night-100 flex items-center justify-center">
                            <Package className="w-4 h-4 text-night-400" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-night-800">
                              {product.name}
                            </span>
                            {product.isFeatured && (
                              <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
                            )}
                          </div>
                          <span className="text-xs text-night-400 font-mono">
                            {product.slug}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {product.categories.map((pc) => (
                          <span
                            key={pc.category.id}
                            className="inline-flex px-1.5 py-0.5 rounded text-xs bg-gold-50 text-gold-700"
                          >
                            {pc.category.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-night-800">
                        {formatPrice(parseFloat(product.basePrice) * 100)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(() => {
                        const stockVal = product.variants.length > 0
                          ? totalStock(product.variants)
                          : product.stock;
                        const unit = product.stockUnit === "kg" ? "kg" : "un";
                        const threshold = product.lowStockThreshold || 2;
                        let colorClass = "text-emerald-600";
                        let icon = "🟢";
                        if (stockVal === 0) {
                          colorClass = "text-ruby-500 font-bold";
                          icon = "🔴";
                        } else if (stockVal <= threshold) {
                          colorClass = "text-amber-600";
                          icon = "🟡";
                        }
                        return (
                          <span className={`text-sm font-medium ${colorClass}`}>
                            {icon} {stockVal} {unit}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-night-100 text-night-500"
                        }`}
                      >
                        {product.isActive ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                        {product.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/gestao/produtos/${product.id}`}
                          className="p-1.5 rounded hover:bg-gold-50 text-night-400 hover:text-gold-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => openDeleteModal(product.id, product.name)}
                          className="p-1.5 rounded hover:bg-ruby-50 text-night-400 hover:text-ruby-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-night-500">
                Página {pagination.page} de {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchProducts(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 text-sm border border-night-200 rounded-lg hover:bg-night-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => fetchProducts(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 text-sm border border-night-200 rounded-lg hover:bg-night-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Custom Styled Confirm Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Excluir produto"
        message={`Deseja realmente excluir o produto "${deleteModal.productName}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteModal.isDeleting}
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteModal({
            isOpen: false,
            productId: null,
            productName: "",
            isDeleting: false,
          })
        }
      />
    </div>
  );
}
