import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Clock, ArrowRight } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="relative py-20 bg-dark-section overflow-hidden">
      {/* Subtle radial accent */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-allways-blue/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card-gold text-center py-12 px-6 sm:px-12"
        >
          {/* Urgency badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-full px-4 py-1.5 mb-6"
          >
            <Clock size={14} className="text-red-400" />
            <span className="text-red-300 text-xs font-bold uppercase tracking-wider">Sorteos activos -- No te lo pierdas</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase mb-4">
            Ya compraste?{' '}
            <span className="text-gold-gradient italic block sm:inline">Carga tu factura ahora!</span>
          </h2>
          <p className="text-gray-300 mb-8 text-lg max-w-lg mx-auto">
            No pierdas la oportunidad de ganar premios increibles cada mes. Cada producto es un cupon mas.
          </p>
          <Link to="/participar" className="btn-gold text-lg px-10 py-4 inline-flex items-center gap-2 group">
            CARGAR FACTURA
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
