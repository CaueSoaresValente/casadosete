"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2, Loader2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";

type FavoriteProduct = {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: string;
    compareAtPrice: string | null;
    isActive: boolean;
    imageUrl: string | null;
    totalStock: number;
  };
};

export default function FavoritosPage() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await fetch("/api/favorites");
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } catch {
      // Not logged in or error
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (productId: string) => {
    setRemoving(productId);
    try {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      setFavorites((prev) => prev.filter((f) => f.productId !== productId));
    } catch {
      // Handle silently
    } finally {
      setRemoving(null);
    }
  };

  const handleAddToCart = (fav: FavoriteProduct) => {
    addItem({
      productId: fav.product.id,
      variantId: null,
      name: fav.product.name,
      variantName: null,
      slug: fav.product.slug,
      price: parseFloat(fav.product.basePrice),
      imageUrl: fav.product.imageUrl,
      stock: fav.product.totalStock || 99,
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1
        className="text-2xl md:text-3xl font-bold text-night-900 mb-2"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Meus Favoritos
      </h1>
      <p className="text-sm text-night-500 mb-8">
        {favorites.length} {favorites.length === 1 ? "produto" : "produtos"} salvos
      </p>

      {favorites.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-night-100">
          <Heart className="w-12 h-12 text-night-200 mx-auto mb-3" />
          <p className="text-night-500 text-sm mb-4">
            Você ainda não tem produtos favoritos
          </p>
          <Link
            href="/produtos"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium text-sm"
            style={{ backgroundColor: "var(--color-gold-500)" }}
          >
            Explorar produtos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((fav) => {
            const price = parseFloat(fav.product.basePrice);
            const comparePrice = fav.product.compareAtPrice
              ? parseFloat(fav.product.compareAtPrice)
              : null;
            const hasDiscount = comparePrice && comparePrice > price;

            return (
              <div
                key={fav.id}
                className="bg-white rounded-xl border border-night-100 overflow-hidden group"
              >
                {/* Image */}
                <Link
                  href={`/produtos/${fav.product.slug}`}
                  className="block aspect-square bg-cream-50 relative overflow-hidden"
                >
                  {fav.product.imageUrl ? (
                    <img
                      src={fav.product.imageUrl}
                      alt={fav.product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-night-200" />
                    </div>
                  )}
                  {hasDiscount && (
                    <span className="absolute top-2 left-2 bg-ruby-500 text-white text-[0.6rem] font-bold px-2 py-0.5 rounded-full">
                      {Math.round(((comparePrice - price) / comparePrice) * 100)}% OFF
                    </span>
                  )}
                </Link>

                {/* Info */}
                <div className="p-3">
                  <Link
                    href={`/produtos/${fav.product.slug}`}
                    className="text-sm font-medium text-night-800 hover:text-gold-600 line-clamp-2 transition-colors"
                  >
                    {fav.product.name}
                  </Link>

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

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleAddToCart(fav)}
                      disabled={fav.product.totalStock === 0}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-medium transition-all hover:shadow-gold disabled:opacity-50"
                      style={{ backgroundColor: "var(--color-gold-500)" }}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {fav.product.totalStock === 0 ? "Esgotado" : "Adicionar"}
                    </button>
                    <button
                      onClick={() => removeFavorite(fav.productId)}
                      disabled={removing === fav.productId}
                      className="p-2 rounded-lg border border-night-200 text-night-400 hover:text-ruby-500 hover:border-ruby-200 transition-colors"
                    >
                      {removing === fav.productId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
