"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductCard } from '@/components/ui/ProductCard';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Star } from 'lucide-react';
import { MarketplaceNavbar } from '@/components/layout/MarketplaceNavbar';
import { BannerCarousel } from '@/components/ui/BannerCarousel';
import { Footer } from '@/components/layout/Footer';

import { mockCategories, mockBrands, mockProducts } from '@/lib/mock-data';

export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const categoryParam = searchParams.get('category');
  const [activeCategory, setActiveCategory] = useState(categoryParam || "Todas");

  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    router.push(
      cat === "Todas" ? "/marketplace" : `/marketplace?category=${encodeURIComponent(cat)}`,
      { scroll: false }
    );
  };

  const filteredProducts = activeCategory === "Todas" 
    ? mockProducts 
    : mockProducts.filter(p => p.category === activeCategory);

  const heroBanners = [
    {
      tag: "NUEVA COLECCIÓN",
      title: "Encuentra tu estilo, Ama tu look",
      description: "Descubre las últimas tendencias en artesanía, moda y estilo de vida con impacto social directo en el Amazonas.",
      buttonText: "Comprar Ahora",
      image: "/bolso-de-moriche.webp"
    },
    {
      tag: "OFERTA ESPECIAL",
      title: "Cestería Tradicional",
      description: "Dale un toque único a tu hogar con cestas elaboradas a mano por comunidades indígenas.",
      buttonText: "Ver Catálogo",
      image: "/cesta-wayuu.jpg"
    },
    {
      tag: "ARTE VIVO",
      title: "Cerámica Pemón",
      description: "Piezas únicas llenas de historia y cultura, hechas con arcilla natural de la región.",
      buttonText: "Descubrir",
      image: "/ceramica-pemón.jpg"
    }
  ];

  return (
    <>
      <MarketplaceNavbar />
      <main className="min-h-screen bg-background pt-28 md:pt-32 pb-12 px-4 md:px-8 max-w-[1400px] mx-auto font-sans">
        
        {/* HERO BANNER CAROUSEL */}
        <BannerCarousel banners={heroBanners} />

        {/* CATEGORIES PILLS */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {mockCategories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
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
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    {...product}
                    href={`/marketplace/${product.id}`}
                  />
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-gray-500">
                  <p>No se encontraron productos en la categoría "{activeCategory}".</p>
                  <Button variant="outline" className="mt-4" onClick={() => handleCategoryClick("Todas")}>Ver todos los productos</Button>
                </div>
              )}
            </div>
          </div>

        </div>

      </main>
      <Footer />
    </>
  );
}
