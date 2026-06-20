import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CartItem {
  cartKey: string;
  name: string;
  pack: string;
  price: number;
  qty: number;
  image_url?: string | null;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Omit<CartItem, "qty" | "cartKey"> & { cartKey?: string }) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clearCart: () => void;
  totalCount: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const key = product.cartKey ?? `${product.name}_${product.pack}`;
        set((state) => {
          const existing = state.items.find((i) => i.cartKey === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.cartKey === key ? { ...i, qty: i.qty + 1 } : i
              ),
            };
          }
          return {
            items: [...state.items, { ...product, cartKey: key, qty: 1 }],
          };
        });
      },

      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((i) => i.cartKey !== key),
        })),

      updateQty: (key, qty) => {
        if (qty < 1) {
          get().removeItem(key);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.cartKey === key ? { ...i, qty } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalCount: () => get().items.reduce((s, i) => s + i.qty, 0),

      totalPrice: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
    }),
    {
      name: "tray-cart",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
