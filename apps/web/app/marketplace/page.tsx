"use client";

import React, { useState } from 'react';
import { ProductCard } from '@/components/ui/ProductCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Star } from 'lucide-react';
import { MarketplaceNavbar } from '@/components/layout/MarketplaceNavbar';
import { Footer } from '@/components/layout/Footer';

const mockCategories = ["Todas", "Ofertas", "Artesanía", "Moda", "Hogar", "Joyería", "Cestería", "Cerámica"];
const mockBrands = ["Comunidad Wayuu", "Comunidad Pemón", "Artesanos de los Andes", "Emprendedores Locales", "Hecho a Mano"];

const mockProducts = [
  {
    id: '1',
    image: '/cesta-wayuu.jpg',
    discount: '50%',
    title: 'Cesta Wayuu',
    rating: 4,
    category: 'Artesanía',
    description: 'Hermosa cesta tejida a mano con patrones tradicionales.',
    price: '$25.00',
    originalPrice: '$50.00'
  },
  {
    id: '2',
    image: '/bolso-de-moriche.webp',
    discount: 'Nuevo',
    title: 'Bolso de Moriche',
    rating: 5,
    category: 'Accesorios',
    description: 'Bolso ecológico fabricado con fibra de palma de moriche.',
    price: '$35.00'
  },
  {
    id: '3',
    image: '/ceramica-pemón.jpg',
    title: 'Cerámica Pemón',
    rating: 4,
    category: 'Hogar',
    description: 'Pieza de cerámica artesanal con diseños de la cultura Pemón.',
    price: '$40.00'
  },
  {
    id: '4',
    image: '/collar-de-semillas.jpg',
    title: 'Collar de Semillas',
    rating: 3,
    category: 'Joyería',
    description: 'Collar elaborado con semillas autóctonas de la selva amazónica.',
    price: '$15.00'
  }
];

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState("Todas");

  return (
    <>
      <MarketplaceNavbar />
      <main className="min-h-screen bg-background pt-28 md:pt-32 pb-12 px-4 md:px-8 max-w-[1400px] mx-auto font-sans">
        
        {/* HERO BANNER */}
        <div className="w-full mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="w-full md:w-1/2 text-slate-900">
            <span className="inline-block px-3 py-1 bg-brand-primary/15 text-brand-primary rounded-full text-xs font-bold mb-4 tracking-wide">
              NUEVA COLECCIÓN
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight text-slate-900">
              Encuentra tu estilo, Ama tu look
            </h2>
            <p className="text-muted mb-8 text-lg max-w-md">
              Descubre las últimas tendencias en artesanía, moda y estilo de vida con impacto social directo en el Amazonas.
            </p>
            <Button className="rounded-full px-8 shadow-sm" variant="primary" size="lg">
              Comprar Ahora
            </Button>
          </div>
          <div className="w-full md:w-1/2 flex justify-end">
            <div className="relative w-full max-w-lg aspect-video md:aspect-[4/3] rounded-3xl overflow-hidden shadow-sm border border-gray-200">
              <img src="/bolso-de-moriche.webp" alt="Nueva Colección" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* CATEGORIES PILLS */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {mockCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full font-medium whitespace-nowrap transition-colors border shadow-sm ${
                activeCategory === cat 
                  ? 'bg-brand-primary text-white border-brand-primary' 
                  : 'bg-white text-foreground border-gray-200 hover:border-brand-primary/50 hover:bg-brand-primary/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* MAIN LAYOUT (SIDEBAR + GRID) */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* SIDEBAR FILTERS */}
          <aside className="w-full lg:w-[280px] shrink-0 flex flex-col gap-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit">
            
            {/* Price Range */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 text-lg">Rango de Precio</h3>
                <button className="text-xs text-muted hover:text-brand-primary transition-colors">Reset</button>
              </div>
              <p className="text-xs text-muted mb-4 font-medium">El precio promedio es $30.00</p>
              <div className="flex items-center gap-3">
                <Input placeholder="Min" type="number" wrapperClassName="h-10" className="text-sm" />
                <span className="text-muted font-medium">-</span>
                <Input placeholder="Max" type="number" wrapperClassName="h-10" className="text-sm" />
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <h3 className="font-bold text-slate-900 text-lg mb-4">Calificación</h3>
              <div className="flex items-center justify-between cursor-pointer group">
                <div className="flex gap-1 text-amber-400 group-hover:scale-105 transition-transform">
                  {[1,2,3,4].map(s => <Star key={s} className="w-5 h-5 fill-amber-400" />)}
                  <Star className="w-5 h-5 text-gray-300 stroke-2" />
                </div>
                <span className="text-sm font-semibold text-muted group-hover:text-amber-500 transition-colors">4+ Estrellas</span>
              </div>
            </div>

            {/* Brands / Origen */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 text-lg">Origen / Marca</h3>
                <button className="text-xs text-muted hover:text-brand-primary transition-colors">Reset</button>
              </div>
              <div className="flex flex-col gap-3.5">
                {mockBrands.map(brand => (
                  <Checkbox key={brand} label={brand} />
                ))}
              </div>
              <button className="text-sm text-brand-primary font-bold mt-5 hover:underline decoration-2 underline-offset-4">
                Ver más opciones
              </button>
            </div>

            {/* Delivery Options */}
            <div>
              <h3 className="font-bold text-slate-900 text-lg mb-4">Opciones de Envío</h3>
              <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                <Button variant="primary" size="sm" className="flex-1 rounded-lg py-2 shadow-sm">Estándar</Button>
                <Button variant="ghost" size="sm" className="flex-1 rounded-lg py-2 text-muted hover:text-foreground">Recoger</Button>
              </div>
            </div>

          </aside>

          {/* PRODUCT GRID */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {mockProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  href={`/marketplace/${product.id}`}
                />
              ))}
              {/* Duplicate products to fill the grid nicely for demo purposes */}
              {mockProducts.map((product) => (
                <ProductCard
                  key={`${product.id}-copy`}
                  {...product}
                  href={`/marketplace/${product.id}`}
                />
              ))}
            </div>
          </div>

        </div>

      </main>
      <Footer />
    </>
  );
}
