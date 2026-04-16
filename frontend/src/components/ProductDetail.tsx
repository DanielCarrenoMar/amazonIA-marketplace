import { ImageWithFallback } from './figma/ImageWithFallback';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  image: string;
  seller: string;
  location: string;
  stock: number;
  badges: string[];
  rating: number;
  reviews: number;
}

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (productId: number) => void;
}

export function ProductDetail({ product, onClose, onAddToCart }: ProductDetailProps) {
  // Información detallada del producto según su categoría
  const getProductDetails = () => {
    switch (product.category) {
      case 'artesanias':
        return {
          materials: ['Fibras naturales amazónicas', 'Tintes vegetales', 'Técnica tradicional de tejido'],
          dimensions: '35cm x 25cm x 20cm',
          weight: '450g',
          careInstructions: 'Limpiar con paño húmedo. No exponer al sol directo por períodos prolongados.',
          story: 'Cada pieza es única, tejida a mano por artesanas de la comunidad siguiendo técnicas ancestrales transmitidas de generación en generación.',
        };
      case 'pescados':
        return {
          materials: ['100% Pirarucú (Arapaima gigas)', 'Procesado artesanalmente', 'Sin conservantes'],
          dimensions: 'Paquete de 1kg',
          weight: '1000g',
          careInstructions: 'Almacenar en lugar fresco y seco. Una vez abierto, refrigerar y consumir en 5 días.',
          story: 'Pescado de manera sostenible por cooperativas de pescadores locales que siguen prácticas de pesca responsable para preservar las poblaciones.',
        };
      case 'joyeria':
        return {
          materials: ['Semillas de Huayruro', 'Semillas de Ojo de Buey', 'Tagua', 'Hilo encerado'],
          dimensions: 'Largo: 45cm (ajustable)',
          weight: '25g',
          careInstructions: 'Evitar el contacto con agua y perfumes. Guardar en lugar seco.',
          story: 'Diseñada por artesanas Shipibo-Konibo, cada collar incorpora símbolos tradicionales que representan la conexión con la naturaleza.',
        };
      case 'alimentos':
        return {
          materials: ['Ingredientes 100% naturales', 'Sin aditivos artificiales', 'Procesado artesanalmente'],
          dimensions: 'Envase de 500g',
          weight: '500g',
          careInstructions: 'Almacenar en lugar fresco y seco. Mantener bien cerrado después de abrir.',
          story: 'Elaborado por productores locales usando métodos tradicionales que preservan el sabor auténtico y las propiedades nutricionales.',
        };
      case 'textiles':
        return {
          materials: ['Lana de alpaca', 'Algodón orgánico', 'Tintes naturales de plantas amazónicas'],
          dimensions: '150cm x 120cm',
          weight: '800g',
          careInstructions: 'Lavar a mano con agua fría. No usar blanqueadores. Secar a la sombra.',
          story: 'Tejida en telar tradicional por maestras tejedoras, con patrones geométricos que cuentan historias de la cosmovisión indígena.',
        };
      default:
        return {
          materials: ['Materiales naturales amazónicos'],
          dimensions: 'Varía según el producto',
          weight: 'Consultar',
          careInstructions: 'Seguir las instrucciones en el empaque.',
          story: 'Producto elaborado por comunidades amazónicas con prácticas sostenibles.',
        };
    }
  };

  const details = getProductDetails();

  // Reviews simulados
  const productReviews = [
    {
      id: 1,
      author: 'María González',
      rating: 5,
      date: '15 Nov 2024',
      comment: '¡Excelente calidad! El producto llegó en perfectas condiciones y es exactamente como se describe. Se nota el trabajo artesanal.',
      verified: true,
    },
    {
      id: 2,
      author: 'Carlos Mendoza',
      rating: 5,
      date: '10 Nov 2024',
      comment: 'Muy contento con mi compra. Es auténtico y la historia detrás del producto hace que valga aún más la pena.',
      verified: true,
    },
    {
      id: 3,
      author: 'Ana Silva',
      rating: 4,
      date: '5 Nov 2024',
      comment: 'Hermoso producto. El envío tardó un poco más de lo esperado pero valió la pena la espera.',
      verified: true,
    },
  ];

  // Información sobre el impacto social
  const socialImpact = {
    artisans: product.category === 'artesanias' || product.category === 'textiles' || product.category === 'joyeria' ? 15 : 8,
    families: product.category === 'artesanias' || product.category === 'textiles' || product.category === 'joyeria' ? 45 : 25,
    community: product.seller,
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl">
          {/* Header con botón de cerrar */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <h2 className="text-gray-900">Detalles del Producto</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-8">
            {/* Main Product Info */}
            <div className="grid lg:grid-cols-2 gap-12 mb-12">
              {/* Left: Images */}
              <div>
                <div className="bg-gray-100 rounded-2xl overflow-hidden mb-4 aspect-square">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.badges.map((badge, index) => (
                    <span
                      key={index}
                      className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-full"
                    >
                      {badge}
                    </span>
                  ))}
                </div>

                {/* Trust indicators */}
                <div className="bg-emerald-50 rounded-xl p-6">
                  <h4 className="text-emerald-900 mb-4">Garantías</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-emerald-800">Producto 100% auténtico</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-emerald-800">30 días de garantía</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-emerald-800">Envío asegurado</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-emerald-800">Certificado de autenticidad</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right: Product Info */}
              <div>
                <h1 className="text-gray-900 mb-4">{product.name}</h1>
                
                {/* Rating */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-amber-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-600">
                    {product.rating} ({product.reviews} reseñas)
                  </span>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="text-gray-900 mb-2">${product.price.toFixed(2)} {product.currency}</div>
                  <p className="text-sm text-gray-500">+ costos de envío (calculados al finalizar)</p>
                  {product.stock < 15 && (
                    <div className="mt-2 inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                      ¡Solo quedan {product.stock} unidades!
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-gray-900 mb-3">Descripción</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">{product.description}</p>
                  <p className="text-gray-600 leading-relaxed">{details.story}</p>
                </div>

                {/* Specifications */}
                <div className="mb-8 bg-gray-50 rounded-xl p-6">
                  <h3 className="text-gray-900 mb-4">Especificaciones</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Dimensiones:</dt>
                      <dd className="text-gray-900">{details.dimensions}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Peso:</dt>
                      <dd className="text-gray-900">{details.weight}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Stock disponible:</dt>
                      <dd className="text-gray-900">{product.stock} unidades</dd>
                    </div>
                  </dl>
                </div>

                {/* Materials */}
                <div className="mb-8">
                  <h3 className="text-gray-900 mb-3">Materiales</h3>
                  <ul className="space-y-2">
                    {details.materials.map((material, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600">{material}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Care Instructions */}
                <div className="mb-8">
                  <h3 className="text-gray-900 mb-3">Cuidados</h3>
                  <p className="text-gray-600">{details.careInstructions}</p>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => onAddToCart(product.id)}
                  className="w-full bg-emerald-600 text-white px-8 py-4 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-3 shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Agregar al Carrito</span>
                </button>
              </div>
            </div>

            {/* Seller Information */}
            <div className="mb-12 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-2">{product.seller}</h3>
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{product.location}</span>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-gray-900 mb-1">{socialImpact.artisans}</div>
                      <div className="text-sm text-gray-600">Artesanos involucrados</div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-gray-900 mb-1">{socialImpact.families}</div>
                      <div className="text-sm text-gray-600">Familias beneficiadas</div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-gray-900 mb-1">4.8★</div>
                      <div className="text-sm text-gray-600">Calificación vendedor</div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {product.seller} es una cooperativa de productores locales comprometida con prácticas de comercio justo 
                    y la preservación de técnicas tradicionales amazónicas. Cada compra apoya directamente a las comunidades indígenas.
                  </p>
                  <button className="text-emerald-600 hover:text-emerald-700 flex items-center gap-2">
                    Ver más productos de este vendedor
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Social Impact */}
            <div className="mb-12 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-2xl p-8 text-white">
              <h3 className="text-white mb-4">Impacto Social y Ambiental</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="mb-1">Comercio Justo</div>
                    <p className="text-emerald-100 text-sm">Precio justo directo a productores sin intermediarios</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="mb-1">Sostenibilidad</div>
                    <p className="text-emerald-100 text-sm">Prácticas ecológicas que protegen la Amazonía</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <div className="mb-1">Cultura Viva</div>
                    <p className="text-emerald-100 text-sm">Preservación de técnicas ancestrales</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-gray-900">Reseñas de Clientes</h3>
                <button className="text-emerald-600 hover:text-emerald-700 text-sm">
                  Escribir una reseña
                </button>
              </div>

              {/* Reviews Summary */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-gray-900 mb-2">{product.rating}</div>
                      <div className="flex items-center justify-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-amber-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                      <div className="text-sm text-gray-600">{product.reviews} reseñas</div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <div key={stars} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-12">{stars} ★</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-amber-400 h-2 rounded-full"
                              style={{ width: `${stars === 5 ? 75 : stars === 4 ? 20 : 5}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-8">
                            {stars === 5 ? '75%' : stars === 4 ? '20%' : '5%'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Lo más mencionado:</div>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">Excelente calidad</span>
                        <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">Auténtico</span>
                        <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">Buen empaque</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Reviews */}
              <div className="space-y-6">
                {productReviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-gray-900">{review.author}</span>
                          {review.verified && (
                            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Compra verificada
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-amber-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-gray-900 mb-6">Información de Envío</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-gray-900 mb-1">Empaque Especial</div>
                    <p className="text-sm text-gray-600">Empaque ecológico que protege el producto y el medio ambiente</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-gray-900 mb-1">Envío Internacional</div>
                    <p className="text-sm text-gray-600">Tiempo estimado: 5-15 días hábiles según destino</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-gray-900 mb-1">Seguimiento</div>
                    <p className="text-sm text-gray-600">Número de rastreo incluido para seguir tu envío</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
