export function ProblemaPlanteamiento() {
  return (
    <section id="problema" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block bg-orange-100 text-orange-800 px-4 py-1 rounded-full mb-4">
            Planteamiento del Problema
          </span>
          <h2 className="text-gray-900 mb-4">
            El Desafío de la Conexión
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            El aislamiento económico y las barreras lingüísticas limitan el potencial de las comunidades amazónicas
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
                La Brecha Actual
              </h3>
              <p className="text-gray-700">
                A pesar de producir artesanías únicas y poseer un conocimiento invaluable sobre la
                biodiversidad, las comunidades indígenas enfrentan enormes dificultades para acceder a
                mercados justos, dependiendo a menudo de intermediarios que devalúan su trabajo.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <svg className="w-7 h-7 text-orange-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-900 mb-2">Comercio Injusto</p>
              <p className="text-sm text-gray-600">
                Los productores reciben una fracción del valor final de sus productos debido a cadenas de suministro ineficientes.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <svg className="w-7 h-7 text-orange-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <p className="text-gray-900 mb-2">Barrera Lingüística</p>
              <p className="text-sm text-gray-600">
                Idiomas como el Jivi son ricos culturalmente pero crean barreras de comunicación con compradores y el estado.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <svg className="w-7 h-7 text-orange-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <p className="text-gray-900 mb-2">Pérdida de Saberes</p>
              <p className="text-sm text-gray-600">
                El conocimiento ancestral sobre flora y fauna corre riesgo de perderse si no se documenta visual y lingüísticamente.
              </p>
            </div>
          </div>
        </div>

        {/* Justification */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-gray-900 mb-6">
              El Modelo Tradicional no Funciona
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>Aislamiento Geográfico:</strong> Dificulta la logística y el acceso a compradores globales.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>Desconocimiento Tecnológico:</strong> Las herramientas actuales no están adaptadas a su contexto ni idioma.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>Extinción Cultural:</strong> La presión económica fuerza el abandono de tradiciones.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-gray-900 mb-6">
              La Solución Amazonia IA
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>Marketplace Digital:</strong> Conecta directamente al artesano con el mundo.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>IA Adaptativa:</strong> Herramientas visuales y de voz que entienden su entorno y lengua.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <strong>Valorización:</strong> Transforma el conocimiento ancestral en un activo económico sostenible.
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
