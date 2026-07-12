export const mockCategories = ["Todas", "Ofertas", "Artesanía", "Moda", "Hogar", "Joyería", "Cestería", "Cerámica"];

export const mockBrands = ["Comunidad Wayuu", "Comunidad Pemón", "Artesanos de los Andes", "Emprendedores Locales", "Hecho a Mano"];

export interface Product {
  id: string;
  image: string;
  discount?: string;
  title: string;
  rating: number;
  category: string;
  description: string;
  price: string;
  originalPrice?: string;
}

export const mockProducts: Product[] = [
  {
    id: '1',
    image: '/cesta-wayuu.jpg',
    discount: '50%',
    title: 'Cesta Wayuu',
    rating: 4,
    category: 'Cestería',
    description: 'Hermosa cesta tejida a mano con patrones tradicionales.',
    price: '$25.00',
    originalPrice: '$50.00'
  },
  {
    id: '2',
    image: '/bolso-de-moriche.webp',
    discount: 'Nuevo',
    title: 'Bolso de Moriche',
    rating: 5,
    category: 'Moda',
    description: 'Bolso ecológico fabricado con fibra de palma de moriche.',
    price: '$35.00'
  },
  {
    id: '3',
    image: '/ceramica-pemón.jpg',
    title: 'Cerámica Pemón',
    rating: 4,
    category: 'Cerámica',
    description: 'Pieza de cerámica artesanal con diseños de la cultura Pemón.',
    price: '$40.00'
  },
  {
    id: '4',
    image: '/collar-de-semillas.jpg',
    title: 'Collar de Semillas',
    rating: 3,
    category: 'Joyería',
    description: 'Collar elaborado con semillas autóctonas de la selva amazónica.',
    price: '$15.00'
  },
  {
    id: '5',
    image: '/cesta-wayuu.jpg',
    title: 'Mini Cesta Wayuu',
    rating: 5,
    category: 'Cestería',
    description: 'Hermosa cesta tejida a mano con patrones tradicionales.',
    price: '$20.00',
    discount: 'Nuevo'
  },
  {
    id: '6',
    image: '/ceramica-pemón.jpg',
    title: 'Vasija Decorativa',
    rating: 4,
    category: 'Cerámica',
    description: 'Vasija decorativa con diseños únicos pintados a mano.',
    price: '$25.00'
  }
];

import type { ProductResponseDto } from 'event-types';

export const mockProductDtos: ProductResponseDto[] = [
  {
    id: 'mock-1',
    name: 'Cesta Indígena Wayuu',
    description: 'Hermosa cesta tejida a mano con patrones tradicionales que reflejan la cosmovisión de la comunidad.',
    price: 35.50 as any,
    imageUrl: '/cesta-wayuu.jpg',
    categoryId: 1,
    sellerId: 'seller-1',
    stockAvailable: 10,
    averageRating: 4.8 as any,
    totalReviews: 12,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    locationCity: 'Maracaibo',
    locationRegion: 'Zulia',
    category: { id: 1, categoryName: 'Artesanía' } as any,
    seller: { user: { fullName: 'Comunidad Wayuu' }, bio: 'Tejedoras tradicionales de la Guajira, llevando nuestro arte al mundo.' } as any
  },
  {
    id: 'mock-2',
    name: 'Bolso de Moriche',
    description: 'Bolso ecológico hecho de fibra de palma de moriche, uniendo sustentabilidad y diseño moderno para el uso diario.',
    price: 45.00 as any,
    imageUrl: '/bolso-de-moriche.webp',
    categoryId: 2,
    sellerId: 'seller-2',
    stockAvailable: 5,
    averageRating: 5.0 as any,
    totalReviews: 8,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    locationCity: 'Puerto Ayacucho',
    locationRegion: 'Amazonas',
    category: { id: 2, categoryName: 'Moda' } as any,
    seller: { user: { fullName: 'Artesanías del Amazonas' }, bio: 'Cuidando el pulmón vegetal con nuestro arte, usamos recolección sostenible.' } as any
  },
  {
    id: 'mock-3',
    name: 'Cerámica Pemón',
    description: 'Vasija de arcilla curada al fuego con diseños ancestrales auténticos. Perfecta para decoración de interiores.',
    price: 25.00 as any,
    imageUrl: '/ceramica-pemón.jpg',
    categoryId: 1,
    sellerId: 'seller-3',
    stockAvailable: 2,
    averageRating: 4.5 as any,
    totalReviews: 24,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    locationCity: 'Santa Elena de Uairén',
    locationRegion: 'Bolívar',
    category: { id: 1, categoryName: 'Hogar' } as any,
    seller: { user: { fullName: 'Familias Pemón' }, bio: 'Nuestras manos moldean la tierra roja, preservando los mitos de nuestros ancestros.' } as any
  }
] as unknown as ProductResponseDto[];
