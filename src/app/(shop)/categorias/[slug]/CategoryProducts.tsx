"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Package, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type SubCategory = { id: string; name: string; slug: string };
type ParentCategory = { id: string; name: string; slug: string } | null;

type CategoryInfo = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  children: SubCategory[];
  parent: ParentCategory;
};

type ProductImage = { url: string; altText: string | null };
type ProductCategory = { category: { name: string; slug: string } };

type Product = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  basePrice: string;
  compareAtPrice: string | null;
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

export default function CategoryProducts({ category }: { category: CategoryInfo }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 12, total: 0, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "12",
      category: category.slug,
      sortBy,
      sortOrder,
    });

    try {
      const res = await fetch(`/api/catalog/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setPagination(data.pagination);
      }
    } catch {
      console.error("Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [category.slug, sortBy, sortOrder]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-night-400 mb-4 flex-wrap">
        <Link href="/" className="hover:text-gold-600 transition-colors">Início</Link>
        <span>/</span>
        <Link href="/produtos" className="hover:text-gold-600 transition-colors">Produtos</Link>
        {category.parent && (
          <>
            <span>/</span>
            <Link href={`/categorias/${category.parent.slug}`} className="hover:text-gold-600 transition-colors">
              {category.parent.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-night-600">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-3xl font-bold text-night-900"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {category.name}
        </h1>
        {category.description && (
          <p className="text-night-500 text-sm mt-2 max-w-2xl">{category.description}</p>
        )}
      </div>

      {/* Subcategories */}
      {category.children.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {category.children.map((sub) => (
            <Link
              key={sub.id}
              href={`/categorias/${sub.slug}`}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-border-light bg-white
                         hover:border-gold-300 hover:bg-gold-50 hover:text-gold-700 transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {/* Sort */}
      <div className="flex justify-end mb-4">
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split("-");
            setSortBy(by);
            setSortOrder(order);
          }}
          className="px-3 py-2 rounded-lg border border-border bg-cream-50 text-sm focus:outline-none focus:border-gold-400"
        >
          <option value="createdAt-desc">Mais recentes</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
          <option value="name-asc">A → Z</option>
          <option value="popular-desc">Mais populares</option>
        </select>
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-night-300 mx-auto mb-3" />
          <p className="text-night-500">Nenhum produto nesta categoria ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => {
            const price = parseFloat(product.basePrice);
            const comparePrice = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null;
            const hasDiscount = comparePrice && comparePrice > price;

            return (
              <Link
                key={product.id}
                href={`/produtos/${product.slug}`}
                className="group bg-white rounded-xl border border-border-light overflow-hidden hover:shadow-lg hover:border-gold-200 transition-all duration-300"
              >
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
                      -{Math.round(((comparePrice - price) / comparePrice) * 100)}%
                    </span>
                  )}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-night-800 text-xs font-semibold px-3 py-1 rounded-full">Esgotado</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-night-800 line-clamp-2 group-hover:text-gold-700 transition-colors">
                    {product.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-base font-bold text-night-900">{formatPrice(price * 100)}</span>
                    {hasDiscount && (
                      <span className="text-xs text-night-400 line-through">{formatPrice(comparePrice * 100)}</span>
                    )}
                  </div>
                  <p className="text-[0.65rem] text-night-400 mt-0.5">
                    até 12x de {formatPrice((price / 12) * 100)}
                  </p>
                </div>
              </Link>
            );
          })}
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
