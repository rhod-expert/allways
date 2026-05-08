import { useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Contact, MessageCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../../components/ui/Button'
import clientApi from '../../services/clientApi'
import GoldParticles from '../../components/landing/GoldParticles'

export default function RecuperarPage() {
  const [cedula, setCedula] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!cedula.trim()) {
      toast.error('Ingresa tu cedula.')
      return
    }
    setLoading(true)
    try {
      const r = await clientApi.post('/cliente/password/recuperar', { cedula: cedula.trim() })
      toast.success(r.data.message)
      setEnviado(true)
    } catch {
      toast.error('Hubo un problema. Intenta nuevamente en unos minutos.')
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
          <Link
            to="/cliente/login"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft size={16} /> Volver
          </Link>
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-allways-gold/20 flex items-center justify-center">
              <MessageCircle size={28} className="text-allways-gold" />
            </div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider">Recuperar Contrasena</h1>
            <p className="text-gray-400 text-sm mt-2">
              Te enviaremos un enlace por WhatsApp al numero registrado.
            </p>
          </div>

          {enviado ? (
            <div className="text-center space-y-4">
              <div className="text-allways-gold-light bg-allways-gold/10 border border-allways-gold/30 rounded-xl p-4 text-sm">
                Si tu cedula esta registrada, en unos segundos recibiras un mensaje en WhatsApp con el enlace para crear una nueva contrasena.
                <br /><br />
                <span className="text-gray-300">El enlace es valido por 30 minutos.</span>
              </div>
              <Link to="/cliente/login" className="block text-sm text-allways-gold hover:underline">
                Volver al inicio de sesion
              </Link>
            </div>
          ) : (
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
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-gray-500 outline-none focus:border-allways-gold transition-colors"
                  />
                </div>
              </div>

              <Button type="submit" variant="gold" loading={loading} className="w-full !py-3.5">
                ENVIAR ENLACE
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
