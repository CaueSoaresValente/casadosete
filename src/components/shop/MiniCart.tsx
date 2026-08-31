"use client";

import Link from "next/link";
import { X, Trash2, ShoppingBag, Minus, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function MiniCart() {
  const { items, removeItem, updateQuantity, totalItems, subtotal, isOpen, setIsOpen } =
    useCart();

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 z-50"
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-night-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gold-500" />
                <h2
                  className="text-lg font-semibold text-night-900"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Carrinho
                </h2>
                <span className="text-xs text-night-400">
                  ({totalItems} {totalItems === 1 ? "item" : "itens"})
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-night-100 transition-colors"
              >
                <X className="w-5 h-5 text-night-500" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-night-200 mx-auto mb-3" />
                  <p className="text-night-500 text-sm mb-4">
                    Seu carrinho está vazio
                  </p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-sm text-gold-600 hover:text-gold-700 font-medium"
                  >
                    Continuar comprando →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.variantId}`}
                      className="flex gap-3 p-3 rounded-lg border border-night-100"
                    >
                      {/* Image */}
                      <Link
                        href={`/produtos/${item.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="w-16 h-16 rounded-lg bg-cream-100 overflow-hidden shrink-0"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-night-200" />
                          </div>
                        )}
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/produtos/${item.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="text-sm font-medium text-night-800 hover:text-gold-600 line-clamp-1 transition-colors"
                        >
                          {item.name}
                        </Link>
                        {item.variantName && (
                          <p className="text-xs text-night-400 mt-0.5">
                            {item.variantName}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-night-900 mt-1">
                          {formatPrice(item.price * 100)}
                        </p>

                        {/* Quantity */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-night-200 rounded">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.variantId,
                                  item.quantity - 1
                                )
                              }
                              className="p-1 hover:bg-night-50 transition-colors"
                            >
                              <Minus className="w-3 h-3 text-night-500" />
                            </button>
                            <span className="px-2 text-xs font-medium text-night-800 min-w-[1.5rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.variantId,
                                  item.quantity + 1
                                )
                              }
                              disabled={item.quantity >= item.stock}
                              className="p-1 hover:bg-night-50 transition-colors disabled:opacity-50"
                            >
                              <Plus className="w-3 h-3 text-night-500" />
                            </button>
                          </div>
                          <button
                            onClick={() =>
                              removeItem(item.productId, item.variantId)
                            }
                            className="p-1 rounded hover:bg-ruby-50 text-night-400 hover:text-ruby-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-night-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-night-500">Subtotal</span>
                  <span className="text-lg font-bold text-night-900">
                    {formatPrice(subtotal * 100)}
                  </span>
                </div>
                <p className="text-xs text-night-400">
                  Frete calculado no checkout
                </p>
                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-6 py-3 rounded-lg text-white font-medium text-sm transition-all
                             hover:shadow-gold hover:scale-[1.01] active:scale-[0.99]"
                  style={{ backgroundColor: "var(--color-gold-500)" }}
                >
                  Finalizar compra
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center text-sm text-night-500 hover:text-gold-600 transition-colors"
                >
                  Continuar comprando
                </button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
