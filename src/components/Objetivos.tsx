export function Objetivos() {
  const objetivosEspecificos = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      title: 'Modelo de Datos NoSQL',
      description: 'Diseñar un modelo flexible basado en documentos para albergar Flora, Fauna e Individuos/Comunidades.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Pila Tecnológica',
      description: 'Seleccionar e implementar tecnología NoSQL optimizada para búsquedas geoespaciales (MongoDB, Elasticsearch, ArangoDB).',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      title: 'Mecanismos de Ingesta',
      description: 'Desarrollar APIs y formularios para poblar la base de datos desde investigadores, datos públicos y ONGs.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Clasificación Geopolítica',
      description: 'Crear sistema de clasificación basado en División Política Amazónica (Estados de Brasil, Departamentos de Perú, etc.).',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: 'Consultas Complejas',
      description: 'Garantizar capacidad para consultas avanzadas: especies por ubicación, radio geográfico, características específicas.',
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
            Una Visión Clara y Ambiciosa
          </h2>
          <p className="text-xl text-emerald-100 max-w-3xl mx-auto">
            Establecer las bases tecnológicas para la conservación y el conocimiento de la Amazonía
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
                Sistema de Referencia Centralizado
              </h3>
              <p className="text-emerald-50 text-lg">
                Implementar un sistema de información NoSQL robusto y centralizado que sirva como referencia 
                para la clasificación y consulta de datos biológicos y demográficos de los estados amazónicos.
              </p>
            </div>
          </div>
        </div>

        {/* Objetivos Específicos */}
        <div className="mb-12">
          <h3 className="text-white mb-8 text-center">
            Objetivos Específicos
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
            Ejemplo de Consulta Compleja
          </h4>
          <div className="bg-gray-900/50 rounded-lg p-6 font-mono text-sm overflow-x-auto">
            <code className="text-emerald-300">
              {`"Mostrar todas las especies de flora medicinal\nusadas por comunidades indígenas en un radio\nde 50km del río Putumayo"`}
            </code>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs text-white">Búsqueda geoespacial</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs text-white">Filtros múltiples</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs text-white">Datos relacionados</span>
          </div>
        </div>
      </div>
    </section>
  );
}
