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
            Innovación para la Selva: Comercio e IA
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Una plataforma integral que une el comercio justo con herramientas de inteligencia artificial avanzadas
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
              El proyecto <strong>Amazonia IA</strong> propone una doble solución: un <strong>Marketplace Digital</strong> para
              extender la economía a las comunidades indígenas, y un set de <strong>herramientas tecnológicas</strong> diseñadas
              específicamente para el contexto amazónico.
            </p>

            <p className="text-gray-700">
              Nuestro objetivo es empoderar a los productores locales permitiéndoles vender sus artesanías y productos
              directamente al mundo, eliminando intermediarios y garantizando precios justos.
            </p>

            <p className="text-gray-700">
              Paralelamente, nuestras herramientas de IA abordan desafíos críticos:
            </p>

            <div className="bg-emerald-50 border-l-4 border-emerald-600 p-6 rounded-r-lg">
              <ul className="list-disc list-inside text-emerald-900 space-y-2">
                <li><strong>Reconocimiento de Imágenes:</strong> Identificación automática de flora y fauna para investigadores y turistas.</li>
                <li><strong>Traducción Jivi-Español:</strong> Puente de comunicación mediante traducción de texto y audio en tiempo real.</li>
              </ul>
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
              Impacto Económico
            </h3>
            <p className="text-gray-600">
              Generación de nuevas fuentes de ingresos sostenibles para las comunidades, valorando sus productos y conocimientos.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="bg-emerald-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-gray-900 mb-3">
              Preservación Cultural
            </h3>
            <p className="text-gray-600">
              Uso de tecnología para documentar y revitalizar lenguas nativas como el Jivi, evitando su desaparición.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
            <div className="bg-emerald-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div className="bg-emerald-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-gray-900 mb-3">
              Innovación Aplicada
            </h3>
            <p className="text-gray-600">
              IA de última generación entrenada específicamente con datos locales para resolver problemas reales de la región.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
