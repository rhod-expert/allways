import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router'
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import Spinner from '../ui/Spinner'

const sidebarLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/registros', label: 'Registros', icon: Users },
]

export default function AdminLayout() {
  const { isAuthenticated, loading, logout, user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/admin/login', { replace: true })
    }
  }, [loading, isAuthenticated, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-allways-dark flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 admin-sidebar transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <img
                src="/allways/images/logo-allways-blanco.png"
                alt="AllWays Health"
                className="h-7 w-auto"
              />
            </Link>
            <button
              className="lg:hidden p-1 text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`admin-sidebar-link ${isActive(link.to) ? 'active' : ''}`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="px-3 py-4 border-t border-white/10">
            <div className="px-4 py-2 mb-2">
              <p className="text-xs text-gray-500">Conectado como</p>
              <p className="text-sm text-white font-semibold truncate">{user?.username || 'Admin'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="admin-sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">Cerrar sesion</span>
            </button>
            <Link
              to="/"
              className="admin-sidebar-link w-full mt-1"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">Volver al sitio</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center px-4 lg:px-8">
          <button
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="ml-2 lg:ml-0">
            <h1 className="text-lg font-bold text-gray-800">Allways Show de Premios</h1>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
