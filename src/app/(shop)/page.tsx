import Link from "next/link";
import { ArrowRight, Flame, Sparkles, Star } from "lucide-react";
import { NewsletterForm } from "@/components/shop/NewsletterForm";
import { FeaturedCarousel } from "@/components/shop/FeaturedCarousel";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
export const revalidate = 60;

const categoryGradients = [
  "from-amber-500 to-orange-600",
  "from-blue-600 to-indigo-700",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-purple-500 to-violet-600",
  "from-cyan-500 to-sky-600",
];

const categoryIcons = [Flame, Sparkles, Star, Flame, Sparkles, Star];

export default async function HomePage() {
  // Fetch categories and featured products from DB
  const [categories, featuredProducts] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        _count: { select: { products: true } },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      take: 12,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        compareAtPrice: true,
        stock: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { url: true, altText: true },
        },
        variants: {
          where: { isActive: true },
          select: { stock: true },
        },
        categories: {
          take: 1,
          include: { category: { select: { name: true } } },
        },
      },
    }),
  ]);

  return (
    <>
      {/* Hero section */}
      <section className="relative bg-night-900 text-cream-100 overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 50%, var(--color-gold-500) 0%, transparent 50%),
                                radial-gradient(circle at 75% 50%, var(--color-ruby-500) 0%, transparent 50%)`,
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-block text-xs uppercase tracking-[0.25em] text-gold-400 font-semibold mb-4 bg-gold-950/60 px-3 py-1 rounded-full border border-gold-600/30">
              Artigos Religiosos de Umbanda
            </span>
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight tracking-tight break-words"
              style={{
                fontFamily: "var(--font-heading)",
                color: "#fdf9f3",
              }}
            >
              Tudo para a sua{" "}
              <span
                className="bg-clip-text text-transparent bg-gradient-to-r from-[#ffe082] via-[#e6a832] to-[#ffd54f]"
                style={{
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                fé
              </span>{" "}
              e{" "}
              <span
                className="bg-clip-text text-transparent bg-gradient-to-r from-[#ffd54f] via-[#e6a832] to-[#ffe082]"
                style={{
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                espiritualidade
              </span>
            </h1>
            <p
              className="text-base sm:text-lg mb-8 leading-relaxed max-w-lg"
              style={{ color: "#e5e5e5" }}
            >
              Roupas, velas, imagens, guias e tudo mais que você precisa para o
              seu terreiro. Entrega para todo o Brasil.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/produtos"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-white font-medium text-sm shadow-gold hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: "var(--color-gold-500)" }}
              >
                Ver catálogo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#categorias"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-cream-100 font-medium text-sm border border-night-600 hover:bg-night-800 transition-all"
              >
                Explorar por categoria
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories section — dynamic from DB */}
      <section id="categorias" className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2
              className="text-2xl md:text-3xl font-bold text-night-900"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Explore por categoria
            </h2>
            <p className="text-night-500 text-sm mt-1">
              Encontre o que precisa para sua prática espiritual
            </p>
          </div>
          <Link
            href="/produtos"
            className="hidden sm:inline-flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700 font-medium"
          >
            Ver tudo <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((cat, i) => {
            const Icon = categoryIcons[i % categoryIcons.length];
            return (
              <Link
                key={cat.id}
                href={`/categorias/${cat.slug}`}
                className="group relative rounded-xl overflow-hidden aspect-[16/10] md:aspect-[2/1] flex items-end shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[i % categoryGradients.length]}`}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent group-hover:from-black/90 transition-colors" />
                <div className="absolute top-3 right-3 opacity-30 group-hover:opacity-60 transition-opacity">
                  <Icon className="w-8 h-8 text-gold-300" />
                </div>
                <div className="relative p-5 w-full">
                  <span className="text-white font-bold text-lg md:text-xl block leading-tight drop-shadow-md">
                    {cat.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured products — dynamic Carousel from DB */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className="text-2xl md:text-3xl font-bold text-night-900"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Destaques
              </h2>
              <p className="text-night-500 text-sm mt-1">
                Produtos selecionados para você
              </p>
            </div>
            <Link
              href="/produtos"
              className="inline-flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700 font-medium transition-colors"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <FeaturedCarousel
            products={featuredProducts.map((p) => ({
              ...p,
              basePrice: p.basePrice.toString(),
              compareAtPrice: p.compareAtPrice ? p.compareAtPrice.toString() : null,
            }))}
          />
        </section>
      )}

      {/* Trust / About section */}
      <section className="bg-night-900 text-cream-100 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2
              className="text-2xl md:text-3xl font-bold mb-4"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--color-gold-400)",
              }}
            >
              Por que a Casa do 7?
            </h2>
            <p className="text-night-300 leading-relaxed mb-8">
              Somos uma loja dedicada a oferecer artigos religiosos de Umbanda com
              o respeito e a qualidade que a sua fé merece. Cada produto é
              selecionado com cuidado para que sua experiência espiritual seja
              completa.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-4">
                <div className="text-3xl font-bold text-gold-400 mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  500+
                </div>
                <p className="text-sm text-night-400">Produtos disponíveis</p>
              </div>
              <div className="p-4">
                <div className="text-3xl font-bold text-gold-400 mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  Todo BR
                </div>
                <p className="text-sm text-night-400">Entrega nacional</p>
              </div>
              <div className="p-4">
                <div className="text-3xl font-bold text-gold-400 mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  12x
                </div>
                <p className="text-sm text-night-400">Ate 12x no cartão</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter / Lead capture section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="max-w-xl mx-auto text-center">
          <h2
            className="text-2xl font-bold text-night-900 mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Fique por dentro
          </h2>
          <p className="text-night-500 text-sm mb-6">
            Cadastre seu número e receba novidades, promoções exclusivas e
            conteúdo sobre espiritualidade.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
