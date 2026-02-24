import { Link } from 'react-router'
import { motion } from 'framer-motion'
import GoldParticles from './GoldParticles'

export default function CTASection() {
  return (
    <section className="relative py-20 bg-hero overflow-hidden">
      <GoldParticles />
      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase mb-4">
            Ya compraste?{' '}
            <span className="text-gold-gradient italic">Carga tu factura ahora!</span>
          </h2>
          <p className="text-gray-300 mb-8 text-lg">
            No pierdas la oportunidad de ganar premios increibles cada mes.
          </p>
          <Link to="/participar" className="btn-gold text-lg px-10 py-4">
            CARGAR FACTURA
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
