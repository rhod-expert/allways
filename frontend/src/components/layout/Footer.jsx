import { Link } from 'react-router'

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="bg-allways-dark border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <img
                src="/allways/images/logo-allways-blanco.png"
                alt="AllWays Health"
                className="h-10 w-auto"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Somos San Jose Import Export S.A. Llevamos las mejores marcas a tu hogar con la calidad que mereces.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/allwayshealth"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:text-allways-gold hover:border-allways-gold/50 transition-all duration-300"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://www.facebook.com/allwayshealth"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:text-allways-gold hover:border-allways-gold/50 transition-all duration-300"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              <span className="text-gold-gradient">Enlaces</span>
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-allways-gold text-sm transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/participar" className="text-gray-400 hover:text-allways-gold text-sm transition-colors">
                  Participar
                </Link>
              </li>
              <li>
                <Link to="/mis-cupones" className="text-gray-400 hover:text-allways-gold text-sm transition-colors">
                  Mis Cupones
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              <span className="text-gold-gradient">Legal</span>
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/bases-y-condiciones" className="text-gray-400 hover:text-allways-gold text-sm transition-colors">
                  Bases y Condiciones
                </Link>
              </li>
              <li>
                <Link to="/privacidad" className="text-gray-400 hover:text-allways-gold text-sm transition-colors">
                  Politica de Privacidad
                </Link>
              </li>
              <li>
                <Link to="/aviso-legal" className="text-gray-400 hover:text-allways-gold text-sm transition-colors">
                  Aviso Legal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs text-center">
            &copy; 2026 San Jose Import Export S.A. Todos los derechos reservados.
          </p>
          <p className="text-gray-600 text-xs">
            <span className="text-allways-gold/60">Allways</span> &middot; Allways Health &middot; Paraguay
          </p>
        </div>
      </div>
    </footer>
  )
}
