"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Package, Loader2, FolderTree } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type SearchProduct = {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  images: { url: string; altText: string | null }[];
};

type SearchCategory = {
  id: string;
  name: string;
  slug: string;
};

type SearchResults = {
  products: SearchProduct[];
  categories: SearchCategory[];
};

export function SearchBar({ className = "" }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setOpen(true);
        }
      } catch {
        console.error("Search failed");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar produtos, orixás, entidades..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results && query.length >= 2) setOpen(true);
          }}
          className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-border bg-cream-50 text-sm
                     placeholder:text-text-muted
                     focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200
                     transition-all"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500 animate-spin" />
        ) : (
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        )}
      </div>

      {/* Dropdown */}
      {open && results && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-light rounded-xl shadow-xl z-50 overflow-hidden max-h-[400px] overflow-y-auto">
          {results.products.length === 0 && results.categories.length === 0 ? (
            <div className="p-4 text-center text-sm text-night-400">
              Nenhum resultado para &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {/* Categories */}
              {results.categories.length > 0 && (
                <div className="px-3 pt-3 pb-1">
                  <p className="text-[0.65rem] uppercase tracking-wider text-night-400 font-medium mb-1.5">
                    Categorias
                  </p>
                  {results.categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categorias/${cat.slug}`}
                      onClick={handleSelect}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gold-50 transition-colors"
                    >
                      <FolderTree className="w-3.5 h-3.5 text-gold-500" />
                      <span className="text-sm text-night-700">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Products */}
              {results.products.length > 0 && (
                <div className="px-3 pt-2 pb-3">
                  {results.categories.length > 0 && (
                    <div className="h-px bg-border-light mb-2" />
                  )}
                  <p className="text-[0.65rem] uppercase tracking-wider text-night-400 font-medium mb-1.5">
                    Produtos
                  </p>
                  {results.products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/produtos/${product.slug}`}
                      onClick={handleSelect}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gold-50 transition-colors"
                    >
                      {product.images[0] ? (
                        <img
                          src={product.images[0].url}
                          alt={product.images[0].altText || product.name}
                          className="w-10 h-10 rounded-lg object-cover border border-night-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-night-50 flex items-center justify-center">
                          <Package className="w-4 h-4 text-night-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-night-800 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs font-semibold text-gold-600">
                          {formatPrice(parseFloat(product.basePrice) * 100)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* View all */}
              <Link
                href={`/produtos?search=${encodeURIComponent(query)}`}
                onClick={handleSelect}
                className="block px-4 py-2.5 text-center text-sm font-medium text-gold-600 bg-gold-50/50 hover:bg-gold-50 border-t border-border-light transition-colors"
              >
                Ver todos os resultados →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
