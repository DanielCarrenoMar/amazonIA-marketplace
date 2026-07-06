"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductCard } from '@/components/ui/ProductCard';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Icon } from "@iconify/react";
import { MarketplaceNavbar } from '@/components/layout/MarketplaceNavbar';
import { BannerCarousel } from '@/components/ui/BannerCarousel';
import { Footer } from '@/components/layout/Footer';

import { getProducts, getCategories } from '@/lib/api';
import type { ProductResponseDto, ProductCategoryResponseDto } from 'event-types';

export default function MarketplacePage() {
  return (
    <React.Suspense fallback={<div className="flex justify-center p-20">Cargando marketplace...</div>}>
      <MarketplaceContent />
    </React.Suspense>
  );
}

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const categoryParam = searchParams.get('category');
  const [activeCategory, setActiveCategory] = useState<string | null>(categoryParam || null);

  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [categories, setCategories] = useState<ProductCategoryResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync state with URL
  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  // Fetch categories on mount
  useEffect(() => {
    getCategories()
      .then(res => setCategories(res.data || []))
      .catch(console.error);
  }, []);

  // Fetch products when activeCategory or categories change
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        let categoryId: number | undefined;
        if (activeCategory && categories.length > 0) {
          const found = categories.find(c => c.categoryName === activeCategory);
          if (found) categoryId = found.id;
        }

        const params: any = {};
        if (categoryId) params.categoryId = categoryId;

        const res = await getProducts(params);
        setProducts(res.data || []);
      } catch (err) {
        console.error("Error loading products", err);
      } finally {
        setLoading(false);
      }
    }
    
    // Load if no active category, or if we have categories loaded to map the name to ID
    if (!activeCategory || categories.length > 0) {
      loadProducts();
    }
  }, [activeCategory, categories]);

  const handleCategoryClick = (cat: string) => {
    if (activeCategory === cat) {
      setActiveCategory(null);
      router.push("/marketplace", { scroll: false });
    } else {
      setActiveCategory(cat);
      router.push(`/marketplace?category=${encodeURIComponent(cat)}`, { scroll: false });
    }
  };

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

  // Dynamic categories list (mapped categories only)
  const categoryNames = Array.from(new Set(categories.map(c => c.categoryName)));

  return (
    <>
      <MarketplaceNavbar />
      <main className="min-h-screen bg-background pt-28 md:pt-32 pb-12 px-4 md:px-8 max-w-[1400px] mx-auto font-sans">
        
        {/* HERO BANNER CAROUSEL */}
        <BannerCarousel banners={heroBanners} />

        {/* CATEGORIES PILLS */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {categoryNames.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-5 py-2 rounded-full font-medium whitespace-nowrap transition-colors border shadow-sm cursor-pointer ${
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
                <button className="text-xs text-muted hover:text-brand-primary transition-colors cursor-pointer">Limpiar</button>
              </div>
              <p className="text-xs text-muted mb-4 font-medium">El precio promedio es $30.00</p>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Min" 
                  type="number" 
                  leftIcon={<span className="text-gray-400 font-medium font-sans">$</span>}
                  wrapperClassName="h-10 rounded-2xl bg-gray-50/50 border-gray-200" 
                  className="text-sm" 
                />
                <span className="text-gray-300 font-medium">-</span>
                <Input 
                  placeholder="Max" 
                  type="number" 
                  leftIcon={<span className="text-gray-400 font-medium font-sans">$</span>}
                  wrapperClassName="h-10 rounded-2xl bg-gray-50/50 border-gray-200" 
                  className="text-sm" 
                />
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



          </aside>

          {/* PRODUCT GRID */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Icon icon="lucide:loader-2" className="w-8 h-8 animate-spin text-brand-primary" />
                <span className="ml-2 text-muted">Cargando productos...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.length > 0 ? (
                  products.map((product) => {
                    const mappedCategory = product.category?.categoryName 
                      || categories.find(c => c.id === product.categoryId)?.categoryName 
                      || "Categoría";
                    
                    return (
                      <ProductCard
                        key={product.id}
                        id={product.id}
                        title={product.name}
                        description={product.description || ""}
                        price={`$${Number(product.price).toFixed(2)}`}
                        image={product.imageUrl || "/bolso-de-moriche.webp"} // Default placeholder
                        rating={product.averageRating ? Math.round(Number(product.averageRating)) : 0}
                        category={mappedCategory}
                        href={`/marketplace/${product.id}`}
                      />
                    );
                  })
                ) : (
                  <div className="col-span-full py-12 text-center text-gray-500">
                    <p>No se encontraron productos {activeCategory ? `en la categoría "${activeCategory}"` : "disponibles"}.</p>
                    {activeCategory && (
                      <Button variant="outline" className="mt-4" onClick={() => handleCategoryClick(activeCategory)}>Limpiar filtro</Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </main>
      <Footer />
    </>
  );
}
