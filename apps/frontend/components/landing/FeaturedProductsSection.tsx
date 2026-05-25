import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProductCard } from './ProductCard';

const MOCK_PRODUCTS = [
  {
    id: "1",
    image: "/cesta-wayuu.jpg",
    discount: "-50%",
    title: "Cesta Wayuu",
    rating: 4,
    category: "Artesanía",
    description: "Tejida a mano por mujeres artesanas. Ideal para decoración o almacenamiento con un toque natural.",
    price: "$24.99",
    originalPrice: "$49.98"
  },
  {
    id: "2",
    image: "/collar-de-semillas.jpg",
    title: "Collar de Semillas",
    rating: 5,
    category: "Joyería",
    description: "Elaborado con semillas de la selva amazónica recolectadas de forma sostenible. Un diseño único y ancestral.",
    price: "$15.00"
  },
  {
    id: "3",
    image: "/ceramica-pemón.jpg",
    discount: "-15%",
    title: "Cerámica Pemón",
    rating: 5,
    category: "Cerámica",
    description: "Pieza decorativa de arcilla tallada con patrones tradicionales que cuentan historias de la comunidad.",
    price: "$45.50",
    originalPrice: "$53.50"
  },
  {
    id: "4",
    image: "/bolso-de-moriche.webp",
    title: "Bolso de Moriche",
    rating: 4,
    category: "Moda",
    description: "Bolso resistente tejido con fibra de palma de moriche. Perfecto para el día a día.",
    price: "$32.00"
  }
];

export function FeaturedProductsSection() {
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

        <Button
          variant="primary"
          rightIcon={<ArrowRight className="w-5 h-5" />}
        >
          Ver Catálogo Completo
        </Button>
      </div>
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_PRODUCTS.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  );
}