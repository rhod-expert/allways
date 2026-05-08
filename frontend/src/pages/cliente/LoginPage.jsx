import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { Contact, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../../components/ui/Button'
import useClientAuth from '../../hooks/useClientAuth'
import GoldParticles from '../../components/landing/GoldParticles'

export default function ClienteLoginPage() {
  const [cedula, setCedula] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [recordarme, setRecordarme] = useState(true)
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated } = useClientAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/cliente/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!cedula.trim() || !password) {
      toast.error('Ingresa tu cedula y contrasena.')
      return
    }
    setLoading(true)
    try {
      await login(cedula.trim(), password, recordarme)
      toast.success('Bienvenido')
      navigate('/cliente/dashboard', { replace: true })
    } catch (err) {
      const code = err.response?.data?.code
      const msg = err.response?.data?.message || 'Error al iniciar sesion'
      if (code === 'PASSWORD_NOT_SET') {
        toast.info(msg, { autoClose: 7000 })
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center relative px-4">
      <GoldParticles />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card !p-8">
          <div className="text-center mb-8">
            <img
              src="/allways/images/logo-allways-blanco.png"
              alt="AllWays Health"
              className="h-14 w-auto mx-auto mb-4"
            />
            <h1 className="text-xl font-black text-white uppercase tracking-wider">Area del Cliente</h1>
            <p className="text-gray-400 text-sm mt-1">Allways Show de Premios</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Cedula</label>
              <div className="relative">
                <Contact size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value.replace(/\D+/g, ''))}
                  placeholder="Numero de cedula"
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
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contrasena"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-gray-500 outline-none focus:border-allways-gold transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-300 select-none">
              <input
                type="checkbox"
                checked={recordarme}
                onChange={(e) => setRecordarme(e.target.checked)}
                className="rounded border-white/20 bg-white/10 text-allways-gold focus:ring-allways-gold"
              />
              Recordarme en este dispositivo
            </label>

            <Button type="submit" variant="gold" loading={loading} className="w-full !py-3.5">
              INICIAR SESION
            </Button>

            <div className="flex items-center justify-between text-sm pt-2">
              <Link to="/cliente/recuperar" className="text-allways-gold hover:underline">
                Olvide mi contrasena
              </Link>
              <Link to="/participar" className="text-gray-400 hover:text-white">
                Quiero participar
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Si aun no tenes contrasena, registra una factura y recibiras un enlace por WhatsApp.
        </p>
      </motion.div>
    </div>
  )
}
