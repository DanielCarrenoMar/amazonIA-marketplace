import React from 'react';
import Link from 'next/link';
import { Icon } from "@iconify/react";
import { ProductCard } from '@/components/ui/ProductCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { MarketplaceNavbar } from '@/components/layout/MarketplaceNavbar';
import { Footer } from '@/components/layout/Footer';
import { mockProducts, mockBrands } from '@/lib/mock-data';

export default function FavoritesPage() {
  // Simulamos que el usuario tiene 3 productos guardados en favoritos
  const favoriteProducts = mockProducts.slice(0, 3);

  return (
    <>
      <MarketplaceNavbar />
      <main className="min-h-screen bg-gray-50/50 pt-32 pb-20 px-4 md:px-8 font-sans">
        <div className="max-w-[1400px] mx-auto">
          
          {/* HEADER */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Mis Favoritos</h1>
            <p className="text-gray-500 font-medium mt-1">Aquí están los productos que te han encantado.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* SIDEBAR FILTERS */}
            <aside className="w-full lg:w-[280px] shrink-0 flex flex-col gap-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit">
              {/* Price Range */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 text-lg">Rango de Precio</h3>
                  <button className="text-xs text-muted hover:text-brand-primary transition-colors">Limpiar</button>
                </div>
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
                    {[1,2,3,4].map(s => <Icon icon="lucide:star" key={s} className="w-5 h-5 fill-amber-400" />)}
                    <Icon icon="lucide:star" className="w-5 h-5 text-gray-300 stroke-2" />
                  </div>
                  <span className="text-sm font-semibold text-muted group-hover:text-amber-500 transition-colors">4+ Estrellas</span>
                </div>
              </div>

              {/* Brands / Origen */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 text-lg">Origen / Marca</h3>
                  <button className="text-xs text-muted hover:text-brand-primary transition-colors">Limpiar</button>
                </div>
                <div className="flex flex-col gap-3.5">
                  {mockBrands.map(brand => (
                    <Checkbox key={brand} label={brand} />
                  ))}
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1">
              {/* GRID */}
              {favoriteProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {favoriteProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      {...product}
                      href={`/marketplace/${product.id}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
                  {/* EMPTY STATE */}
                  <Icon icon="lucide:heart" className="w-16 h-16 text-gray-200 mb-6" />
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Aún no tienes favoritos</h2>
                  <p className="text-gray-500 mb-8 max-w-md">Explora nuestro catálogo y guarda los productos que más te gusten haciendo clic en el corazón.</p>
                  <Link href="/marketplace">
                    <Button variant="primary" className="px-8 font-bold shadow-sm rounded-full">
                      Explorar catálogo
                    </Button>
                  </Link>
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
