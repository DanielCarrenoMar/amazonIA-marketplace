"use client";

import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from './Button';
import Link from 'next/link';

interface CartItem {
  id: string;
  title: string;
  price: string;
  image: string;
  quantity: number;
}

const mockCartItems: CartItem[] = [
  { id: '1', title: 'Cesta Wayuu', price: '$25.00', image: '/cesta-wayuu.jpg', quantity: 1 },
  { id: '2', title: 'Collar de Semillas', price: '$15.00', image: '/collar-de-semillas.jpg', quantity: 2 },
];

export function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-slate-900">Mi Carrito (3)</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {mockCartItems.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">{item.title}</h4>
                  <button className="text-gray-400 hover:text-brand-urgency p-1 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1 font-medium">Tamaño: Único</p>
                <div className="flex justify-between items-center mt-auto">
                  <p className="font-bold text-brand-primary">{item.price}</p>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-8">
                    <button className="px-2.5 text-gray-500 hover:bg-gray-50 font-medium">-</button>
                    <span className="px-2 text-sm font-semibold">{item.quantity}</span>
                    <button className="px-2.5 text-gray-500 hover:bg-gray-50 font-medium">+</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex justify-between mb-2">
            <span className="text-gray-500 font-medium">Subtotal</span>
            <span className="font-bold text-slate-900">$55.00</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-500 font-medium">Descuento</span>
            <span className="font-bold text-brand-urgency">-$5.00</span>
          </div>
          <div className="flex justify-between mb-6">
            <span className="text-gray-500 font-medium">Envío</span>
            <span className="font-bold text-brand-primary">Gratis</span>
          </div>
          
          <div className="flex justify-between items-center mb-6 pt-4 border-t border-gray-200">
            <span className="font-bold text-lg text-slate-900">Total</span>
            <span className="font-bold text-xl text-slate-900">$50.00</span>
          </div>
          <Link href="/marketplace/checkout" onClick={onClose} className="block w-full">
            <Button variant="primary" className="w-full py-6 text-base rounded-2xl shadow-md font-bold">
              Ir a Pagar (3)
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
