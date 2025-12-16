export function ProblemaPlanteamiento() {
  return (
    <section id="problema" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block bg-orange-100 text-orange-800 px-4 py-1 rounded-full mb-4">
            Planteamiento del Problema
          </span>
          <h2 className="text-gray-900 mb-4">
            El Desafío de la Fragmentación
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            La información sobre el Amazonas es vasta, crítica y peligrosamente fragmentada
          </p>
        </div>

        {/* Problem Statement */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 md:p-12 mb-12 border-2 border-orange-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-orange-500 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-gray-900 mb-3">
                El Problema Crítico
              </h3>
              <p className="text-gray-700">
                Los datos residen en silos: bases de datos de ONGs, registros gubernamentales, estudios 
                académicos en PDF y repositorios de universidades. No existe un sistema unificado que pueda 
                gestionar esta complejidad.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <svg className="w-7 h-7 text-orange-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <p className="text-gray-900 mb-2">Diversidad de Datos</p>
              <p className="text-sm text-gray-600">
                Plantas con datos medicinales, jaguares con GPS, comunidades con datos demográficos: 
                estructuras completamente diferentes.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <svg className="w-7 h-7 text-orange-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <p className="text-gray-900 mb-2">Escalar Rápidamente</p>
              <p className="text-sm text-gray-600">
                Imágenes satelitales, datos de IoT de sensores climáticos y observaciones de campo 
                crecen exponencialmente.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <svg className="w-7 h-7 text-orange-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <p className="text-gray-900 mb-2">Flexibilidad</p>
              <p className="text-sm text-gray-600">
                Los esquemas deben evolucionar al descubrir nuevas especies y patrones de migración.
              </p>
            </div>
          </div>
        </div>

        {/* Justification */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-gray-900 mb-6">
              ¿Por qué SQL Fallaría?
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>Esquema fijo:</strong> Requiere tablas y columnas estrictas predefinidas
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>Imposibilidad práctica:</strong> Almacenar datos tan heterogéneos sería 
                    extremadamente complejo
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>Falta de flexibilidad:</strong> Cada cambio requeriría migraciones costosas de la base de datos
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-gray-900 mb-6">
              La Solución NoSQL
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>Documentos flexibles:</strong> Almacena registros como JSON/BSON sin esquema fijo
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>Estructura única:</strong> Cada documento puede tener su propia estructura personalizada
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>Escalabilidad horizontal:</strong> Crece fácilmente con el volumen de datos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
