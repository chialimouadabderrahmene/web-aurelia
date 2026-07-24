"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  color: string;
  colorHex: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (slug: string, color: string) => void;
  setQty: (slug: string, color: string, qty: number) => void;
  open: () => void;
  close: () => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      add: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.slug === item.slug && i.color === item.color
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i === existing ? { ...i, qty: i.qty + qty } : i
              ),
              isOpen: true,
            };
          }
          return { items: [...state.items, { ...item, qty }], isOpen: true };
        }),
      remove: (slug, color) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.slug === slug && i.color === color)
          ),
        })),
      setQty: (slug, color, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.slug === slug && i.color === color ? { ...i, qty } : i
          ),
        })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      clear: () => set({ items: [] }),
    }),
    { name: "aurelia-cart" }
  )
);

type WishlistState = {
  slugs: string[];
  toggle: (slug: string) => void;
  has: (slug: string) => boolean;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      slugs: [],
      toggle: (slug) =>
        set((state) => ({
          slugs: state.slugs.includes(slug)
            ? state.slugs.filter((s) => s !== slug)
            : [...state.slugs, slug],
        })),
      has: (slug) => get().slugs.includes(slug),
    }),
    { name: "aurelia-wishlist" }
  )
);
