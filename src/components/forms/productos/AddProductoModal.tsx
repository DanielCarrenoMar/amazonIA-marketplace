import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { ImageUpload } from './ImageUpload';


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

    if (!formData.imagen_url) {
      setError('Por favor sube una imagen del producto');
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


      if (data) {
        console.log('Producto agregado con éxito:', data);


        //registramos ahora la relación produdcto vendedor
        const { error: relError } = await supabase
          .from('vendedores-producto')
          .insert({
            "id-producto": data.id,
            "id-vendedor": user.id,
          });


        if (relError) {
          console.log("Error al relacionar el producto  ", relError);
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
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl w-[500px] max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 flex items-center justify-between border-b border-gray-200">
          <h2 className="text-lg font-bold text-white">Agregar Producto</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Nombre del Producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ej: Canasta Tejida a Mano"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción *
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder="Describe tu producto detalladamente..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                required
              />
            </div>

            {/* Cuidados del Producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cuidados del Producto
              </label>
              <textarea
                name="cuidados"
                value={formData.cuidados}
                onChange={handleInputChange}
                placeholder="Ej: Lavar a mano con agua fría..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
              />
            </div>

            {/* Peso y Dimensiones - Misma línea */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso
                </label>
                <input
                  type="text"
                  name="peso"
                  value={formData.peso}
                  onChange={handleInputChange}
                  placeholder="250g"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dimensiones
                </label>
                <input
                  type="text"
                  name="dimensiones"
                  value={formData.dimensiones}
                  onChange={handleInputChange}
                  placeholder="30x20x15 cm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Precio, Stock y Categoría - Misma línea */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio *
                </label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleInputChange}
                  placeholder="45.99"
                  step="0.01"
                  min="0"
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="10"
                  min="0"
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Imagen del Producto */}
            <ImageUpload 
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, imagen_url: url }))}
              currentImageUrl={formData.imagen_url}
              className="mb-2"
            />

            {/* Características del Producto - 3 columnas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Características del Producto
              </label>
              <div className="grid grid-cols-3 gap-1 border border-gray-200 rounded-lg p-2">
                {/* Primera columna - 4 opciones */}
                <div className="space-y-1">
                  {allBadges.slice(0, 4).map(badge => (
                    <label key={badge} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.badges.includes(badge)}
                        onChange={() => handleBadgeToggle(badge)}
                        className="w-3 h-3 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-gray-700">{badge}</span>
                    </label>
                  ))}
                </div>

                {/* Segunda columna - 4 opciones */}
                <div className="space-y-1">
                  {allBadges.slice(4, 8).map(badge => (
                    <label key={badge} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.badges.includes(badge)}
                        onChange={() => handleBadgeToggle(badge)}
                        className="w-3 h-3 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-gray-700">{badge}</span>
                    </label>
                  ))}
                </div>

                {/* Tercera columna - 2 opciones */}
                <div className="space-y-1">
                  {allBadges.slice(8, 10).map(badge => (
                    <label key={badge} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.badges.includes(badge)}
                        onChange={() => handleBadgeToggle(badge)}
                        className="w-3 h-3 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-gray-700">{badge}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer with Buttons - Misma línea */}
        <div className="flex-shrink-0 border-t border-gray-200 p-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
