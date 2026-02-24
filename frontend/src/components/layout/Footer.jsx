import { Link } from 'react-router'

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
            <p className="text-gray-400 text-sm leading-relaxed">
              Somos San Jose Import Export S.A. Llevamos las mejores marcas a tu hogar con la calidad que mereces.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Enlaces</h4>
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
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Legal</h4>
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
            Allways &middot; Allways Health &middot; Paraguay
          </p>
        </div>
      </div>
    </footer>
  )
}
