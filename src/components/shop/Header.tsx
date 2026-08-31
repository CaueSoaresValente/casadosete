"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Phone,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/shop/SearchBar";
import { useCart } from "@/contexts/CartContext";

type NavCategory = { id: string; name: string; slug: string };

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categories, setCategories] = useState<NavCategory[]>([]);
  const { totalItems, setIsOpen } = useCart();

  useEffect(() => {
    fetch("/api/catalog/categories")
      .then((res) => res.json())
      .then((data) => {
        // Take first 6 root categories for navigation
        setCategories(
          data.slice(0, 6).map((c: NavCategory) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          }))
        );
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full max-w-[100vw]">
      {/* Top bar — contato */}
      <div className="bg-night-900 text-cream-200 text-[0.7rem] sm:text-xs py-1.5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <Phone className="w-3 h-3 shrink-0" />
            <span className="truncate">Atendimento via WhatsApp</span>
          </div>
          <span className="hidden sm:block shrink-0">
            Frete grátis para compras acima de R$ 299
          </span>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-surface border-b border-border-light shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group min-w-0">
            <img
              src="/assets/logosete.png"
              alt="Casa do 7 Logo"
              className="h-9 sm:h-11 md:h-13 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-sm shrink-0"
            />
            <div className="flex flex-col justify-center min-w-0">
              <span
                className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight leading-none truncate"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--color-gold-500)",
                }}
              >
                Casa do 7
              </span>
              <span
                className="text-[0.5rem] sm:text-[0.6rem] md:text-[0.65rem] tracking-[0.2em] font-semibold uppercase mt-0.5 sm:mt-1 truncate"
                style={{ color: "var(--color-night-400)" }}
              >
                Artigos Religiosos
              </span>
            </div>
          </Link>

          {/* Search — Desktop (instant search) */}
          <SearchBar className="hidden md:block flex-1 max-w-xl" />

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Search toggle mobile */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-lg hover:bg-surface-hover transition-colors"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5 text-night-600" />
            </button>

            {/* Favorites (hidden on small mobile, accessible in menu) */}
            <Link
              href="/conta/favoritos"
              className="hidden sm:inline-flex p-1.5 sm:p-2 rounded-lg hover:bg-surface-hover transition-colors relative"
              aria-label="Favoritos"
            >
              <Heart className="w-5 h-5 text-night-600" />
            </Link>

            {/* Account (hidden on small mobile, accessible in menu) */}
            <Link
              href="/login"
              className="hidden sm:inline-flex p-1.5 sm:p-2 rounded-lg hover:bg-surface-hover transition-colors"
              aria-label="Minha conta"
            >
              <User className="w-5 h-5 text-night-600" />
            </Link>

            {/* Cart */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-1.5 sm:p-2 rounded-lg hover:bg-surface-hover transition-colors"
              aria-label="Carrinho"
            >
              <ShoppingBag className="w-5 h-5 text-night-600" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-ruby-500 text-white text-[0.6rem] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>

            {/* Mobile menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-surface-hover transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-night-600" />
              ) : (
                <Menu className="w-5 h-5 text-night-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-border-light"
            >
              <div className="px-4 py-3">
                <SearchBar />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category nav — Desktop (dynamic from DB) */}
        <nav className="hidden lg:block border-t border-border-light">
          <div className="max-w-7xl mx-auto px-4">
            <ul className="flex items-center gap-1">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/categorias/${cat.slug}`}
                    className={cn(
                      "block px-4 py-2.5 text-sm font-medium text-night-600",
                      "hover:text-gold-600 hover:bg-gold-50",
                      "transition-colors rounded-t-lg relative",
                      "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5",
                      "after:bg-gold-500 after:scale-x-0 after:origin-center",
                      "after:transition-transform hover:after:scale-x-100"
                    )}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/produtos"
                  className="block px-4 py-2.5 text-sm font-medium text-gold-600 hover:text-gold-700 transition-colors"
                >
                  Ver tudo →
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-surface border-b border-border shadow-lg z-40 max-h-[85vh] overflow-y-auto"
          >
            <nav className="max-w-7xl mx-auto px-4 py-4 space-y-4">
              {/* Quick links for mobile */}
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-border-light">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-cream-100 text-night-800 text-xs font-semibold hover:bg-gold-50 hover:text-gold-700 transition-colors"
                >
                  <User className="w-4 h-4 text-gold-600" />
                  Minha Conta
                </Link>
                <Link
                  href="/conta/favoritos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-cream-100 text-night-800 text-xs font-semibold hover:bg-gold-50 hover:text-gold-700 transition-colors"
                >
                  <Heart className="w-4 h-4 text-ruby-600" />
                  Favoritos
                </Link>
              </div>

              {/* Categories list */}
              <ul className="space-y-1">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/categorias/${cat.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 text-sm font-medium text-night-700 hover:bg-gold-50 hover:text-gold-700 rounded-lg transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-2 border-t border-border-light mt-2">
                  <Link
                    href="/produtos"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-semibold text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                  >
                    Ver todos os produtos →
                  </Link>
                </li>
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
