"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Icon } from "@iconify/react";
import { mockProductDtos } from '@/lib/mock-data';
import { getProductById, getProducts } from '@/lib/api';
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
  const [relatedProducts, setRelatedProducts] = useState<ProductResponseDto[]>([]);

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState('Algodón');
  const [selectedSize, setSelectedSize] = useState('100m');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'process' | 'additional_info' | 'artisan'>('process');
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const MOCK_REVIEWS = [
    { name: 'Alex Mathio', date: '13 Oct 2024', stars: 5, text: '"La dedicación a la sostenibilidad y prácticas éticas resuena fuertemente con los consumidores de hoy, posicionando este producto como una opción responsable y hermosa."', initials: 'AM' },
    { name: 'María Jiménez', date: '02 Sep 2024', stars: 5, text: '"¡Absolutamente hermosa! La calidad del tejido es increíble y se nota el trabajo artesanal en cada detalle. Llegó muy rápido y en perfectas condiciones."', initials: 'MJ' },
    { name: 'Carlos Alberto', date: '18 Ago 2024', stars: 4, text: '"Compré este producto como regalo y le encantó a quien lo recibió. Los colores son muy vivos y el material es de buena calidad. 100% recomendado."', initials: 'CA' },
  ];

  const handlePrevReview = () => setActiveReviewIndex(i => (i === 0 ? MOCK_REVIEWS.length - 1 : i - 1));
  const handleNextReview = () => setActiveReviewIndex(i => (i === MOCK_REVIEWS.length - 1 ? 0 : i + 1));

  // Mock data for the behind-the-scenes carousel
  const behindTheScenesMedia = [
    { type: 'video', src: activeImage || '/ceramica-pemón.jpg', title: 'Proceso de Creación' },
    { type: 'image', src: '/bolso-de-moriche.webp', title: 'El Taller' },
    { type: 'video', src: '/cesta-wayuu.jpg', title: 'Técnicas Ancestrales' },
  ];

  const handlePrevMedia = () => {
    setActiveMediaIndex((prev) => (prev === 0 ? behindTheScenesMedia.length - 1 : prev - 1));
  };

  const handleNextMedia = () => {
    setActiveMediaIndex((prev) => (prev === behindTheScenesMedia.length - 1 ? 0 : prev + 1));
  };

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

  useEffect(() => {
    if (product?.categoryId) {
      getProducts({ categoryId: product.categoryId, limit: 10 })
        .then(res => {
          if (res.data) {
            setRelatedProducts(res.data.filter(p => p.id !== product.id));
          }
        })
        .catch(console.error);
    }
  }, [product?.categoryId, product?.id]);

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
            <div className="relative w-full aspect-4/3 md:aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm bg-gray-50">
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
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${activeImage === thumb ? 'border-brand-primary shadow-md scale-105 z-10' : 'border-transparent opacity-70 hover:opacity-100'}`}
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
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon icon="lucide:star" key={star} className={`w-5 h-5 ${star <= Math.round(Number(product.averageRating || 0)) ? 'fill-amber-400' : 'text-gray-300 stroke-2'}`} />
                ))}
              </div>
              <span className="text-gray-600 font-medium">{Number(product.averageRating || 0).toFixed(1).replace('.0', '')}/5</span>
              <a href="#reviews" className="text-brand-primary hover:underline text-sm font-medium">
                {product.totalReviews > 0 ? `Ver ${product.totalReviews} Reseñas` : 'Aún no hay reseñas'}
              </a>
            </div>

            <div className="flex items-end gap-3 mb-6">
              <span className="text-4xl font-bold text-brand-primary">${Number(product.price).toFixed(2)}</span>
            </div>

            <p className="text-gray-600 leading-relaxed mb-8">
              {product.description}
            </p>

            <div className="mb-10 max-w-40">
              <div>
                <label className="text-sm font-semibold text-gray-900 block mb-1.5">Cantidad</label>
                <div className="flex items-center h-[50px] border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <button onClick={handleDecrease} className="w-12 h-full flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer">
                    <Icon icon="lucide:minus" className="w-4 h-4" />
                  </button>
                  <div className="flex-1 h-full flex items-center justify-center font-semibold text-gray-900 border-x border-gray-200">
                    {quantity}
                  </div>
                  <button onClick={handleIncrease} className="w-12 h-full flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer">
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

        {/* TABS NAVIGATION */}
        <div className="mt-20 border-b border-gray-200">
          <div className="flex justify-center gap-12">
            <button
              onClick={() => setActiveTab('process')}
              className={`pb-4 text-lg font-semibold cursor-pointer transition-colors relative ${
                activeTab === 'process' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Proceso
              {activeTab === 'process' && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-primary rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('artisan')}
              className={`pb-4 text-lg font-semibold cursor-pointer transition-colors relative ${
                activeTab === 'artisan' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Sobre el Artesano
              {activeTab === 'artisan' && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-primary rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('additional_info')}
              className={`pb-4 text-lg font-semibold cursor-pointer transition-colors relative ${
                activeTab === 'additional_info' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Información Adicional
              {activeTab === 'additional_info' && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-primary rounded-t-full" />
              )}
            </button>
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className="py-12">
          {activeTab === 'process' && (
            <section>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Multimedia / Video Carousel */}
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden group shadow-lg border border-gray-100">
              <div className="relative w-full h-full transition-transform duration-500">
                <Image 
                  src={behindTheScenesMedia[activeMediaIndex].src} 
                  alt="Detrás de escena" 
                  fill 
                  className={`object-cover ${behindTheScenesMedia[activeMediaIndex].type === 'video' ? 'blur-[2px] brightness-75 cursor-pointer group-hover:scale-105 transition-transform duration-500' : 'brightness-90 transition-transform duration-500 group-hover:scale-105'}`} 
                />
              </div>
              
              {behindTheScenesMedia[activeMediaIndex].type === 'video' && (
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center cursor-pointer pointer-events-none">
                  <div className="w-20 h-20 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 group-hover:scale-110 transition-transform shadow-xl">
                    <Icon icon="lucide:play" className="w-8 h-8 text-white fill-white ml-1" />
                  </div>
                </div>
              )}

              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-end pointer-events-none">
                <h3 className="text-white font-bold text-xl drop-shadow-md">
                  {activeMediaIndex + 1} / {behindTheScenesMedia.length}
                </h3>
              </div>

              {/* Carousel Navigation Buttons */}
              <button 
                onClick={handlePrevMedia}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 hover:bg-white backdrop-blur flex items-center justify-center shadow transition-colors z-10 opacity-0 group-hover:opacity-100 cursor-pointer"
              >
                <Icon icon="lucide:chevron-left" className="w-6 h-6 text-slate-800" />
              </button>
              <button 
                onClick={handleNextMedia}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 hover:bg-white backdrop-blur flex items-center justify-center shadow transition-colors z-10 opacity-0 group-hover:opacity-100 cursor-pointer"
              >
                <Icon icon="lucide:chevron-right" className="w-6 h-6 text-slate-800" />
              </button>
            </div>

            {/* Elaboraton Process */}
            <div className="flex flex-col">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-6">Proceso de Elaboración</h2>
              
              <p className="text-gray-600 leading-relaxed mb-6 text-lg">
                Esta pieza fue elaborada utilizando técnicas ancestrales transmitidas de generación en generación. Desde la recolección responsable de la materia prima en las profundidades de la selva, hasta el minucioso proceso de secado, teñido natural y ensamblaje final. Cada etapa se realiza a mano, respetando los tiempos de la naturaleza y garantizando un nivel de detalle que las máquinas no pueden replicar.
              </p>
            </div>
          </div>
        </section>
        )}

        {activeTab === 'additional_info' && (
          <section className="max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-primary text-white">
                    <th className="py-4 px-6 font-semibold">Especificación</th>
                    <th className="py-4 px-6 font-semibold">Detalles</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-slate-900">Categoría</td>
                    <td className="py-4 px-6">{product.category?.name || "No especificada"}</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-slate-900">Stock Disponible</td>
                    <td className="py-4 px-6">
                      {product.stockAvailable > 0 ? `${product.stockAvailable} unidades` : "Agotado"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-slate-900">Ubicación del Vendedor</td>
                    <td className="py-4 px-6">
                      {product.locationFormattedAddress || `${product.locationCity || 'No especificada'}, ${product.locationRegion || ''}`}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-slate-900">Fecha de Publicación</td>
                    <td className="py-4 px-6">
                      {product.createdAt ? new Date(product.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : "No disponible"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'artisan' && (
          <section className="max-w-3xl mx-auto py-8">
            <div className="flex flex-col items-center text-center">
              <Avatar src="https://i.pravatar.cc/150?u=artesano" fallback={product.seller?.user?.fullName?.charAt(0) || "AT"} size="2xl" className="mb-6" />
              <h3 className="text-3xl font-extrabold text-slate-900 mb-2">
                {product.seller?.user?.fullName || "Comunidad Artesanal Amazónica"}
              </h3>
              <div className="flex items-center justify-center gap-2 mb-6">
                <Icon icon="lucide:map-pin" className="w-5 h-5 text-brand-primary" />
                <p className="text-gray-600 font-medium">
                  {product.locationCity ? `${product.locationCity}, ${product.locationRegion || 'Venezuela'}` : 'Amazonas, Venezuela'}
                </p>
              </div>
              <p className="text-gray-600 leading-relaxed text-lg mb-8 max-w-2xl">
                {product.seller?.bio || 
                "Somos un grupo de artesanos dedicados a preservar las técnicas ancestrales de tejido y tallado que se han transmitido de generación en generación en nuestra comunidad. Cada pieza que creamos cuenta una historia única de nuestra selva, utilizando materiales 100% sostenibles y recolectados con respeto por la naturaleza."}
              </p>
              <Button variant="outline" className="px-8 rounded-xl h-12 font-bold border-gray-300 hover:border-brand-primary hover:text-brand-primary hover:bg-transparent">
                Ver Perfil Completo
              </Button>
            </div>
          </section>
        )}
        </div>

        {/* REVIEWS SECTION */}
        <section id="reviews" className="mt-24">
          <div className="flex flex-col md:flex-row gap-12 mt-12">
            {/* Left: Summary */}
            <div className="w-full md:w-1/3 flex flex-col">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8">Rating & Reviews</h2>
              
              <div className="flex items-center gap-6 mb-2">
                <div className="flex items-baseline text-slate-900">
                  <span className="text-7xl font-extrabold tracking-tighter">{Number(product.averageRating || 0).toFixed(1).replace('.0', '')}</span>
                  <span className="text-3xl font-bold text-gray-400">/5</span>
                </div>
                
                <div className="flex-1 flex flex-col gap-2">
                  {[
                    { stars: 5, pct: 80 },
                    { stars: 4, pct: 15 },
                    { stars: 3, pct: 3 },
                    { stars: 2, pct: 1 },
                    { stars: 1, pct: 1 },
                  ].map(row => (
                    <div key={row.stars} className="flex items-center gap-2 text-sm">
                      <span className="flex items-center gap-1 font-semibold text-gray-700 w-8">
                        <Icon icon="lucide:star" className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {row.stars}
                      </span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-900 rounded-full" style={{ width: `${row.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-gray-500 font-medium">({product.totalReviews || 0} Reseñas)</p>
            </div>

            {/* Right: Reviews Carousel */}
            {product.totalReviews > 0 ? (
              <div className="w-full md:w-2/3 flex items-center gap-4">
                <button
                  onClick={handlePrevReview}
                  className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Icon icon="lucide:chevron-left" className="w-5 h-5 text-slate-700" />
                </button>

                <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-8 flex-1 min-h-[220px]">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{MOCK_REVIEWS[activeReviewIndex].name}</h4>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Icon
                            key={star}
                            icon="lucide:star"
                            className={`w-4 h-4 ${star <= MOCK_REVIEWS[activeReviewIndex].stars ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 font-medium">{MOCK_REVIEWS[activeReviewIndex].date}</p>
                  </div>

                  <p className="text-gray-600 leading-relaxed mb-6">{MOCK_REVIEWS[activeReviewIndex].text}</p>

                  <div className="flex items-center justify-between">
                    <Avatar fallback={MOCK_REVIEWS[activeReviewIndex].initials} size="md" />
                    <div className="flex gap-2">
                      {MOCK_REVIEWS.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveReviewIndex(i)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            i === activeReviewIndex ? 'w-8 bg-slate-900' : 'w-8 bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleNextReview}
                  className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Icon icon="lucide:chevron-right" className="w-5 h-5 text-slate-700" />
                </button>
              </div>
            ) : (
              <div className="w-full md:w-2/3 flex flex-col items-center justify-center bg-gray-50 rounded-3xl p-8 min-h-[220px] border border-dashed border-gray-200 text-center">
                <Icon icon="lucide:message-square-dashed" className="w-12 h-12 text-gray-300 mb-4" />
                <h4 className="font-bold text-slate-900 text-xl mb-2">Aún no hay reseñas</h4>
                <p className="text-gray-500 max-w-sm">¡Sé el primero en comprar y dejar tu opinión sobre este producto!</p>
              </div>
            )}
          </div>
        </section>

        {/* RELATED PRODUCTS */}
        <section className="mt-24">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8">Productos Relacionados</h2>

          <div className="relative group">
            {/* Side Arrows */}
            <button
              onClick={() => scroll('left')}
              className="absolute -left-4 md:-left-5 top-[40%] -translate-y-1/2 w-12 h-12 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow-lg border border-gray-100 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Icon icon="lucide:chevron-left" className="w-6 h-6 text-slate-700" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute -right-4 md:-right-5 top-[40%] -translate-y-1/2 w-12 h-12 rounded-full bg-white hover:bg-gray-50 flex items-center justify-center shadow-lg border border-gray-100 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Icon icon="lucide:chevron-right" className="w-6 h-6 text-slate-700" />
            </button>

            {/* Scroll Container */}
            <div
              ref={scrollRef}
              className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {relatedProducts.length > 0 ? (
                relatedProducts.map(related => (
                  <div key={related.id} className="min-w-[280px] w-[280px] md:min-w-[300px] md:w-[300px] snap-start shrink-0">
                    <ProductCard 
                      id={related.id}
                      title={related.name}
                      description={related.description || ""}
                      price={`$${Number(related.price).toFixed(2)}`}
                      image={related.imageUrl || "/bolso-de-moriche.webp"} 
                      rating={related.averageRating ? Math.round(Number(related.averageRating)) : 0}
                      category={related.category?.name || "Categoría"}
                      href={`/marketplace/${related.id}`} 
                    />
                  </div>
                ))
              ) : (
                <p className="text-gray-500 py-4">No hay productos relacionados disponibles.</p>
              )}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
