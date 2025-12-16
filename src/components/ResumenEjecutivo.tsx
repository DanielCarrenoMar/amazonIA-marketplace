import { ImageWithFallback } from './figma/ImageWithFallback';

export function ResumenEjecutivo() {
  return (
    <section id="resumen" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block bg-emerald-100 text-emerald-800 px-4 py-1 rounded-full mb-4">
            Resumen Ejecutivo
          </span>
          <h2 className="text-gray-900 mb-4">
            Una Solución NoSQL para la Amazonía
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Un repositorio de datos unificado, flexible y escalable para la biodiversidad más compleja del mundo
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <ImageWithFallback 
              src="https://images.unsplash.com/photo-1617049037028-d4746ed5e6bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwdmlzdWFsaXphdGlvbiUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzYyODMyMzA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
              alt="Data Visualization"
              className="rounded-2xl shadow-2xl"
            />
          </div>

          <div className="space-y-6">
            <p className="text-gray-700">
              El proyecto <strong>Arapaima</strong> propone el diseño e implementación de un sistema de 
              información centralizado, construido sobre una arquitectura de base de datos <strong>NoSQL</strong> (No Relacional).
            </p>

            <p className="text-gray-700">
              El objetivo principal es crear un repositorio de datos unificado, flexible y escalable para 
              clasificar, catalogar y consultar información sobre la <strong>flora</strong>, la <strong>fauna</strong> y 
              las <strong>poblaciones humanas</strong> (comunidades, demografía y, en un sentido agregado, "individuos") 
              de la cuenca amazónica.
            </p>

            <p className="text-gray-700">
              Toda la información se organiza por la entidad geopolítica correspondiente: los "estados amazónicos" 
              de los diferentes países.
            </p>

            <div className="bg-emerald-50 border-l-4 border-emerald-600 p-6 rounded-r-lg">
              <p className="text-emerald-900">
                <strong>La elección de NoSQL es estratégica:</strong> permite manejar la extrema variedad 
                (volumen, velocidad y variedad) de los datos amazónicos que un modelo relacional rígido (SQL) 
                no podría gestionar eficientemente.
              </p>
            </div>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="bg-emerald-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-gray-900 mb-3">
              Flexibilidad
            </h3>
            <p className="text-gray-600">
              Esquemas de datos que evolucionan a medida que se descubre nueva información sobre especies 
              y patrones de migración.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="bg-emerald-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-gray-900 mb-3">
              Escalabilidad
            </h3>
            <p className="text-gray-600">
              Capacidad para manejar el crecimiento exponencial de datos: imágenes satelitales, 
              sensores IoT y observaciones de campo.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="bg-emerald-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <h3 className="text-gray-900 mb-3">
              Diversidad de Datos
            </h3>
            <p className="text-gray-600">
              Manejo de estructuras completamente diferentes: desde datos geoespaciales hasta 
              información etnográfica y biológica.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
