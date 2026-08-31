"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Package, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type FeaturedProduct = {
  id: string;
  name: string;
  slug: string;
  basePrice: string | number;
  compareAtPrice: string | number | null;
  stock: number;
  images: Array<{ url: string; altText: string | null }>;
  categories: Array<{ category: { name: string } }>;
  variants?: Array<{ stock: number }>;
};

export function FeaturedCarousel({ products }: { products: FeaturedProduct[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);

      // Calculate approximate active card index
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 280;
      const index = Math.round(scrollLeft / (cardWidth + 16));
      setActiveIndex(Math.min(index, products.length - 1));
    }
  }, [products.length]);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 280;
      const gap = 16;
      const scrollAmount = cardWidth + gap;

      if (direction === "right") {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 15) {
          // If at the end, smoothly loop back to start
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      } else {
        scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      }

      setTimeout(checkScroll, 350);
    }
  };

  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 280;
      const gap = 16;
      scrollRef.current.scrollTo({
        left: index * (cardWidth + gap),
        behavior: "smooth",
      });
      setTimeout(checkScroll, 350);
    }
  };

  // Autoplay effect (runs every 3.5 seconds if multiple products exist and user isn't hovering)
  useEffect(() => {
    if (products.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 280;
        const gap = 16;

        if (scrollLeft + clientWidth >= scrollWidth - 15) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollRef.current.scrollBy({ left: cardWidth + gap, behavior: "smooth" });
        }
        setTimeout(checkScroll, 350);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [products.length, isPaused, checkScroll]);

  if (!products || products.length === 0) return null;

  return (
    <div
      className="relative group/carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setTimeout(() => setIsPaused(false), 2000)}
    >
      {/* Top Controls (Desktop & Tablet) */}
      {products.length > 1 && (
        <div className="hidden sm:flex items-center gap-2 absolute -top-14 right-0">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Anterior"
            className="w-9 h-9 rounded-full border border-night-200 bg-white flex items-center justify-center text-night-700 hover:bg-gold-50 hover:border-gold-300 hover:text-gold-700 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Próximo"
            className="w-9 h-9 rounded-full border border-night-200 bg-white flex items-center justify-center text-night-700 hover:bg-gold-50 hover:border-gold-300 hover:text-gold-700 transition-all shadow-sm active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Carousel Track */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 pt-1 px-1 -mx-1 scrollbar-hide no-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => {
          const price = Number(product.basePrice);
          const comparePrice = product.compareAtPrice
            ? Number(product.compareAtPrice)
            : null;
          const hasDiscount = comparePrice && comparePrice > price;
          const productStock = product.variants && product.variants.length > 0
            ? product.variants.reduce((sum, v) => sum + v.stock, 0)
            : product.stock;
          const isOutOfStock = productStock <= 0;

          return (
            <div
              key={product.id}
              className="w-[260px] sm:w-[280px] md:w-[290px] shrink-0 snap-start"
            >
              <Link
                href={`/produtos/${product.slug}`}
                className="group h-full flex flex-col bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:border-gold-300 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image area */}
                <div className={`relative aspect-square bg-cream-50 overflow-hidden ${isOutOfStock ? 'grayscale opacity-60' : ''}`}>
                  {product.images[0] ? (
                    <img
                      src={product.images[0].url}
                      alt={product.images[0].altText || product.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-night-300">
                      <Package className="w-12 h-12" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                    <span className="inline-flex items-center gap-1 bg-gold-500/90 backdrop-blur-sm text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      <Sparkles className="w-2.5 h-2.5" /> Destaque
                    </span>
                    {hasDiscount && (
                      <span className="bg-ruby-500 text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        -{Math.round(((comparePrice - price) / comparePrice) * 100)}%
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="bg-night-700/90 backdrop-blur-sm text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        Esgotado
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {product.categories[0] && (
                      <span className="text-[0.65rem] font-bold text-gold-600 tracking-wider uppercase block mb-1">
                        {product.categories[0].category.name}
                      </span>
                    )}
                    <h3 className="text-sm font-semibold text-night-900 line-clamp-2 leading-snug group-hover:text-gold-600 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-3 border-t border-night-100/60">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-night-900">
                        {formatPrice(price * 100)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-night-400 line-through">
                          {formatPrice(comparePrice * 100)}
                        </span>
                      )}
                    </div>
                    <p className="text-[0.7rem] text-night-500 mt-0.5 font-medium">
                      até 12x de {formatPrice((price / 12) * 100)}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Pagination Dots (when multiple items exist) */}
      {products.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {products.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => scrollToIndex(idx)}
              aria-label={`Ir para produto ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === idx
                  ? "w-6 bg-gold-500"
                  : "w-2 bg-night-200 hover:bg-gold-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
