import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { Lock, Mail, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../../components/ui/Button'
import clientApi from '../../services/clientApi'
import GoldParticles from '../../components/landing/GoldParticles'

export default function SetupPasswordPage() {
  const [search] = useSearchParams()
  const token = search.get('t') || ''
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      toast.error('Enlace invalido o expirado.')
      return
    }
    if (password !== password2) {
      toast.error('Las contrasenas no coinciden.')
      return
    }
    setLoading(true)
    try {
      await clientApi.post('/cliente/password/setup', { token, password, password2, email })
      toast.success('Contrasena creada')
      setDone(true)
      setTimeout(() => navigate('/cliente/login', { replace: true }), 1800)
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo crear la contrasena')
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
          <div className="text-center mb-6">
            <img src="/allways/images/logo-allways-blanco.png" alt="AllWays" className="h-12 w-auto mx-auto mb-3" />
            <h1 className="text-xl font-black text-white uppercase tracking-wider">Crear Contrasena</h1>
            <p className="text-gray-400 text-sm mt-2">
              Completa estos datos para acceder a tu area del cliente.
            </p>
          </div>

          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 size={48} className="text-allways-gold mx-auto" />
              <p className="text-gray-300">Contrasena creada con exito. Ya puedes iniciar sesion.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email *</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="tu@email.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-gray-500 outline-none focus:border-allways-gold transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Lo usaremos como canal alternativo de contacto.
                </p>
              </div>

              <PasswordPair
                password={password}
                password2={password2}
                onChange={setPassword}
                onChange2={setPassword2}
                showPass={showPass}
                onToggleShow={() => setShowPass((v) => !v)}
              />

              <Button type="submit" variant="gold" loading={loading} className="w-full !py-3.5">
                CREAR CONTRASENA
              </Button>

              <Link to="/cliente/login" className="block text-center text-sm text-allways-gold hover:underline">
                Volver al inicio de sesion
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export function PasswordPair({ password, password2, onChange, onChange2, showPass, onToggleShow }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Nueva contrasena</label>
        <div className="relative">
          <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => onChange(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Minimo 8 caracteres, con letras y numeros"
            className="w-full pl-11 pr-11 py-3 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-gray-500 outline-none focus:border-allways-gold transition-colors"
          />
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            tabIndex={-1}
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirmar contrasena</label>
        <div className="relative">
          <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showPass ? 'text' : 'password'}
            value={password2}
            onChange={(e) => onChange2(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Repeti la contrasena"
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-gray-500 outline-none focus:border-allways-gold transition-colors"
          />
        </div>
      </div>
    </>
  )
}
