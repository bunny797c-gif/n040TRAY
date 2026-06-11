'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('n040tray_cart');
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('n040tray_cart', JSON.stringify(items));
    } catch {}
  }, [items]);

  function addItem(product) {
    setItems((prev) => {
      const existing = prev.find((i) => i.name === product.name);
      if (existing) {
        return prev.map((i) =>
          i.name === product.name ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function removeItem(name) {
    setItems((prev) => prev.filter((i) => i.name !== name));
  }

  function updateQty(name, qty) {
    if (qty < 1) { removeItem(name); return; }
    setItems((prev) => prev.map((i) => i.name === name ? { ...i, qty } : i));
  }

  function clearCart() { setItems([]); }

  const totalCount = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
