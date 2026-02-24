import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'
import GoldParticles from '../components/landing/GoldParticles'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-hero flex items-center justify-center relative">
      <GoldParticles />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center px-4 max-w-lg"
      >
        <h1 className="text-8xl sm:text-9xl font-black text-gold-gradient mb-4">404</h1>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Pagina no encontrada</h2>
        <p className="text-gray-400 mb-8">
          Lo sentimos, la pagina que estas buscando no existe o fue movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-gold inline-flex items-center gap-2">
            <Home size={18} />
            Ir al inicio
          </Link>
          <button
            onClick={() => window.history.back()}
            className="border-2 border-white/20 text-white hover:bg-white/10 font-bold px-6 py-3 rounded-xl transition-all duration-300 inline-flex items-center gap-2 justify-center"
          >
            <ArrowLeft size={18} />
            Volver atras
          </button>
        </div>
      </motion.div>
    </div>
  )
}
