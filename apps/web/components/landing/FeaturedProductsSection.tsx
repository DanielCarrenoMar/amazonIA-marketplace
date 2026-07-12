"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from "@iconify/react";
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProductCard } from '../ui/ProductCard';
import { getProducts } from '@/lib/api';
import type { ProductResponseDto } from 'event-types';

export function FeaturedProductsSection() {
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts({ limit: 4 })
      .then((res: any) => setProducts(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="productos" className="w-full bg-brand-nature-bg py-24 px-6 md:px-12 flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex flex-col gap-4 items-start max-w-2xl text-left">
          <Badge variant="secondary" className="uppercase tracking-wide">
            Marketplace Artesanal
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-brand-nature-content leading-[1.15]">
            Productos Destacados
          </h2>
          <p className="text-muted text-base md:text-lg leading-relaxed font-medium">
            Descubre piezas únicas elaboradas con técnicas ancestrales directamente de las comunidades amazónicas.
          </p>
        </div>

        <Link href="/marketplace">
          <Button
            variant="primary"
            rightIcon={<Icon icon="lucide:arrow-right" className="w-5 h-5" />}
          >
            Ver Catálogo Completo
          </Button>
        </Link>
      </div>
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <p className="text-gray-500 col-span-full text-center py-8">Cargando productos...</p>
        ) : products.length > 0 ? (
          products.slice(0, 4).map((product) => (
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
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center py-8">No hay productos destacados disponibles.</p>
        )}
      </div>
    </section>
  );
}