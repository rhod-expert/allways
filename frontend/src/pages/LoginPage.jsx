import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { Lock, User } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../components/ui/Button'
import useAuth from '../hooks/useAuth'
import GoldParticles from '../components/landing/GoldParticles'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.error('Ingresa usuario y contrasena')
      return
    }
    setLoading(true)
    try {
      await login(username.trim(), password)
      toast.success('Sesion iniciada correctamente')
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error || 'Credenciales invalidas'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center relative">
      <GoldParticles />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-card !p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="/allways/images/logo-allways-blanco.png"
              alt="AllWays Health"
              className="h-14 w-auto mx-auto mb-4"
            />
            <h1 className="text-xl font-black text-white uppercase tracking-wider">Panel Administrativo</h1>
            <p className="text-gray-400 text-sm mt-1">Allways Show de Premios</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Usuario</label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-gray-500 outline-none focus:border-allways-gold transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Contrasena</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contrasena"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-gray-500 outline-none focus:border-allways-gold transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              loading={loading}
              className="w-full !py-3.5"
            >
              INICIAR SESION
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
