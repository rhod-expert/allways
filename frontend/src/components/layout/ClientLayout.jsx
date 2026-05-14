import { Outlet, NavLink, useNavigate, Navigate } from 'react-router'
import { LayoutDashboard, FileText, LogOut, Menu, X, User } from 'lucide-react'
import { useState } from 'react'
import useClientAuth from '../../hooks/useClientAuth'
import PWAInstallPrompt from '../PWAInstallPrompt'
import WhatsAppSAC from '../ui/WhatsAppSAC'

const navLinks = [
  { to: '/cliente/dashboard', label: 'Mis Cupones', icon: LayoutDashboard },
  { to: '/cliente/registros', label: 'Mis Registros', icon: FileText }
]

export function ClientProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useClientAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-allways-dark text-white">
        Cargando...
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/cliente/login" replace />
  return children
}

export default function ClientLayout() {
  const { user, logout } = useClientAuth()
  const navigate = useNavigate()
  const [openMobile, setOpenMobile] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/cliente/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col bg-allways-dark text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-allways-dark/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpenMobile((v) => !v)}
              className="md:hidden text-gray-300 hover:text-white"
              aria-label="Menu"
            >
              {openMobile ? <X size={22} /> : <Menu size={22} />}
            </button>
            <img
              src="/allways/images/logo-allways-blanco.png"
              alt="AllWays"
              className="h-8 w-auto"
            />
            <span className="hidden sm:inline-block text-xs uppercase tracking-wider text-gray-400">
              Show de Premios
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-allways-gold/20 text-allways-gold'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-300">
              <User size={16} className="text-allways-gold" />
              <span className="font-medium truncate max-w-[180px]">{user?.nombre || 'Mi cuenta'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              title="Cerrar sesion"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {openMobile && (
          <div className="md:hidden border-t border-white/10 bg-allways-dark">
            <nav className="px-4 py-3 flex flex-col gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpenMobile(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-allways-gold/20 text-allways-gold'
                        : 'text-gray-300 hover:bg-white/5'
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 py-4 text-center space-y-1.5">
        <p className="text-[11px] uppercase tracking-wider text-allways-gold/80 font-semibold px-4">
          Certificado de Autorizacion CONAJZAR N&deg; 186 de fecha 04 de mayo del 2026
        </p>
        <p className="text-xs text-gray-500">
          Allways Show de Premios &middot; San Jose Import Export S.A.
        </p>
      </footer>

      <PWAInstallPrompt />
      <WhatsAppSAC />
    </div>
  )
}
