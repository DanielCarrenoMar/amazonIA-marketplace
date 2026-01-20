export function Objetivos() {
  const objetivosEspecificos = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Marketplace Responsable',
      description: 'Crear un canal de venta directo y seguro para productores indígenas, eliminando intermediarios.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        </svg>
      ),
      title: 'IA Visual Amazónica',
      description: 'Entrenar modelos de visión por computador para reconocer especies de flora y fauna endémicas.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      title: 'Preservación Lingüística',
      description: 'Desarrollar traductores neuronales (texto y audio) para lenguas como el Jivi, facilitando la comunicación.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Economía Circular',
      description: 'Fomentar un ciclo económico que beneficie directamente a las comunidades y promueva la sostenibilidad.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'Innovación Abierta',
      description: 'Poner la tecnología más avanzada al servicio del conocimiento ancestral sin explotarlo.',
    },
  ];

  return (
    <section id="objetivos" className="py-20 bg-gradient-to-br from-emerald-900 to-teal-800 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-1 rounded-full mb-4">
            Objetivos del Proyecto
          </span>
          <h2 className="text-white mb-4">
            Tecnología con Propósito Social
          </h2>
          <p className="text-xl text-emerald-100 max-w-3xl mx-auto">
            Integrando el comercio digital y la inteligencia artificial para un futuro sostenible
          </p>
        </div>

        {/* Objetivo General */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 mb-12 border-2 border-white/20">
          <div className="flex items-start gap-4">
            <div className="bg-emerald-500 w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="inline-block bg-emerald-400/30 text-emerald-100 px-3 py-1 rounded-full mb-3">
                Objetivo General
              </span>
              <h3 className="text-white mb-3">
                Integración Económica y Tecnológica
              </h3>
              <p className="text-emerald-50 text-lg">
                Establecer una plataforma integral que combine un marketplace de comercio justo para las comunidades amazónicas
                con herramientas avanzadas de IA para la preservación de su biodiversidad y lengua.
              </p>
            </div>
          </div>
        </div>

        {/* Objetivos Específicos */}
        <div className="mb-12">
          <h3 className="text-white mb-8 text-center">
            Pilares Estratégicos
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {objetivosEspecificos.map((objetivo, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all hover:-translate-y-1"
              >
                <div className="bg-emerald-400/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-emerald-300">
                  {objetivo.icon}
                </div>
                <h4 className="text-white mb-3">
                  {objetivo.title}
                </h4>
                <p className="text-emerald-100 text-sm">
                  {objetivo.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Example Query */}
        <div className="bg-gradient-to-r from-teal-600/30 to-emerald-600/30 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h4 className="text-white mb-4">
            Ejemplo de Impacto Real
          </h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 rounded-lg p-6">
              <p className="text-emerald-300 font-mono text-sm mb-2">// Interacción de Usuario</p>
              <p className="text-white italic">"Quiero comprar una cesta tejida y saber qué planta se usó."</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-6">
              <p className="text-teal-300 font-mono text-sm mb-2">// Respuesta de la Plataforma</p>
              <p className="text-white text-sm">
                1. Muestra producto del artesano Jivi.<br />
                2. IA identifica la fibra: "Palma de Cumare".<br />
                3. Traduce la descripción del Jivi al Español.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
