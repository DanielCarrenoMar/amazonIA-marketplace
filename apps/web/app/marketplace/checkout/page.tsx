"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from "@iconify/react";
import { useRouter } from 'next/navigation';
import { MarketplaceNavbar } from '@/components/layout/MarketplaceNavbar';
import { Footer } from '@/components/layout/Footer';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useCart } from '@/lib/cartContext';
import { useAuth } from '@/lib/useAuth';
import { createOrder } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { items: cartItems, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  
  const shippingCost = cartItems.length > 0 ? 5.00 : 0;
  const total = subtotal + shippingCost;

  const [orderNotes, setOrderNotes] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) return;
    if (!transactionHash) {
      toast({ title: "Falta el hash", description: "Por favor, ingresa el hash de la transacción.", variant: "error" });
      return;
    }

    try {
      setIsSubmitting(true);
      await Promise.all(
        cartItems.map(item => 
          createOrder({
            productId: item.id,
            quantity: item.quantity,
            orderNotes: orderNotes || undefined,
            transactionHash
          })
        )
      );

      toast({ title: "¡Compra completada!", description: "Tus pedidos han sido creados exitosamente.", variant: "success" });
      clearCart();
      router.push('/dashboard/orders');
    } catch (error: any) {
      toast({ title: "Error al procesar", description: error.message || "No se pudo completar la compra.", variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <>
        <MarketplaceNavbar />
        <main className="min-h-screen bg-gray-50/50 pt-32 pb-20 px-4 md:px-8 font-sans flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Tu carrito está vacío</h2>
            <Link href="/marketplace">
              <Button variant="primary">Volver al catálogo</Button>
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <MarketplaceNavbar />
      
      <main className="min-h-screen bg-gray-50/50 pt-32 pb-20 px-4 md:px-8 font-sans">
        <div className="max-w-[1200px] mx-auto">
          
          {/* Header & Back Link */}
          <div className="mb-8">
            <Link href="/marketplace" className="inline-flex items-center text-sm font-medium text-muted hover:text-brand-primary transition-colors mb-4">
              <Icon icon="lucide:chevron-left" className="w-4 h-4 mr-1" />
              Volver al catálogo
            </Link>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Completar Compra</h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* LEFT COLUMN: STEPS */}
            <div className="flex-1 flex flex-col gap-8">
              {/* Step 1: Dirección de Envío */}
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Icon icon="lucide:map-pin" className="w-6 h-6 text-brand-primary shrink-0" />
                  <h2 className="text-xl font-bold text-slate-900">Dirección de Envío</h2>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  {user?.locationFormattedAddress ? (
                    <>
                      <p className="font-semibold text-slate-900 mb-1">{user.fullName}</p>
                      <p className="text-sm text-gray-600">{user.locationFormattedAddress}</p>
                      <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                        <Icon icon="lucide:info" className="w-4 h-4" /> 
                        Esta dirección fue tomada de tu perfil.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-amber-600 flex items-center gap-1 font-medium">
                      <Icon icon="lucide:alert-triangle" className="w-4 h-4" />
                      No tienes una dirección configurada en tu perfil. El envío podría no procesarse.
                    </p>
                  )}
                </div>
              </section>

              {/* Step 2: Notas del Pedido */}
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Icon icon="lucide:user" className="w-6 h-6 text-brand-primary shrink-0" />
                  <h2 className="text-xl font-bold text-slate-900">Notas Adicionales</h2>
                </div>
                <div className="mb-2">
                  <p className="text-sm text-gray-500 mb-4">¿Hay algo que debamos saber sobre este pedido? (Opcional)</p>
                  <Input 
                    placeholder="Escribe aquí tus notas para el vendedor..." 
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                  />
                </div>
              </section>

              {/* Step 2: Pago */}
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <Icon icon="lucide:credit-card" className="w-6 h-6 text-brand-primary shrink-0" />
                  <h2 className="text-xl font-bold text-slate-900">Pago Inteligente</h2>
                </div>

                <div className="flex flex-col gap-4 mb-6">
                  {/* Billetera destino */}
                  <div className="p-5 border border-brand-primary/30 bg-brand-primary/5 rounded-2xl">
                    <p className="text-sm text-slate-900 font-semibold mb-2">Billetera de Destino (Escrow AmazonIA)</p>
                    <div className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-xl">
                      <span className="font-mono text-xs text-slate-600">0xAmazonIAEscrowWallet123456789...</span>
                      <Button variant="ghost" size="sm" className="h-8 px-3 text-brand-primary text-xs font-bold">Copiar</Button>
                    </div>
                    <p className="text-xs text-muted mt-3">
                      Realiza el envío exacto de <strong>${total.toFixed(2)}</strong> a esta cuenta y pega el Hash de la Transacción debajo.
                    </p>
                  </div>

                  {/* Hash de transacción */}
                  <div className="mt-4">
                    <Input 
                      label="Hash de Transacción / Comprobante" 
                      placeholder="Ej. 0xabcdef123456..." 
                      value={transactionHash}
                      onChange={(e) => setTransactionHash(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Seguridad */}
                <div className="flex items-center gap-2 mt-6 text-sm text-green-600 bg-green-50 p-4 rounded-xl">
                  <Icon icon="lucide:shield-check" className="w-5 h-5" />
                  <span className="font-medium">Validaremos tu pago automáticamente usando el comprobante.</span>
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY */}
            <aside className="w-full lg:w-[400px] shrink-0">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-32">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Resumen del Pedido</h2>
                
                {/* Items */}
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0 border border-gray-100">
                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">{item.title}</h3>
                        <p className="text-xs text-muted mb-1">{item.category}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm font-medium text-slate-700">Cant: {item.quantity}</span>
                          <span className="font-bold text-slate-900">${parseFloat(item.price).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-100 pt-5 space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted font-medium">Subtotal</span>
                    <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted font-medium">Envío</span>
                    <span className="font-semibold text-slate-900">${shippingCost.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-5 mb-8">
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-bold text-slate-900">Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-brand-primary">${total.toFixed(2)}</span>
                      <p className="text-xs text-muted mt-1">Incluye todos los impuestos</p>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="primary" 
                  className="w-full py-4 text-base shadow-md font-bold rounded-xl" 
                  rightIcon={<Icon icon="lucide:shield-check" className="w-5 h-5"/>}
                  onClick={handleSubmitOrder}
                  isLoading={isSubmitting}
                >
                  Completar Pedido
                </Button>

                {/* Trust Badges mini */}
                <div className="flex justify-center items-center gap-4 mt-6">
                  <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                    <Icon icon="lucide:truck" className="w-4 h-4" /> Envíos Seguros
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-300" />
                  <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                    <Icon icon="lucide:check-circle-2" className="w-4 h-4" /> Garantía Total
                  </div>
                </div>
              </div>
            </aside>
          </div>

        </div>
      </main>
      
      <Footer />
    </>
  );
}
