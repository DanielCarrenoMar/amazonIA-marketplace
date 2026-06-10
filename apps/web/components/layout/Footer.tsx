import logo from '@/public/logo.png';

export function Footer() {
  return (
    <footer className="bg-brand-nature-bg text-brand-nature-content border-t border-brand-primary/10 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src={logo.src} alt="AmazonIA Marketplace" className="h-12 w-12 drop-shadow-sm" />
              <div>
                <div className="text-brand-nature-content font-bold text-lg">AmazonIA</div>
                <p className="text-xs text-brand-primary font-medium">Marketplace y Tecnología</p>
              </div>
            </div>
            <p className="text-sm text-muted mb-4 max-w-md leading-relaxed">
              Tecnología y Comercio Justo para la Amazonía.
            </p>
            <p className="text-xs text-muted/80 max-w-md leading-relaxed">
              Un proyecto dedicado a la preservación y catalogación del conocimiento amazónico
              mediante tecnología de vanguardia, inteligencia artificial y comercio directo.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-brand-nature-content font-bold mb-6">Enlaces</h4>
            <ul className="space-y-3">
              <li>
                <a href="#resumen" className="text-sm text-muted hover:text-brand-primary transition-colors font-medium">
                  Resumen
                </a>
              </li>
              <li>
                <a href="#herramientas" className="text-sm text-muted hover:text-brand-primary transition-colors font-medium">
                  Tecnología
                </a>
              </li>
              <li>
                <a href="#marketplace" className="text-sm text-muted hover:text-brand-primary transition-colors font-medium">
                  Marketplace
                </a>
              </li>
              <li>
                <a href="#impacto" className="text-sm text-muted hover:text-brand-primary transition-colors font-medium">
                  Impacto
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-brand-nature-content font-bold mb-6">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-muted">
                <svg className="w-5 h-5 text-brand-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <a href="#" className="hover:text-brand-primary transition-colors font-medium">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-brand-primary/10 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted font-medium">
              © 2026 AmazonIA Marketplace. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-muted font-medium">
              <a href="#" className="hover:text-brand-primary transition-colors">
                Política de Privacidad
              </a>
              <a href="#" className="hover:text-brand-primary transition-colors">
                Términos de Uso
              </a>
              <a href="#" className="hover:text-brand-primary transition-colors">
                Documentación
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}