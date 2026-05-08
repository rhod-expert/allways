import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../../components/ui/Button'
import clientApi from '../../services/clientApi'
import GoldParticles from '../../components/landing/GoldParticles'
import { PasswordPair } from './SetupPasswordPage'

export default function ResetPasswordPage() {
  const [search] = useSearchParams()
  const token = search.get('t') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!token) return toast.error('Enlace invalido o expirado.')
    if (password !== password2) return toast.error('Las contrasenas no coinciden.')
    setLoading(true)
    try {
      await clientApi.post('/cliente/password/reset', { token, password, password2 })
      toast.success('Contrasena actualizada')
      setDone(true)
      setTimeout(() => navigate('/cliente/login', { replace: true }), 1800)
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo actualizar la contrasena')
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
            <h1 className="text-xl font-black text-white uppercase tracking-wider">Nueva Contrasena</h1>
            <p className="text-gray-400 text-sm mt-2">Define una nueva contrasena para tu cuenta.</p>
          </div>

          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 size={48} className="text-allways-gold mx-auto" />
              <p className="text-gray-300">Contrasena actualizada. Te llevamos al inicio de sesion...</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <PasswordPair
                password={password}
                password2={password2}
                onChange={setPassword}
                onChange2={setPassword2}
                showPass={showPass}
                onToggleShow={() => setShowPass((v) => !v)}
              />
              <Button type="submit" variant="gold" loading={loading} className="w-full !py-3.5">
                ACTUALIZAR CONTRASENA
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
