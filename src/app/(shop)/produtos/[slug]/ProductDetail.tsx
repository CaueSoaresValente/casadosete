"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
  Truck,
  Shield,
  Star,
  Package,
  X,
  AlertCircle,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { toast } from "react-toastify";

type ProductImage = {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
};

type ProductVariant = {
  id: string;
  name: string;
  sku: string;
  price: string | null;
  stock: number;
  attributes: Record<string, string>;
};

type ProductCategory = {
  category: { id: string; name: string; slug: string };
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  basePrice: string;
  compareAtPrice: string | null;
  stock: number;
  stockUnit: string;
  orixa: string | null;
  entidade: string | null;
  finalidade: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  categories: ProductCategory[];
};

export default function ProductDetail({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants.length > 0 ? product.variants[0] : null
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const price = selectedVariant?.price
    ? parseFloat(selectedVariant.price)
    : parseFloat(product.basePrice);
  const comparePrice = product.compareAtPrice
    ? parseFloat(product.compareAtPrice)
    : null;
  const hasDiscount = comparePrice && comparePrice > price;

  // Stock: use variant stock if variant selected, otherwise product-level stock
  const totalStock = selectedVariant
    ? selectedVariant.stock
    : product.variants.length > 0
      ? product.variants.reduce((sum, v) => sum + v.stock, 0)
      : product.stock;
  const inStock = totalStock > 0;

  const { addItem } = useCart();

  const handleAddToCart = () => {
    if (!inStock) {
      toast.warning("Este produto está indisponível no momento.");
      return;
    }
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id || null,
      name: product.name,
      variantName: selectedVariant?.name || null,
      slug: product.slug,
      price,
      imageUrl: product.images[0]?.url || null,
      quantity,
      stock: totalStock || 99,
    });
  };

  const nextImage = () =>
    setCurrentImageIndex((prev) =>
      prev < product.images.length - 1 ? prev + 1 : 0
    );
  const prevImage = () =>
    setCurrentImageIndex((prev) =>
      prev > 0 ? prev - 1 : product.images.length - 1
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-night-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-gold-600 transition-colors">
          Início
        </Link>
        <span>/</span>
        <Link href="/produtos" className="hover:text-gold-600 transition-colors">
          Produtos
        </Link>
        {product.categories[0] && (
          <>
            <span>/</span>
            <Link
              href={`/categorias/${product.categories[0].category.slug}`}
              className="hover:text-gold-600 transition-colors"
            >
              {product.categories[0].category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-night-600">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div>
          {/* Main image */}
          <div
            className={`relative aspect-square bg-cream-100 rounded-xl overflow-hidden mb-3 cursor-zoom-in group select-none ${!inStock ? 'grayscale opacity-70' : ''}`}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
            onClick={() => setIsModalOpen(true)}
          >
            {!inStock && (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="bg-night-900/80 text-white px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide">
                  Indisponível
                </div>
              </div>
            )}
            {product.images.length > 0 ? (
              <>
                <img
                  src={product.images[currentImageIndex].url}
                  alt={
                    product.images[currentImageIndex].altText || product.name
                  }
                  className="w-full h-full object-cover transition-transform duration-150 ease-out"
                  style={
                    isZoomed
                      ? {
                          transform: "scale(2.5)",
                          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                        }
                      : undefined
                  }
                />
                <div className="absolute bottom-3 right-3 bg-black/65 text-white text-[0.65rem] px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-medium">
                  🔍 Passe o mouse ou clique para ampliar
                </div>
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-night-700" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-night-700" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 h-16 text-night-200" />
              </div>
            )}

            {hasDiscount && (
              <span className="absolute top-3 left-3 bg-ruby-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                -{Math.round(((comparePrice - price) / comparePrice) * 100)}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                    i === currentImageIndex
                      ? "border-gold-500"
                      : "border-transparent hover:border-gold-200"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.altText || ""}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          {/* Category */}
          {product.categories[0] && (
            <Link
              href={`/categorias/${product.categories[0].category.slug}`}
              className="text-xs text-gold-600 uppercase tracking-wider font-medium hover:text-gold-700 transition-colors"
            >
              {product.categories[0].category.name}
            </Link>
          )}

          <h1
            className="text-2xl md:text-3xl font-bold text-night-900 mt-1 mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {product.name}
          </h1>

          {product.shortDescription && (
            <p className="text-night-500 text-sm mb-4 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Price */}
          <div className="mb-5">
            {hasDiscount && (
              <span className="text-sm text-night-400 line-through block">
                {formatPrice(comparePrice * 100)}
              </span>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-night-900">
                {formatPrice(price * 100)}
              </span>
              {hasDiscount && (
                <span className="text-sm font-medium text-emerald-600">
                  {Math.round(((comparePrice - price) / comparePrice) * 100)}% OFF
                </span>
              )}
            </div>
            {!inStock && (
              <div className="mt-3 bg-ruby-50 border border-ruby-200 rounded-lg p-3">
                <p className="text-sm text-ruby-700 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Ops! Este produto está temporariamente indisponível.
                </p>
                <p className="text-xs text-ruby-500 mt-1 ml-6">
                  Fale conosco pelo WhatsApp para saber quando teremos reposição! 🙏
                </p>
              </div>
            )}
          </div>

          {/* Variants */}
          {product.variants.length > 0 && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-night-700 mb-2">
                Opção
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVariant(v);
                      setQuantity(1);
                    }}
                    disabled={v.stock === 0}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      selectedVariant?.id === v.id
                        ? "border-gold-500 bg-gold-50 text-gold-700"
                        : v.stock === 0
                          ? "border-night-100 bg-night-50 text-night-300 cursor-not-allowed"
                          : "border-night-200 text-night-600 hover:border-gold-300 hover:bg-gold-50"
                    }`}
                  >
                    {v.name}
                    {v.stock === 0 && " (esgotado)"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-3 mb-5">
            {inStock && (
              <div className="flex items-center border border-night-200 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-night-500 hover:text-night-700"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="px-3 py-2 text-sm font-medium text-night-800 min-w-[2.5rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(totalStock || 99, quantity + 1))
                  }
                  className="px-3 py-2 text-night-500 hover:text-night-700"
                >
                  +
                </button>
              </div>
            )}

            <button
              disabled={!inStock}
              onClick={handleAddToCart}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all
                         disabled:cursor-not-allowed ${
                           inStock
                             ? 'text-white hover:shadow-gold hover:scale-[1.01] active:scale-[0.99]'
                             : 'bg-night-200 text-night-500'
                         }`}
              style={inStock ? { backgroundColor: "var(--color-gold-500)" } : {}}
            >
              <ShoppingBag className="w-4 h-4" />
              {inStock ? "Adicionar ao carrinho" : "Produto indisponível"}
            </button>

            <button className="p-3 rounded-lg border border-night-200 hover:border-ruby-300 hover:bg-ruby-50 transition-colors">
              <Heart className="w-5 h-5 text-night-400 hover:text-ruby-500" />
            </button>
          </div>

          {/* Stock indicator */}
          {inStock && totalStock > 0 && totalStock <= 5 && (
            <p className="text-sm text-ruby-500 font-medium mb-4">
              ⚡ Últimas {totalStock} unidade{totalStock > 1 ? "s" : ""}!
            </p>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-3 mb-6 pt-4 border-t border-border-light">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-gold-500 shrink-0" />
              <span className="text-xs text-night-500">
                Frete grátis acima de R$ 299
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold-500 shrink-0" />
              <span className="text-xs text-night-500">Compra segura</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-gold-500 shrink-0" />
              <span className="text-xs text-night-500">
                Produto selecionado
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gold-500 shrink-0" />
              <span className="text-xs text-night-500">
                Envio em 24h úteis
              </span>
            </div>
          </div>

          {/* Spiritual tags */}
          {(product.orixa || product.entidade || product.finalidade) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {product.orixa && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gold-50 text-gold-700 border border-gold-200">
                  Orixá: {product.orixa}
                </span>
              )}
              {product.entidade && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gold-50 text-gold-700 border border-gold-200">
                  Entidade: {product.entidade}
                </span>
              )}
              {product.finalidade && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gold-50 text-gold-700 border border-gold-200">
                  Finalidade: {product.finalidade}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="border-t border-border-light pt-5">
              <h2
                className="text-lg font-semibold text-night-800 mb-3"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Descrição
              </h2>
              <div className="text-sm text-night-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-screen Lightbox Modal */}
      {isModalOpen && product.images.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setIsModalOpen(false)}
        >
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={product.images[currentImageIndex].url}
              alt={product.images[currentImageIndex].altText || product.name}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            {product.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
