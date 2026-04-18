export function Features() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      title: 'Marketplace Especializado',
      description: 'Plataforma de comercio electrónico diseñada para productos artesanales y agroindustriales amazónicos.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        </svg>
      ),
      title: 'Reconocimiento de Imágenes',
      description: 'IA entrenada para identificar especies de plantas y animales mediante fotografías tomadas in-situ.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      ),
      title: 'Traductor de Texto Jivi',
      description: 'Algoritmos de NLP para traducir documentos y mensajes entre Español y Jivi con alta precisión.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      title: 'Traductor de Audio (STT/TTS)',
      description: 'Conversión voz-texto-voz para romper la barrera del analfabetismo y facilitar la comunicación oral.',
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
            Herramientas al Servicio de la Comunidad
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Innovación tecnológica aplicada para resolver problemas reales de comunicación y comercio
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
          <p className="text-gray-600 mb-6">Tecnologías Implementadas:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['React', 'Python', 'TensorFlow', 'OpenAI Whisper', 'FastAPI', 'Supabase'].map((tech) => (
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
