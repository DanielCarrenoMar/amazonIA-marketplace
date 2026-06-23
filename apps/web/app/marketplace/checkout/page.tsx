"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ShieldCheck, CreditCard, Truck, MapPin, Building2, User, CheckCircle2 } from 'lucide-react';
import { MarketplaceNavbar } from '@/components/layout/MarketplaceNavbar';
import { Footer } from '@/components/layout/Footer';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Radio } from '@/components/ui/Radio';
import { mockProducts } from '@/lib/mock-data';

export default function CheckoutPage() {
  // Simularemos que hay 2 productos en el carrito para el resumen
  const cartItems = mockProducts.slice(0, 2).map(p => ({ ...p, quantity: 1 }));
  
  const subtotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.price.replace('$', '')) * item.quantity), 0);
  const shippingCost = 5.00;
  const total = subtotal + shippingCost;

  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [country, setCountry] = useState('CO');

  return (
    <>
      <MarketplaceNavbar />
      
      <main className="min-h-screen bg-gray-50/50 pt-32 pb-20 px-4 md:px-8 font-sans">
        <div className="max-w-[1200px] mx-auto">
          
          {/* Header & Back Link */}
          <div className="mb-8">
            <Link href="/marketplace" className="inline-flex items-center text-sm font-medium text-muted hover:text-brand-primary transition-colors mb-4">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Volver al catálogo
            </Link>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Completar Compra</h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* LEFT COLUMN: STEPS */}
            <div className="flex-1 flex flex-col gap-8">
              
              {/* Step 1: Contacto */}
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Información de Contacto</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="Correo electrónico" placeholder="tucorreo@ejemplo.com" type="email" required />
                  <Input label="Teléfono" placeholder="+57 300 000 0000" type="tel" required />
                </div>
              </section>

              {/* Step 2: Envío */}
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Dirección de Envío</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <Input label="Nombres" placeholder="Ej. María" required />
                  <Input label="Apellidos" placeholder="Ej. Pérez" required />
                </div>
                
                <div className="mb-5">
                  <Input label="Dirección completa" placeholder="Calle, Carrera, Avenida, Número..." required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Input label="Ciudad" placeholder="Ej. Bogotá" required />
                  <Select 
                    label="País" 
                    options={[
                      { value: 'CO', label: 'Colombia' },
                      { value: 'MX', label: 'México' },
                      { value: 'PE', label: 'Perú' }
                    ]} 
                    value={country}
                    onChange={setCountry}
                    required
                  />
                  <Input label="Código Postal" placeholder="110011" />
                </div>

                {/* Opciones de envío */}
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Método de Envío</h3>
                  <div className="flex flex-col gap-4">
                    <label className={`relative flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${shippingMethod === 'standard' ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary' : 'border-gray-200 hover:border-brand-primary/40'}`}>
                      <div className="flex gap-4">
                        <Radio 
                          name="shipping" 
                          checked={shippingMethod === 'standard'} 
                          onChange={() => setShippingMethod('standard')} 
                        />
                        <div>
                          <p className="font-semibold text-slate-900">Envío Estándar</p>
                          <p className="text-sm text-muted">Entrega en 3 - 5 días hábiles</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">$5.00</span>
                    </label>

                    <label className={`relative flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${shippingMethod === 'express' ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary' : 'border-gray-200 hover:border-brand-primary/40'}`}>
                      <div className="flex gap-4">
                        <Radio 
                          name="shipping" 
                          checked={shippingMethod === 'express'} 
                          onChange={() => setShippingMethod('express')} 
                        />
                        <div>
                          <p className="font-semibold text-slate-900">Envío Express</p>
                          <p className="text-sm text-muted">Entrega en 1 - 2 días hábiles</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">$12.00</span>
                    </label>
                  </div>
                </div>
              </section>

              {/* Step 3: Pago */}
              <section className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Método de Pago</h2>
                </div>

                <div className="flex flex-col gap-4 mb-6">
                  {/* Tarjeta de crédito */}
                  <div className={`border rounded-2xl overflow-hidden transition-all ${paymentMethod === 'card' ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-gray-200'}`}>
                    <label className={`flex items-center p-4 cursor-pointer ${paymentMethod === 'card' ? 'bg-brand-primary/5' : 'hover:bg-gray-50'}`}>
                      <Radio 
                        name="payment" 
                        checked={paymentMethod === 'card'} 
                        onChange={() => setPaymentMethod('card')} 
                      />
                      <span className="font-semibold text-slate-900 ml-4 flex-1">Tarjeta de Crédito / Débito</span>
                      <div className="flex gap-2">
                        {/* Placeholder icons for cards */}
                        <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center text-[8px] text-white font-bold">VISA</div>
                        <div className="w-8 h-5 bg-red-500 rounded flex items-center justify-center text-[8px] text-white font-bold">MC</div>
                      </div>
                    </label>
                    
                    {paymentMethod === 'card' && (
                      <div className="p-5 border-t border-gray-100 bg-white space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <Input label="Número de tarjeta" placeholder="0000 0000 0000 0000" />
                        <div className="grid grid-cols-2 gap-5">
                          <Input label="Vencimiento (MM/AA)" placeholder="MM/AA" />
                          <Input label="CVC" placeholder="123" type="password" maxLength={4} />
                        </div>
                        <Input label="Nombre en la tarjeta" placeholder="Ej. María Pérez" />
                      </div>
                    )}
                  </div>

                  {/* Transferencia */}
                  <div className={`border rounded-2xl overflow-hidden transition-all ${paymentMethod === 'transfer' ? 'border-brand-primary ring-1 ring-brand-primary' : 'border-gray-200'}`}>
                    <label className={`flex items-center p-4 cursor-pointer ${paymentMethod === 'transfer' ? 'bg-brand-primary/5' : 'hover:bg-gray-50'}`}>
                      <Radio 
                        name="payment" 
                        checked={paymentMethod === 'transfer'} 
                        onChange={() => setPaymentMethod('transfer')} 
                      />
                      <span className="font-semibold text-slate-900 ml-4 flex-1">Transferencia Bancaria</span>
                      <Building2 className="w-5 h-5 text-gray-400" />
                    </label>
                    {paymentMethod === 'transfer' && (
                      <div className="p-5 border-t border-gray-100 bg-white animate-in slide-in-from-top-2 duration-300">
                        <p className="text-sm text-muted">
                          Al finalizar la compra, te mostraremos los datos de nuestra cuenta bancaria para que realices la transferencia.
                          Tu pedido se procesará una vez confirmemos el pago.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Seguridad */}
                <div className="flex items-center gap-2 mt-6 text-sm text-green-600 bg-green-50 p-4 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-medium">Tus pagos son procesados de forma segura y encriptada.</span>
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
                          <span className="font-bold text-slate-900">{item.price}</span>
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

                <Button variant="primary" className="w-full py-4 text-base shadow-md font-bold rounded-xl" rightIcon={<ShieldCheck className="w-5 h-5"/>}>
                  Completar Pedido
                </Button>

                {/* Trust Badges mini */}
                <div className="flex justify-center items-center gap-4 mt-6">
                  <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                    <Truck className="w-4 h-4" /> Envíos Seguros
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-300" />
                  <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Garantía Total
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
