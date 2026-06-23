"use client";

import React, { useState } from 'react';
import { ProductCard } from '@/components/ui/ProductCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, ShoppingCart, UserCircle2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const mockProducts = [
  {
    id: '1',
    image: '/cesta-wayuu.jpg',
    discount: '50%',
    title: 'Cesta Wayuu',
    rating: 4,
    category: 'Artesanía',
    description: 'Hermosa cesta tejida a mano con patrones tradicionales. Pretium dui odio in nibh sapien tortor id.',
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
    description: 'Bolso ecológico fabricado con fibra de palma de moriche. Pretium dui odio in nibh sapien tortor id.',
    price: '$35.00'
  },
  {
    id: '3',
    image: '/ceramica-pemón.jpg',
    title: 'Cerámica Pemón',
    rating: 4,
    category: 'Hogar',
    description: 'Pieza de cerámica artesanal con diseños de la cultura Pemón. Pretium dui odio in nibh sapien tortor id.',
    price: '$40.00'
  },
  {
    id: '4',
    image: '/collar-de-semillas.jpg',
    title: 'Collar de Semillas',
    rating: 3,
    category: 'Joyería',
    description: 'Collar elaborado con semillas autóctonas de la selva amazónica. Pretium dui odio in nibh sapien tortor id.',
    price: '$15.00'
  }
];

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 pt-28 pb-12 px-6 md:px-12 max-w-7xl mx-auto font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-8">
          Catálogo de Producto
        </h1>
        
        <div className="flex justify-center">
          
          {/* SEARCH BAR */}
          <div className="flex w-full md:w-4/5 lg:w-3/4 xl:w-2/3 items-center">
            <Input 
              leftIcon={<Search className="w-5 h-5 text-gray-400" />}
              placeholder="Buscar Productos"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus-within:z-10"
              wrapperClassName="rounded-l-full rounded-r-none border-r-0 bg-white"
            />
            <Button 
              className="rounded-l-none rounded-r-full px-8 h-[46px] shadow-none"
              variant="primary"
            >
              Buscar
            </Button>
          </div>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {mockProducts.map((product) => (
          <ProductCard
            key={product.id}
            image={product.image}
            discount={product.discount}
            title={product.title}
            rating={product.rating}
            category={product.category}
            description={product.description}
            price={product.price}
            originalPrice={product.originalPrice}
            href={`/marketplace/${product.id}`}
          />
        ))}
      </div>
    </main>
      <Footer />
    </>
  );
}
