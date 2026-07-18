"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Icon } from "@iconify/react";
import { ProductCard } from '@/components/ui/ProductCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MarketplaceNavbar } from '@/components/layout/MarketplaceNavbar';
import { Footer } from '@/components/layout/Footer';
import { getFavorites } from '@/lib/api/favorite.api';
import { UserFavoriteResponseDto } from 'event-types';
import { useAuth } from '@/lib/useAuth';
import { useFavorites } from '@/lib/favoriteContext';

function FavoritesContent() {
  const { user } = useAuth();
  const { favoriteIds } = useFavorites();
  const [favorites, setFavorites] = useState<UserFavoriteResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [minRating, setMinRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  useEffect(() => {
    const fetchFavs = async () => {
      try {
        const data = await getFavorites();
        setFavorites(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFavs();
    } else if (user === null) {
      setLoading(false); // If auth finished loading and user is null
    }
  }, [user]);

  // Si no ha cargado, evitamos mostrar el empty state bruscamente
  if (loading) {
    return (
      <>
        <MarketplaceNavbar />
        <main className="min-h-screen bg-gray-50/50 pt-32 pb-20 px-4 md:px-8 font-sans flex items-center justify-center">
          <Icon icon="lucide:loader-2" className="w-10 h-10 text-brand-primary animate-spin" />
        </main>
      </>
    );
  }

  // Filtrar los favoritos que aún están likeados + aplicar filtros de rating y precio
  const visibleFavorites = favorites.filter(fav => {
    const p = fav.product;
    if (!p) return false;
    
    // Sincronización en tiempo real: si el ID no está en favoriteIds, se oculta instantáneamente
    if (!favoriteIds.has(p.id)) return false;

    // Filtro de precio
    const price = Number(p.price);
    if (minPrice && price < Number(minPrice)) return false;
    if (maxPrice && price > Number(maxPrice)) return false;

    // Filtro de calificación
    const rating = p.averageRating ? Number(p.averageRating) : 0;
    if (minRating > 0 && rating < minRating) return false;

    return true;
  });

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
                  <button 
                    onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                    className="text-xs text-muted hover:text-brand-primary transition-colors cursor-pointer"
                  >
                    Limpiar
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    leftIcon={<span className="text-gray-400 font-medium font-sans">$</span>}
                    wrapperClassName="h-10 rounded-2xl bg-gray-50/50 border-gray-200"
                    className="text-sm"
                  />
                  <span className="text-gray-300 font-medium">-</span>
                  <Input
                    placeholder="Max"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    leftIcon={<span className="text-gray-400 font-medium font-sans">$</span>}
                    wrapperClassName="h-10 rounded-2xl bg-gray-50/50 border-gray-200"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 text-lg">Calificación</h3>
                  <button
                    onClick={() => setMinRating(0)}
                    className="text-xs text-muted hover:text-brand-primary transition-colors cursor-pointer"
                  >
                    Limpiar
                  </button>
                </div>
                <div className="flex items-center justify-between group">
                  <div
                    className="flex gap-1 transition-transform"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {[1, 2, 3, 4, 5].map(star => {
                      const isFilled = star <= (hoverRating || minRating);
                      return (
                        <Icon
                          key={star}
                          icon="mdi:star"
                          onMouseEnter={() => setHoverRating(star)}
                          onClick={() => setMinRating(star)}
                          className={`w-6 h-6 cursor-pointer transition-colors ${isFilled ? "text-amber-400 hover:scale-110" : "text-gray-300 hover:scale-110 hover:text-amber-200"
                            }`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-sm font-semibold text-muted">
                    {minRating > 0 ? `${minRating} Estrella${minRating !== 1 ? 's' : ''}` : 'Todas'}
                  </span>
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1">
              {/* GRID */}
              {visibleFavorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {visibleFavorites.map((fav) => {
                    const p = fav.product;
                    if (!p) return null;
                    return (
                      <ProductCard
                        key={p.id}
                        id={p.id}
                        title={p.name}
                        price={`$${p.price}`}
                        image={p.imageUrl || '/placeholder.png'}
                        category={p.category?.categoryName || 'General'}
                        description={p.description || ''}
                        rating={Number(p.averageRating || 0)}
                        href={`/marketplace/${p.id}`}
                        stockAvailable={p.stockAvailable}
                      />
                    );
                  })}
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

export default function FavoritesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando favoritos...</div>}>
      <FavoritesContent />
    </Suspense>
  );
}
