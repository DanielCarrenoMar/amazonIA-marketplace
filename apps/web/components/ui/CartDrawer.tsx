"use client";

import React from 'react';
import { Icon } from "@iconify/react";
import { Button } from './Button';
import Link from 'next/link';
import { useCart } from '@/lib/cartContext';

export function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, removeItem, updateQuantity, totalItems, subtotal } = useCart();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-60 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-white z-70 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-900">Mi Carrito ({totalItems})</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Icon icon="lucide:x" className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Icon icon="lucide:shopping-cart" className="w-12 h-12 mb-4 text-gray-300" />
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">{item.title}</h4>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-brand-urgency p-1 transition-colors"
                    >
                      <Icon icon="lucide:trash-2" className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 font-medium">{item.category}</p>
                  <div className="flex justify-between items-center mt-auto">
                    <p className="font-bold text-brand-primary">${parseFloat(item.price).toFixed(2)}</p>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-8">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2.5 text-gray-500 hover:bg-gray-50 font-medium cursor-pointer">-</button>
                      <span className="px-2 text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2.5 text-gray-500 hover:bg-gray-50 font-medium cursor-pointer" disabled={item.quantity >= item.stockAvailable}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/50">
            <div className="flex justify-between mb-2">
              <span className="text-gray-500 font-medium">Subtotal</span>
              <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-6">
              <span className="text-gray-500 font-medium">Envío estimado</span>
              <span className="font-bold text-brand-primary">$5.00</span>
            </div>
            
            <div className="flex justify-between items-center mb-6 pt-4 border-t border-gray-200">
              <span className="font-bold text-lg text-slate-900">Total</span>
              <span className="font-bold text-xl text-brand-primary">${(subtotal + 5).toFixed(2)}</span>
            </div>
            <Link href="/marketplace/checkout" onClick={onClose} className="block w-full">
              <Button variant="primary" className="w-full py-6 text-base rounded-2xl shadow-md font-bold">
                Ir a Pagar ({totalItems})
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
