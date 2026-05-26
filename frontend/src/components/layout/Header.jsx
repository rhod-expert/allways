import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { Menu, X, Zap, Trophy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'

const navLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/participar', label: 'Participar' },
  { to: '/mis-cupones', label: 'Mis Cupones' },
]

const FALLBACK_BANNER = {
  mode: 'participar',
  mesLabel: '',
  link: '/participar',
  premioDestacado: null
}

function bannerText(banner) {
  if (!banner) return 'Participa ahora del Allways Show de Premios!'
  if (banner.mode === 'ganadores') {
    return `Sorteo de ${banner.mesLabel} realizado — Conoce a los ganadores!`
  }
  if (banner.mode === 'campana_finalizada') {
    return `Campana finalizada — Conoce a los ganadores de ${banner.mesLabel}`
  }
  // participar
  const premio = banner.premioDestacado ? ` y gana ${banner.premioDestacado}!` : '!'
  const mes = banner.mesLabel || ''
  return `Sorteo de ${mes} — Participa ahora${premio}`
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [banner, setBanner] = useState(null)
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  useEffect(() => {
    let cancelled = false
    api.get('/sorteo-banner')
      .then((res) => {
        if (!cancelled) setBanner(res.data?.data || FALLBACK_BANNER)
      })
      .catch(() => {
        if (!cancelled) setBanner(FALLBACK_BANNER)
      })
    return () => { cancelled = true }
  }, [])

  const bannerHref = banner?.link || '/participar'
  const bannerIcon = banner?.mode === 'ganadores' || banner?.mode === 'campana_finalizada' ? Trophy : Zap
  const BannerIcon = bannerIcon

  return (
    <>
      {/* Announcement bar */}
      <div className="announcement-bar py-1.5 text-center">
        <Link to={bannerHref} className="flex items-center justify-center gap-2 text-allways-dark text-xs sm:text-sm font-bold">
          <BannerIcon size={14} className="fill-allways-dark" />
          <span>{bannerText(banner)}</span>
          <BannerIcon size={14} className="fill-allways-dark" />
        </Link>
      </div>

      <header className="sticky top-0 z-40 bg-allways-dark/90 backdrop-blur-lg border-b border-gradient-gold">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/allways/images/logo-allways-blanco.png"
                alt="AllWays Health"
                className="h-9 w-auto group-hover:brightness-110 transition-all duration-300"
              />
              <div className="w-px h-6 bg-white/20" />
              <img
                src="/allways/images/logo-sanjose.png"
                alt="San Jose Import Export S.A."
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
