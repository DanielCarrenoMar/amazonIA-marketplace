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
