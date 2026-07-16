"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from "@iconify/react";
import { getSeller } from '@/lib/api/seller.api';
import { getProducts } from '@/lib/api/product.api';
import type { SellerResponseDto, ProductResponseDto } from 'event-types';
import { Avatar } from '@/components/ui/Avatar';
import { ProductCard } from '@/components/ui/ProductCard';
import { MarketplaceNavbar } from '@/components/layout/MarketplaceNavbar';
import { Footer } from '@/components/layout/Footer';

export default function SellerProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [seller, setSeller] = useState<SellerResponseDto | null>(null);
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        setLoading(true);
        const [sellerData, productsData] = await Promise.all([
          getSeller(id),
          getProducts({ sellerId: id, limit: 50 })
        ]);
        setSeller(sellerData);
        if (productsData.data) {
          setProducts(productsData.data);
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar el perfil del vendedor');
      } finally {
        setLoading(false);
      }
    };
    fetchSellerData();
  }, [id]);

  if (loading) {
    return (
      <>
        <MarketplaceNavbar />
        <main className="min-h-screen bg-background pt-32 pb-16 px-4 md:px-8 max-w-[1400px] mx-auto font-sans flex justify-center items-center">
          <p className="text-gray-500">Cargando perfil del vendedor...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !seller) {
    return (
      <>
        <MarketplaceNavbar />
        <main className="min-h-screen bg-background pt-32 pb-16 px-4 md:px-8 max-w-[1400px] mx-auto font-sans flex justify-center items-center">
          <p className="text-red-500">{error || 'Vendedor no encontrado'}</p>
        </main>
        <Footer />
      </>
    );
  }

  const sellerName = seller.user?.fullName || "Vendedor Anónimo";
  const sellerAvatar = seller.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName)}&background=random`;
  const locationText = seller.user?.locationFormattedAddress || 
    (seller.user?.locationCity ? `${seller.user.locationCity}, ${seller.user.locationRegion || ''}` : 'Ubicación no especificada');

  return (
    <>
      <MarketplaceNavbar />
      <main className="min-h-screen bg-background pt-28 md:pt-32 pb-16 px-4 md:px-8 max-w-[1400px] mx-auto font-sans">
        
        {/* SELLER HEADER */}
        <section className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-8 mb-16 relative overflow-hidden">
          {/* Decorative background shape */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <Avatar src={sellerAvatar} fallback={sellerName.charAt(0)} size="2xl" className="w-32 h-32 md:w-40 md:h-40 shrink-0 shadow-md border-4 border-white" />
          
          <div className="flex flex-col items-center md:items-start flex-1 w-full relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 text-center md:text-left">
              {sellerName}
            </h1>
            
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 mb-6 text-gray-600">
              <div className="flex items-center gap-2 font-medium">
                <Icon icon="lucide:map-pin" className="w-5 h-5 text-brand-primary" />
                <span>{locationText}</span>
              </div>
              
              {seller.tribe && (
                <div className="flex items-center gap-2 font-medium">
                  <Icon icon="lucide:users" className="w-5 h-5 text-brand-secondary" />
                  <span>Tribu: {seller.tribe.name}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-6 mb-6">
              <div className="flex flex-col items-center md:items-start">
                <span className="text-2xl font-bold text-slate-900 flex items-center gap-1">
                  <Icon icon="mdi:star" className="w-6 h-6 text-amber-400" />
                  {Number(seller.avgProductRating || 0).toFixed(1).replace('.0', '')}
                </span>
                <span className="text-sm text-gray-500 font-medium">Calificación Media</span>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="flex flex-col items-center md:items-start">
                <span className="text-2xl font-bold text-slate-900">{seller.totalReviews || 0}</span>
                <span className="text-sm text-gray-500 font-medium">Reseñas Totales</span>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="flex flex-col items-center md:items-start">
                <span className="text-2xl font-bold text-slate-900">{products.length}</span>
                <span className="text-sm text-gray-500 font-medium">Productos</span>
              </div>
            </div>

            {seller.description && (
              <div className="bg-gray-50 p-6 rounded-2xl w-full text-center md:text-left">
                <h3 className="font-semibold text-slate-900 mb-2">Sobre el Vendedor</h3>
                <p className="text-gray-600 leading-relaxed max-w-3xl">
                  {seller.description}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* PRODUCTS SECTION */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              Productos de {sellerName.split(' ')[0]}
            </h2>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {products.map(product => (
                <ProductCard 
                  key={product.id}
                  id={product.id}
                  title={product.name}
                  description={product.description || ""}
                  price={`$${Number(product.price).toFixed(2)}`}
                  image={product.imageUrl || "/bolso-de-moriche.webp"} 
                  rating={product.averageRating ? Math.round(Number(product.averageRating)) : 0}
                  category={product.category?.name || "Categoría"}
                  href={`/marketplace/${product.id}`} 
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-3xl p-12 text-center border border-dashed border-gray-200">
              <Icon icon="lucide:package-open" className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Sin productos activos</h3>
              <p className="text-gray-500">Este vendedor no tiene productos publicados en este momento.</p>
            </div>
          )}
        </section>

      </main>
      <Footer />
    </>
  );
}
