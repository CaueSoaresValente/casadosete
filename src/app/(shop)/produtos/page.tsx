"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X, Package, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type ProductImage = { url: string; altText: string | null };
type ProductCategory = { category: { name: string; slug: string } };

type Product = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  basePrice: string;
  compareAtPrice: string | null;
  orixa: string | null;
  entidade: string | null;
  isFeatured: boolean;
  images: ProductImage[];
  categories: ProductCategory[];
  inStock: boolean;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 12, total: 0, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [orixa, setOrixa] = useState("");
  const [entidade, setEntidade] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "12",
      sortBy,
      sortOrder,
    });
    if (searchDebounced) params.set("search", searchDebounced);
    if (orixa) params.set("orixa", orixa);
    if (entidade) params.set("entidade", entidade);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);

    try {
      const res = await fetch(`/api/catalog/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setPagination(data.pagination);
      }
    } catch {
      console.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, sortBy, sortOrder, orixa, entidade, minPrice, maxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const clearFilters = () => {
    setSearch("");
    setOrixa("");
    setEntidade("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  const hasFilters = orixa || entidade || minPrice || maxPrice;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-3xl font-bold text-night-900"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Produtos
        </h1>
        <p className="text-night-500 text-sm mt-1">
          {pagination.total} produto{pagination.total !== 1 ? "s" : ""} encontrado{pagination.total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search + Sort + Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar produtos, orixás, entidades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-cream-50 text-sm
                       placeholder:text-text-muted focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        </div>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split("-");
            setSortBy(by);
            setSortOrder(order);
          }}
          className="px-3 py-2.5 rounded-lg border border-border bg-cream-50 text-sm focus:outline-none focus:border-gold-400"
        >
          <option value="createdAt-desc">Mais recentes</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
          <option value="name-asc">A → Z</option>
          <option value="popular-desc">Mais populares</option>
        </select>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
            hasFilters
              ? "border-gold-400 bg-gold-50 text-gold-700"
              : "border-border bg-cream-50 text-night-600"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros {hasFilters && "•"}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white border border-border-light rounded-xl p-4 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-night-700 mb-1">Orixá</label>
              <input
                type="text"
                value={orixa}
                onChange={(e) => setOrixa(e.target.value)}
                placeholder="Ex: Ogum"
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-night-700 mb-1">Entidade</label>
              <input
                type="text"
                value={entidade}
                onChange={(e) => setEntidade(e.target.value)}
                placeholder="Ex: Pomba Gira"
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-night-700 mb-1">Preço mínimo</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="R$ 0"
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-night-700 mb-1">Preço máximo</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Sem limite"
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-sm text-ruby-500 hover:text-ruby-600"
            >
              <X className="w-3.5 h-3.5" /> Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-night-300 mx-auto mb-3" />
          <p className="text-night-500">Nenhum produto encontrado.</p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-gold-600 hover:text-gold-700"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => fetchProducts(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <span className="text-sm text-night-500 px-4">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchProducts(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const price = parseFloat(product.basePrice);
  const comparePrice = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null;
  const hasDiscount = comparePrice && comparePrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group bg-white rounded-xl border border-border-light overflow-hidden hover:shadow-lg hover:border-gold-200 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square bg-cream-100 overflow-hidden">
        {product.images[0] ? (
          <img
            src={product.images[0].url}
            alt={product.images[0].altText || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-night-200" />
          </div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-ruby-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discountPercent}%
          </span>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-night-800 text-xs font-semibold px-3 py-1 rounded-full">
              Esgotado
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {product.categories[0] && (
          <span className="text-[0.65rem] text-gold-600 uppercase tracking-wider font-medium">
            {product.categories[0].category.name}
          </span>
        )}
        <h3 className="text-sm font-medium text-night-800 mt-0.5 line-clamp-2 group-hover:text-gold-700 transition-colors">
          {product.name}
        </h3>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-night-900">
            {formatPrice(price * 100)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-night-400 line-through">
              {formatPrice(comparePrice * 100)}
            </span>
          )}
        </div>
        <p className="text-[0.65rem] text-night-400 mt-0.5">
          até 12x de {formatPrice((price / 12) * 100)}
        </p>
      </div>
    </Link>
  );
}
