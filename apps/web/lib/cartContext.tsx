"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ProductResponseDto } from 'event-types';

export interface CartItem {
  id: string;
  title: string;
  price: string;
  image: string;
  category: string;
  quantity: number;
  stockAvailable: number;
  sellerId: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: ProductResponseDto, quantity: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('amazonIA_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error parsing cart from localStorage", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage when items change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('amazonIA_cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addItem = (product: ProductResponseDto, quantity: number) => {
    setItems(current => {
      const existing = current.find(item => item.id === product.id);
      if (existing) {
        return current.map(item => 
          item.id === product.id 
            ? { ...item, quantity: Math.min(item.quantity + quantity, item.stockAvailable) }
            : item
        );
      }

      return [...current, {
        id: product.id,
        title: product.name,
        price: product.price.toString(),
        image: product.imageUrl || '/placeholder.jpg',
        category: product.category?.categoryName || 'General',
        quantity: quantity,
        stockAvailable: product.stockAvailable,
        sellerId: product.sellerId,
      }];
    });
  };

  const removeItem = (id: string) => {
    setItems(current => current.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems(current => 
      current.map(item => 
        item.id === id 
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stockAvailable)) } 
          : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
