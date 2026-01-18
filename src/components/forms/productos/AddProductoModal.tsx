import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase'


interface AddProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: () => void;
}

export function AddProductoModal({ isOpen, onClose, onProductAdded }: AddProductoModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    cuidados: '',
    peso: '',
    dimensiones: '',
    precio: '',
    categoria: 'artesanias',
    stock: '',
    imagen_url: '',
    badges: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { id: 'artesanias', label: 'Artesanías' },
    { id: 'alimentos', label: 'Alimentos' },
    { id: 'pescados', label: 'Pescados' },
    { id: 'textiles', label: 'Textiles' },
    { id: 'joyeria', label: 'Joyería' },
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBadgeToggle = (badge: string) => {
    setFormData(prev => ({
      ...prev,
      badges: prev.badges.includes(badge)
        ? prev.badges.filter(b => b !== badge)
        : [...prev.badges, badge]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Debes estar logueado para agregar productos');
      return;
    }

    if (!formData.nombre || !formData.descripcion || !formData.precio || !formData.stock) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Aquí irá la lógica para guardar el producto en Supabase
      const productoData = {
        ...formData,
        vendedor_id: user.id,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock)
      };
      
      console.log('========== PRODUCTO A AGREGAR ==========');
      console.log('Datos del formulario:', formData);
      console.log('Usuario ID:', user.id);
      console.log('Objeto final:', productoData);
      console.log('======================================');

      console.log("Empezé a registrar")
      
      // Convertir las características a JSON string
      const caracteristicasJson = JSON.stringify(formData.badges);
      
      //primero registramos el producto 
      const { data, error: insertError } = await supabase
        .from('productos')
        .insert({
          nombre: productoData.nombre,
          descripcion: productoData.descripcion,
          cuidados: productoData.cuidados, 
          puntuacion: 1, 
          "Descrip-dimensiones": productoData.dimensiones,
          "Descrip-peso": productoData.peso,
          cantidad: productoData.stock,
          precio: productoData.precio,
          img: productoData.imagen_url,
          caracteristicas: caracteristicasJson,
        })
        .select()
        .single();

      console.log("Terminé de registrar producto")
      console.log("Características enviadas:", caracteristicasJson)
      console.log("URL de imagen enviada:", productoData.imagen_url)
      
      
      if (insertError) {
        console.error('Error al insertar producto:', insertError);
        throw insertError;
      }
      
      
      if(data){
        console.log('Producto agregado con éxito:', data);


        //registramos ahora la relación produdcto vendedor
        const { error: relError} = await supabase
          .from('vendedores-producto')
          .insert({
            "id-producto": data.id,
            "id-vendedor": user.id,
          });


          if(relError){
            console.log("Error al relacionar el producto  ",relError); 
          } else {
            console.log("Se ha relacionado el producto correctamente"); 
          }
      }
      alert('Producto agregado exitosamente (Demo)');
      
      // Reset form
      setFormData({
        nombre: '',
        descripcion: '',
        cuidados: '',
        peso: '',
        dimensiones: '',
        precio: '',
        categoria: 'artesanias',
        stock: '',
        imagen_url: '',
        badges: [],
      });

      onProductAdded?.();
      onClose();
    } catch (err) {
      setError('Error al agregar el producto. Intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      {/* Modal Content */}
      <div className="bg-white rounded-2xl shadow-2xl w-[500px] h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between border-b border-gray-200">
          <h2 className="text-2xl font-bold text-white">Agregar Nuevo Producto</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Producto *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ej: Canasta Tejida a Mano"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder="Describe tu producto detalladamente..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Cuidados del Producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuidados del Producto
              </label>
              <textarea
                name="cuidados"
                value={formData.cuidados}
                onChange={handleInputChange}
                placeholder="Ej: Lavar a mano con agua fría, secar a la sombra..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Peso y Dimensiones */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso
                </label>
                <input
                  type="text"
                  name="peso"
                  value={formData.peso}
                  onChange={handleInputChange}
                  placeholder="Ej: 250g, 1.5kg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dimensiones
                </label>
                <input
                  type="text"
                  name="dimensiones"
                  value={formData.dimensiones}
                  onChange={handleInputChange}
                  placeholder="Ej: 30x20x15 cm"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Grid: Precio, Stock, Categoría */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio (USD) *
                </label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleInputChange}
                  placeholder="45.99"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="10"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* URL de Imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de la Imagen
              </label>
              <input
                type="url"
                name="imagen_url"
                value={formData.imagen_url}
                onChange={handleInputChange}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Badges */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Características del Producto
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {allBadges.map(badge => (
                  <label key={badge} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.badges.includes(badge)}
                      onChange={() => handleBadgeToggle(badge)}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">{badge}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer with Buttons */}
        <div className="flex-shrink-0 border-t border-gray-200 p-6">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Agregando...' : 'Agregar Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
