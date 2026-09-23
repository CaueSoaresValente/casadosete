"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export type BoxCustomization = {
  primaryOrixa: { id: string; name: string; colorHex: string };
  primaryImage?: {
    id: string;
    name: string;
    material: string;
    price: number;
  };
  secondaryImage?: {
    orixa: { id: string; name: string; colorHex: string };
    id: string;
    name: string;
    material: string;
    price: number;
  };
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  objectOption?: { id: string; name: string; price: number };
  note?: string;
  total: number;
};

export type CartItem = {
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  slug: string;
  price: number; // in BRL (e.g. 29.90)
  imageUrl: string | null;
  quantity: number;
  stock: number;
  isBackorder: boolean; // true when item was out-of-stock at time of adding
  boxCustomization?: BoxCustomization;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = "casado7_cart";

function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or blocked
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(loadCartFromStorage());
    setLoaded(true);
  }, []);


  // Save to localStorage on change
  useEffect(() => {
    if (loaded) {
      saveCartToStorage(items);
    }
  }, [items, loaded]);

  const addItem = useCallback(
    (newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      const isBackorder = newItem.stock <= 0;
      // For backorder items use a high sentinel stock so quantity arithmetic works
      const effectiveStock = isBackorder ? 99 : newItem.stock;

      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (i) =>
            i.productId === newItem.productId &&
            i.variantId === newItem.variantId
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          const existing = updated[existingIndex];
          const newQty = Math.min(
            existing.quantity + (newItem.quantity || 1),
            effectiveStock
          );
          updated[existingIndex] = { ...existing, quantity: newQty, isBackorder };
          return updated;
        }

        return [
          ...prev,
          {
            ...newItem,
            isBackorder,
            quantity: Math.min(newItem.quantity || 1, effectiveStock),
          },
        ];
      });
      setIsOpen(true);
    },
    []
  );

  const removeItem = useCallback(
    (productId: string, variantId: string | null) => {
      setItems((prev) =>
        prev.filter(
          (i) => !(i.productId === productId && i.variantId === variantId)
        )
      );
    },
    []
  );

  const updateQuantity = useCallback(
    (productId: string, variantId: string | null, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId, variantId);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId && i.variantId === variantId
            ? { ...i, quantity: Math.min(quantity, i.isBackorder || i.stock <= 0 ? 99 : i.stock) }
            : i
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
