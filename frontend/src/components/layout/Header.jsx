import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Menu, X, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/participar', label: 'Participar' },
  { to: '/mis-cupones', label: 'Mis Cupones' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Announcement bar */}
      <div className="announcement-bar py-1.5 text-center">
        <Link to="/participar" className="flex items-center justify-center gap-2 text-allways-dark text-xs sm:text-sm font-bold">
          <Zap size={14} className="fill-allways-dark" />
          <span>Sorteo de Abril -- Participa ahora y gana una TV 50"!</span>
          <Zap size={14} className="fill-allways-dark" />
        </Link>
      </div>

      <header className="sticky top-0 z-40 bg-allways-dark/90 backdrop-blur-lg border-b border-gradient-gold">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/allways/images/logo-allways-blanco.png"
                alt="AllWays Health"
                className="h-9 w-auto group-hover:brightness-110 transition-all duration-300"
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 nav-link-animated
                    ${isActive(link.to)
                      ? 'text-allways-gold bg-allways-gold/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/participar"
                className="ml-3 btn-gold !px-5 !py-2 !text-sm !rounded-lg"
              >
                CARGAR FACTURA
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-300 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 bg-allways-dark/95 backdrop-blur-lg overflow-hidden"
            >
              <nav className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-sm font-semibold transition-all
                      ${isActive(link.to)
                        ? 'text-allways-gold bg-allways-gold/10'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/participar"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center btn-gold !py-3 !text-sm mt-3"
                >
                  CARGAR FACTURA
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}
