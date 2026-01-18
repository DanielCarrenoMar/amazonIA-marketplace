import { useEffect, useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ProductDetail } from './ProductDetail';
import { AuthModal } from './auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { AddProductoModal } from './forms/productos/AddProductoModal';


export function Marketplace() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<number[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [defaultUserType, setDefaultUserType] = useState<'vendedor' | 'comprador' | undefined>(undefined);
  const [addProductoModalOpen, setAddProductoModalOpen] = useState(false);
  const { user, profile } = useAuth();




  const categories = [
    { id: 'all', label: 'Todos los Productos', icon: '🌐' },
    { id: 'artesanias', label: 'Artesanías', icon: '🧺' },
    { id: 'alimentos', label: 'Alimentos', icon: '🥘' },
    { id: 'pescados', label: 'Pescados', icon: '🐟' },
    { id: 'textiles', label: 'Textiles', icon: '🧵' },
    { id: 'joyeria', label: 'Joyería', icon: '💍' },
  ];

  const priceRanges = [
    { id: 'all', label: 'Todos los precios' },
    { id: '0-20', label: 'Menos de $20' },
    { id: '20-50', label: '$20 - $50' },
    { id: '50-100', label: '$50 - $100' },
    { id: '100+', label: 'Más de $100' },
  ];

  const allBadges = [
    'Hecho a Mano',
    'Comercio Justo',
    'Pesca Sostenible',
    'Orgánico',
    'Materiales Naturales',
    'Tintes Naturales',
    'Madera Certificada',
    'Sin Aditivos',
    'Alta Proteína',
    '100% Natural',
  ];

  
  const products = [
    {
      id: 1,
      name: 'Canasta Tejida a Mano',
      description: 'Hermosa canasta tejida con fibras naturales de la selva por artesanos de la comunidad Tikuna.',
      price: 45.99,
      currency: 'USD',
      category: 'artesanias',
      image: 'https://images.unsplash.com/photo-1760328773324-f9e8082c7cd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kbWFkZSUyMGJhc2tldCUyMHdlYXZpbmd8ZW58MXx8fHwxNzYzNDc3MDEyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      seller: 'Cooperativa Tikuna',
      location: 'Leticia, Amazonas - Colombia',
      stock: 12,
      badges: ['Hecho a Mano', 'Comercio Justo'],
      rating: 4.8,
      reviews: 24,
    },
    {
      id: 2,
      name: 'Pirarucú Seco (1kg)',
      description: 'Filete de pirarucú (arapaima) secado de forma tradicional. Rico en proteínas y sabor único amazónico.',
      price: 32.50,
      currency: 'USD',
      category: 'pescados',
      image: 'https://images.unsplash.com/photo-1572420054337-2cf7054ddd42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcmllZCUyMGZpc2glMjBmb29kfGVufDF8fHx8MTc2MzQ3NzAxMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      seller: 'Pescadores Unidos',
      location: 'Manaus, Amazonas - Brasil',
      stock: 28,
      badges: ['Pesca Sostenible', 'Orgánico'],
      rating: 4.9,
      reviews: 56,
    },
    {
      id: 3,
      name: 'Collar de Semillas Amazónicas',
      description: 'Joyería artesanal elaborada con semillas nativas: huayruro, ojo de buey y tagua. Diseño tradicional Shipibo.',
      price: 28.00,
      currency: 'USD',
      category: 'joyeria',
      image: 'https://images.unsplash.com/photo-1740819920986-8462590eccdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpZ2Vub3VzJTIwamV3ZWxyeSUyMGhhbmRtYWRlfGVufDF8fHx8MTc2MzQ3Njk4N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      seller: 'Artesanas Shipibo-Konibo',
      location: 'Pucallpa, Ucayali - Perú',
      stock: 15,
      badges: ['Hecho a Mano', 'Materiales Naturales'],
      rating: 5.0,
      reviews: 31,
    },
    {
      id: 4,
      name: 'Harina de Pescado Premium',
      description: 'Harina de pescado de alta calidad para consumo humano y animal. Procesada artesanalmente.',
      price: 18.75,
      currency: 'USD',
      category: 'alimentos',
      image: 'https://images.unsplash.com/photo-1750601455084-6099277a6817?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXNoJTIwZmlsbGV0JTIwbWFya2V0fGVufDF8fHx8MTc2MzQ3Njk4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      seller: 'Productos Amazónicos SAC',
      location: 'Iquitos, Loreto - Perú',
      stock: 45,
      badges: ['Orgánico', 'Alta Proteína'],
      rating: 4.6,
      reviews: 19,
    },
    {
      id: 5,
      name: 'Manta Tejida Tradicional',
      description: 'Hermosa manta tejida con técnicas ancestrales, patrones geométricos tradicionales y colores naturales.',
      price: 85.00,
      currency: 'USD',
      category: 'textiles',
      image: 'https://images.unsplash.com/photo-1761416182623-4afd973e3c34?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3ZlbiUyMHRleHRpbGUlMjBjcmFmdHN8ZW58MXx8fHwxNzYzNDc3MDAxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      seller: 'Tejedoras Indígenas',
      location: 'Otavalo, Imbabura - Ecuador',
      stock: 8,
      badges: ['Hecho a Mano', 'Tintes Naturales'],
      rating: 4.9,
      reviews: 14,
    },
    {
      id: 6,
      name: 'Mix de Especias Amazónicas',
      description: 'Mezcla única de especias y hierbas aromáticas de la selva: ají charapita, sacha culantro y más.',
      price: 15.50,
      currency: 'USD',
      category: 'alimentos',
      image: 'https://images.unsplash.com/photo-1738680981649-3f81bdfe225d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGljZXMlMjBtYXJrZXQlMjBjb2xvcmZ1bHxlbnwxfHx8fDE3NjM0NzcwMDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      seller: 'Sabores de la Selva',
      location: 'Puerto Maldonado, Madre de Dios - Perú',
      stock: 67,
      badges: ['Orgánico', '100% Natural'],
      rating: 4.7,
      reviews: 42,
    },
    {
      id: 7,
      name: 'Bowl de Madera Tallada',
      description: 'Tazón artesanal tallado en madera de caoba amazónica con diseños tradicionales.',
      price: 52.00,
      currency: 'USD',
      category: 'artesanias',
      image: 'https://images.unsplash.com/photo-1759523105886-51ae7ebcef20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b29kZW4lMjBoYW5kaWNyYWZ0JTIwYm93bHxlbnwxfHx8fDE3NjM0NzcwMTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      seller: 'Talladores de la Selva',
      location: 'Belén, Amazonas - Brasil',
      stock: 10,
      badges: ['Hecho a Mano', 'Madera Certificada'],
      rating: 4.8,
      reviews: 18,
    },
    {
      id: 8,
      name: 'Frutas Tropicales Deshidratadas',
      description: 'Mix de frutas amazónicas deshidratadas: aguaje, camu camu, copoazú y açaí. Sin azúcar añadida.',
      price: 22.00,
      currency: 'USD',
      category: 'alimentos',
      image: 'https://images.unsplash.com/photo-1684314542773-c6f8e2a90242?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGZydWl0cyUyMG1hcmtldHxlbnwxfHx8fDE3NjM0NzAxMTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      seller: 'Frutos del Amazonas',
      location: 'Yurimaguas, Loreto - Perú',
      stock: 34,
      badges: ['Orgánico', 'Sin Aditivos'],
      rating: 4.6,
      reviews: 27,
    },
  ];

  const toggleBadge = (badge: string) => {
    setSelectedBadges(prev => 
      prev.includes(badge) 
        ? prev.filter(b => b !== badge)
        : [...prev, badge]
    );
  };

  const filteredProducts = products.filter(product => {
    // Category filter
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    // Search filter
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Price filter
    let matchesPrice = true;
    if (selectedPriceRange !== 'all') {
      if (selectedPriceRange === '0-20') {
        matchesPrice = product.price < 20;
      } else if (selectedPriceRange === '20-50') {
        matchesPrice = product.price >= 20 && product.price < 50;
      } else if (selectedPriceRange === '50-100') {
        matchesPrice = product.price >= 50 && product.price < 100;
      } else if (selectedPriceRange === '100+') {
        matchesPrice = product.price >= 100;
      }
    }
    
    // Rating filter
    const matchesRating = selectedRating === 0 || product.rating >= selectedRating;
    
    // Badges filter
    const matchesBadges = selectedBadges.length === 0 || 
                         selectedBadges.every(badge => product.badges.includes(badge));
    
    return matchesCategory && matchesSearch && matchesPrice && matchesRating && matchesBadges;
  });

  const addToCart = (productId: number) => {
    setCart([...cart, productId]);
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedPriceRange('all');
    setSelectedRating(0);
    setSelectedBadges([]);
    setSearchTerm('');
  };

  const currentProduct = selectedProduct ? products.find(p => p.id === selectedProduct) : null;

  const handleRegisterAsSeller = () => {
    if (user) {
      // Si ya está logueado, redirigir a dashboard o perfil
      alert('Ya estás logueado. Aquí podrías redirigir al dashboard del vendedor.');
    } else {
      // Si no está logueado, abrir modal de registro con tipo vendedor
      setAuthMode('register');
      setDefaultUserType('vendedor');
      setAuthModalOpen(true);
    }
  };

  const handleAddProducto = () => {
    // Verificar si el usuario está logueado
    if (!user) {
      // No está logueado, abrir modal de login
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }

    // Verificar si es vendedor
    if (profile?.tipo !== 'vendedor') {
      alert('Solo los vendedores pueden agregar productos. Por favor, regístrate como vendedor.');
      return;
    }

    // Abrir modal para agregar producto
    setAddProductoModalOpen(true);
  };

  const handleMoreInfo = () => {
    // Scroll to a specific section or open info modal
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="marketplace" className="py-20 bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
      {/* Product Detail Modal */}
      {currentProduct && (
        <ProductDetail 
          product={currentProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(id) => {
            addToCart(id);
            setSelectedProduct(null);
          }}
        />
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block bg-teal-600 text-white px-4 py-1 rounded-full mb-4">
            Marketplace Amazónico
          </span>
          <h2 className="text-gray-900 mb-4">
            Productos Auténticos de la Amazonía
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Apoya a comunidades indígenas y productores locales adquiriendo productos artesanales, alimentos y artesanías auténticas
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar productos, artesanías, alimentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-gray-700">{cart.length}</span>
            </div>

            {/* Barra para registrar nuevos productos */}
            { user && (
              <div>
                
                <button 
                  onClick={handleAddProducto}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg">
                    Agregar Producto
                </button>
              </div>
            )}
          </div>
        </div>

        

        {/* Main Content: Sidebar + Products */}
        <div className="flex flex-col lg:flex-row gap-8 mt-12">
          {/* Left Sidebar - Filters */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-gray-900">Filtros</h3>
                <button 
                  onClick={clearFilters}
                  className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Limpiar todo
                </button>
              </div>

              {/* Categories */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-gray-700 mb-3">Categoría</h4>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg transition-all flex items-center gap-3 ${
                        selectedCategory === category.id
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-lg">{category.icon}</span>
                      <span className="text-sm">{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-gray-700 mb-3">Rango de Precio</h4>
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <label
                      key={range.id}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="priceRange"
                        value={range.id}
                        checked={selectedPriceRange === range.id}
                        onChange={(e) => setSelectedPriceRange(e.target.value)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-emerald-600 transition-colors">
                        {range.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-gray-700 mb-3">Calificación Mínima</h4>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setSelectedRating(selectedRating === rating ? 0 : rating)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                        selectedRating === rating
                          ? 'bg-emerald-50 border-2 border-emerald-600'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg 
                            key={i}
                            className={`w-4 h-4 ${i < rating ? 'text-amber-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">y superior</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Badges/Features Filter */}
              <div>
                <h4 className="text-gray-700 mb-3">Características</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {allBadges.map((badge) => (
                    <label
                      key={badge}
                      className="flex items-start gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBadges.includes(badge)}
                        onChange={() => toggleBadge(badge)}
                        className="w-4 h-4 mt-0.5 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-emerald-600 transition-colors">
                        {badge}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Right Content - Products */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                Mostrando <span className="text-gray-900">{filteredProducts.length}</span> productos
              </p>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none text-sm">
                <option>Más Relevantes</option>
                <option>Precio: Menor a Mayor</option>
                <option>Precio: Mayor a Menor</option>
                <option>Mejor Calificados</option>
                <option>Más Recientes</option>
              </select>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                {filteredProducts.map((product) => (
                  <div 
                    key={product.id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden border border-gray-100"
                  >
                    {/* Product Image */}
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <ImageWithFallback
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.badges.slice(0, 2).map((badge, index) => (
                          <span 
                            key={index}
                            className="bg-emerald-600 text-white text-xs px-3 py-1 rounded-full shadow-lg"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                      {/* Stock Badge */}
                      {product.stock < 15 && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full shadow-lg">
                          ¡Solo {product.stock}!
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-5">
                      <h3 className="text-gray-900 mb-2 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-amber-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {product.rating} ({product.reviews})
                        </span>
                      </div>

                      {/* Seller Info */}
                      <div className="bg-emerald-50 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <div className="text-xs">
                            <div className="text-emerald-800">{product.seller}</div>
                            <div className="text-emerald-600 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {product.location}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Price and Action */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div>
                          <div className="text-gray-900">${product.price.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">+ envío</div>
                        </div>
                        <button 
                          onClick={() => setSelectedProduct(product.id)}
                          className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-gray-900 mb-2">No se encontraron productos</h3>
                <p className="text-gray-600 mb-4">
                  Intenta ajustar tus filtros o realiza una nueva búsqueda
                </p>
                <button 
                  onClick={clearFilters}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Sections */}
        <div className="grid md:grid-cols-2 gap-6 mt-12 mb-8">
          {/* Comercio Justo */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-white">Comercio Justo</h3>
            </div>
            <p className="text-emerald-100 mb-4">
              Todos nuestros productos provienen directamente de comunidades indígenas y productores locales amazónicos.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-emerald-50">Precio justo para los productores</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-emerald-50">Preservación de técnicas ancestrales</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-emerald-50">Apoyo a economías locales</span>
              </li>
            </ul>
          </div>

          {/* Envíos y Garantías */}
          <div className="bg-gradient-to-br from-teal-600 to-cyan-600 rounded-2xl p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <h3 className="text-white">Envíos y Garantías</h3>
            </div>
            <p className="text-teal-100 mb-4">
              Entrega segura y garantía de autenticidad en todos nuestros productos amazónicos.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-teal-50">Envío internacional disponible</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-teal-50">Certificado de autenticidad incluido</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-teal-50">30 días de garantía de satisfacción</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h3 className="text-gray-900 mb-3">
            ¿Eres Productor Amazónico?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Únete a nuestra plataforma y vende tus productos directamente a clientes de todo el mundo. 
            Sin intermediarios, con precios justos y apoyo técnico.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={handleRegisterAsSeller}
              className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg"
            >
              Registrarme como Vendedor
            </button>
            <button 
              onClick={handleMoreInfo}
              className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Más Información
            </button>
          </div>
        </div>
        
        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authMode}
          defaultUserType={defaultUserType}
        />

        {/* Add Producto Modal */}
        <AddProductoModal
          isOpen={addProductoModalOpen}
          onClose={() => setAddProductoModalOpen(false)}
        />
      </div>
    </section>
  );
}