export function Features() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'Base de Datos Documental',
      description: 'Utiliza MongoDB o Couchbase para almacenar registros como documentos JSON/BSON sin esquema fijo.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      title: 'Consultas Geoespaciales',
      description: 'Búsquedas complejas por ubicación: "Especies de flora medicinal en un radio de 50km del río Putumayo".',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'División Política Amazónica',
      description: 'Organización por estados amazónicos de Brasil, Perú, Venezuela, Colombia, Ecuador y otros países.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: 'Búsqueda Optimizada',
      description: 'Integración con Elasticsearch para consultas rápidas y eficientes sobre millones de registros.',
    },
  ];

  return (
    <section id="features" className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block bg-emerald-600 text-white px-4 py-1 rounded-full mb-4">
            Características Técnicas
          </span>
          <h2 className="text-gray-900 mb-4">
            Tecnología de Vanguardia
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Una pila tecnológica NoSQL optimizada para los desafíos únicos de la información amazónica
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <div className="bg-emerald-100 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-emerald-600">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tech Stack Badges */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6">Tecnologías consideradas:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['MongoDB', 'Couchbase', 'Elasticsearch', 'ArangoDB', 'GeoJSON', 'REST APIs'].map((tech) => (
              <span 
                key={tech}
                className="bg-white px-6 py-2 rounded-full border-2 border-emerald-200 text-gray-700 hover:border-emerald-400 transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
