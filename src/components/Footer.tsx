import logo from 'figma:asset/ace68de9acb2259307e16907ceb10ff04c569a46.png';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Arapaima" className="h-12 w-12" />
              <div>
                <div className="text-white">Arapaima</div>
                <p className="text-xs text-gray-400">Sistema de Clasificación Amazónica</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Flexibilidad y Escalabilidad para la Biodiversidad más Compleja del Mundo.
            </p>
            <p className="text-xs text-gray-500">
              Un proyecto dedicado a la preservación y catalogación del conocimiento amazónico 
              mediante tecnología NoSQL de vanguardia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white mb-4">Enlaces</h4>
            <ul className="space-y-2">
              <li>
                <a href="#resumen" className="text-sm hover:text-emerald-400 transition-colors">
                  Resumen
                </a>
              </li>
              <li>
                <a href="#problema" className="text-sm hover:text-emerald-400 transition-colors">
                  Problema
                </a>
              </li>
              <li>
                <a href="#objetivos" className="text-sm hover:text-emerald-400 transition-colors">
                  Objetivos
                </a>
              </li>
              <li>
                <a href="#features" className="text-sm hover:text-emerald-400 transition-colors">
                  Características
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>info@arapaima.org</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <svg className="w-4 h-4 text-emerald-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Cuenca Amazónica, América del Sur</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <a href="#" className="hover:text-emerald-400 transition-colors">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2025 Arapaima. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-emerald-400 transition-colors">
                Política de Privacidad
              </a>
              <a href="#" className="hover:text-emerald-400 transition-colors">
                Términos de Uso
              </a>
              <a href="#" className="hover:text-emerald-400 transition-colors">
                Documentación
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
