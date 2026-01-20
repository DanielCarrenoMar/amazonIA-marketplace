import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { ImageUpload } from './ImageUpload';
import { useQueryClient } from '@tanstack/react-query';


interface AddProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: () => void;
}

export function AddProductoModal({ isOpen, onClose, onProductAdded }: AddProductoModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
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
          badges: caracteristicasJson,
          category: productoData.categoria,
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

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['productos'] });

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      {/* Modal Content */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
        style={{ width: '1100px', maxWidth: '95vw', height: '85vh' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6 flex items-center justify-between border-b border-gray-200">
          <h2 className="text-3xl font-bold text-white">Agregar Producto</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-xl p-2 transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content - Scrollable Single Column */}
        <div className="flex-1 overflow-y-auto min-h-0 p-10 lg:p-14 scroll-smooth">
          {error && (
            <div className="mb-12 bg-red-50 border border-red-200 text-red-700 px-8 py-5 rounded-2xl text-base shadow-sm font-medium">
              {error}
            </div>
          )}

          <div className="max-w-4xl mx-auto space-y-24">
            {/* Sección 1: Información Básica */}
            <section className="space-y-10 pt-4">
              <h3 className="text-3xl font-extrabold text-gray-900 border-b-2 border-emerald-50 pb-6 flex items-center gap-4">
                <span className="w-3 h-10 bg-emerald-500 rounded-full shadow-sm"></span>
                Información del Producto
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Canasta Tejida a Mano"
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    placeholder="Describe tu producto detalladamente..."
                    rows={5}
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-base appearance-none bg-white"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1.5rem center',
                      backgroundSize: '1.2em'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Sección 2: Multimedia */}
            <section className="space-y-10 pt-4">
              <h3 className="text-3xl font-extrabold text-gray-900 border-b-2 border-emerald-50 pb-6 flex items-center gap-4">
                <span className="w-3 h-10 bg-emerald-500 rounded-full shadow-sm"></span>
                Imagen de Presentación
              </h3>
              <div>
                <ImageUpload
                  onImageUploaded={(url) => setFormData(prev => ({ ...prev, imagen_url: url }))}
                  currentImageUrl={formData.imagen_url}
                  className="w-full"
                />
              </div>
            </section>

            {/* Sección 3: Precio y Disponibilidad */}
            <section className="space-y-10 pt-4">
              <h3 className="text-3xl font-extrabold text-gray-900 border-b-2 border-emerald-50 pb-6 flex items-center gap-4">
                <span className="w-3 h-10 bg-emerald-500 rounded-full shadow-sm"></span>
                Precio y Stock
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Precio ($) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                    <input
                      type="number"
                      name="precio"
                      value={formData.precio}
                      onChange={handleInputChange}
                      placeholder="15.99"
                      step="0.01"
                      min="0"
                      className="w-full px-8 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-lg font-bold"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unidades Disponibles *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="10"
                    min="0"
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-base"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Sección 4: Detalles Técnicos */}
            <section className="space-y-10 pt-4">
              <h3 className="text-3xl font-extrabold text-gray-900 border-b-2 border-emerald-50 pb-6 flex items-center gap-4">
                <span className="w-3 h-10 bg-emerald-500 rounded-full shadow-sm"></span>
                Detalles Técnicos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Peso
                  </label>
                  <input
                    type="text"
                    name="peso"
                    value={formData.peso}
                    onChange={handleInputChange}
                    placeholder="Ej: 250g"
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dimensiones
                  </label>
                  <input
                    type="text"
                    name="dimensiones"
                    value={formData.dimensiones}
                    onChange={handleInputChange}
                    placeholder="Ej: 30x20x15 cm"
                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-base"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cuidados y Recomendaciones
                </label>
                <textarea
                  name="cuidados"
                  value={formData.cuidados}
                  onChange={handleInputChange}
                  placeholder="Ej: Lavar a mano con agua fría..."
                  rows={3}
                  className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none text-base"
                />
              </div>
            </section>

            {/* Sección 5: Características */}
            <section className="space-y-10 pt-4 pb-6">
              <h3 className="text-3xl font-extrabold text-gray-900 border-b-2 border-emerald-50 pb-6 flex items-center gap-4">
                <span className="w-3 h-10 bg-emerald-500 rounded-full shadow-sm"></span>
                Atributos Especiales
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50/50 rounded-2xl p-8 border border-gray-100">
                {allBadges.map(badge => (
                  <label key={badge} className="flex items-center gap-4 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.badges.includes(badge)}
                        onChange={() => handleBadgeToggle(badge)}
                        className="w-6 h-6 rounded-lg border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 transition-all cursor-pointer shadow-sm"
                      />
                    </div>
                    <span className="text-base text-gray-600 group-hover:text-gray-900 transition-colors">{badge}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Fixed Footer with Buttons */}
        <div className="flex-shrink-0 border-t border-gray-200 p-6 bg-gray-50/50">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm shadow-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : 'Publicar Producto'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
