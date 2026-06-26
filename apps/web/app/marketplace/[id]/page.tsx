"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Icon } from "@iconify/react";
import { mockProducts } from '@/lib/mock-data';
import { getProductById } from '@/lib/api';
import type { ProductResponseDto } from 'event-types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { ProductCard } from '@/components/ui/ProductCard';
import { MarketplaceNavbar } from '@/components/layout/MarketplaceNavbar';
import { Footer } from '@/components/layout/Footer';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<ProductResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState('Algodón');
  const [selectedSize, setSelectedSize] = useState('100m');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductById(id);
        setProduct(data);
        setActiveImage(data.imageUrl || '/cesta-wayuu.jpg');
      } catch (err: any) {
        setError(err.message || 'Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product?.imageUrl) {
      setActiveImage(product.imageUrl);
    }
  }, [product?.imageUrl]);


  const handleDecrease = () => setQuantity(q => Math.max(1, q - 1));
  const handleIncrease = () => setQuantity(q => q + 1);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth + 40 : scrollLeft + clientWidth - 40;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  // You can replace these with actual product images later
  const thumbnails = [
    '/cesta-wayuu.jpg',
    '/bolso-de-moriche.webp',
    '/ceramica-pemón.jpg',
    '/collar-de-semillas.jpg'
  ];

  if (loading) {
    return (
      <>
        <MarketplaceNavbar />
        <main className="min-h-screen bg-background pt-32 pb-16 px-4 md:px-8 max-w-[1400px] mx-auto font-sans flex justify-center items-center">
          <p className="text-gray-500">Cargando producto...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <MarketplaceNavbar />
        <main className="min-h-screen bg-background pt-32 pb-16 px-4 md:px-8 max-w-[1400px] mx-auto font-sans flex justify-center items-center">
          <p className="text-red-500">{error || 'Producto no encontrado'}</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <MarketplaceNavbar />
      <main className="min-h-screen bg-background pt-28 md:pt-32 pb-16 px-4 md:px-8 max-w-[1400px] mx-auto font-sans">
        
        {/* BREADCRUMBS */}
        <nav className="text-sm text-gray-500 mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-brand-primary transition-colors">Inicio</Link>
          <span>&gt;</span>
          <Link href="/marketplace" className="hover:text-brand-primary transition-colors">Catálogo</Link>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* LEFT: IMAGES */}
          <div className="flex flex-col gap-4">
            <div className="relative w-full aspect-[4/3] md:aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm bg-gray-50">
              <Image 
                src={activeImage}
                alt="Imagen principal del producto"
                fill
                className="object-cover"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 bg-white/80 backdrop-blur-md shadow-sm hover:scale-110 text-red-500"
              >
                <Icon icon="lucide:heart" className="w-6 h-6 fill-red-500" />
              </Button>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mt-2">
              {thumbnails.map((thumb, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(thumb)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === thumb ? 'border-brand-primary shadow-md scale-105 z-10' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <Image src={thumb} alt={`Miniatura ${idx + 1}`} fill className="object-cover bg-gray-100" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: DETAILS */}
          <div className="flex flex-col pt-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-4">
              {product.category && (
                <Badge variant="secondary" className="px-4 py-1.5 text-sm">
                  {product.category.name || 'Categoría'}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex gap-1 text-amber-400">
                {[1,2,3,4,5].map((star) => (
                  <Icon icon="lucide:star" key={star} className={`w-5 h-5 ${star <= 4 ? 'fill-amber-400' : 'text-gray-300 stroke-2'}`} />
                ))}
              </div>
              <span className="text-gray-600 font-medium">4/5</span>
              <a href="#reviews" className="text-brand-primary hover:underline text-sm font-medium">Ver 24 Reseñas</a>
            </div>

            <div className="flex items-end gap-3 mb-6">
              <span className="text-4xl font-bold text-brand-primary">${Number(product.price).toFixed(2)}</span>
            </div>

            <p className="text-gray-600 leading-relaxed mb-8">
              {product.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div>
                <Select 
                  label="Material"
                  value={selectedMaterial}
                  onChange={setSelectedMaterial}
                  options={[
                    { label: 'Algodón', value: 'Algodón' },
                    { label: 'Seda', value: 'Seda' },
                    { label: 'Lino', value: 'Lino' }
                  ]}
                />
              </div>
              <div>
                <Select 
                  label="Tamaño"
                  value={selectedSize}
                  onChange={setSelectedSize}
                  options={[
                    { label: '50m', value: '50m' },
                    { label: '100m', value: '100m' },
                    { label: '200m', value: '200m' }
                  ]}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-900 block mb-1.5">Cantidad</label>
                <div className="flex items-center h-[50px] border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <button onClick={handleDecrease} className="w-12 h-full flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors">
                    <Icon icon="lucide:minus" className="w-4 h-4" />
                  </button>
                  <div className="flex-1 h-full flex items-center justify-center font-semibold text-gray-900 border-x border-gray-200">
                    {quantity}
                  </div>
                  <button onClick={handleIncrease} className="w-12 h-full flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors">
                    <Icon icon="lucide:plus" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-auto">
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full text-lg h-14"
                leftIcon={<Icon icon="lucide:shopping-cart" className="w-5 h-5" />}
              >
                Añadir al carrito
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full text-lg h-14 border-2"
              >
                Comprar Ahora
              </Button>
            </div>

          </div>
        </div>

        {/* REVIEWS SECTION */}
        <section id="reviews" className="mt-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Reseñas de Compradores</h2>
            <Button variant="outline" className="rounded-xl border-gray-300">Escribir Reseña</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Review 1 */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <Avatar fallback="MJ" size="md" />
                  <div>
                    <h4 className="font-bold text-slate-900">María Jiménez</h4>
                    <p className="text-xs text-muted font-medium mt-0.5">Comprador Verificado • Hace 2 semanas</p>
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0 pt-1">
                  {[1,2,3,4,5].map((star) => <Icon icon="lucide:star" key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
              </div>
              <p className="text-muted leading-relaxed text-sm">
                "¡Absolutamente hermosa! La calidad del tejido es increíble y se nota el trabajo artesanal en cada detalle. Llegó muy rápido y en perfectas condiciones. Definitivamente volveré a comprar en este marketplace."
              </p>
            </div>

            {/* Review 2 */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <Avatar fallback="CA" size="md" />
                  <div>
                    <h4 className="font-bold text-slate-900">Carlos Alberto</h4>
                    <p className="text-xs text-muted font-medium mt-0.5">Comprador Verificado • Hace 1 mes</p>
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0 pt-1">
                  {[1,2,3,4].map((star) => <Icon icon="lucide:star" key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  <Icon icon="lucide:star" className="w-4 h-4 text-gray-300 stroke-2" />
                </div>
              </div>
              <p className="text-muted leading-relaxed text-sm">
                "Compré esta tela como regalo para mi madre y le encantó. Los colores son muy vivos y el material es de buena calidad. Le doy 4 estrellas solo porque esperaba que fuera un poco más grande de lo que llegó."
              </p>
            </div>
          </div>
        </section>

        {/* RELATED PRODUCTS */}
        <section className="mt-24">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8">Productos Relacionados</h2>
          
          <div className="relative group">
            {/* Side Arrows */}
            <button 
              onClick={() => scroll('left')}
              className="absolute -left-4 md:-left-5 top-[40%] -translate-y-1/2 w-12 h-12 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow-lg border border-gray-100 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Icon icon="lucide:chevron-left" className="w-6 h-6 text-slate-700" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="absolute -right-4 md:-right-5 top-[40%] -translate-y-1/2 w-12 h-12 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow-lg border border-gray-100 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Icon icon="lucide:chevron-right" className="w-6 h-6 text-slate-700" />
            </button>

            {/* Scroll Container */}
            <div 
              ref={scrollRef}
              className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {mockProducts.filter(p => p.id !== product.id).map(related => (
                <div key={related.id} className="min-w-[280px] w-[280px] md:min-w-[300px] md:w-[300px] snap-start shrink-0">
                  <ProductCard {...related} href={`/marketplace/${related.id}`} />
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
