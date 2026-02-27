import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import GoldParticles from './GoldParticles'

export default function HeroSection() {
  return (
    <section className="relative bg-hero min-h-[90vh] flex items-center justify-center section-divider-wave">
      <GoldParticles />

      {/* Dot pattern texture overlay */}
      <div className="absolute inset-0 bg-dot-pattern z-[1] opacity-50" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <img
            src="/allways/images/logo-allways-blanco.png"
            alt="AllWays Health"
            className="h-16 sm:h-20 w-auto mx-auto mb-4"
          />
          <p className="text-allways-cyan text-sm sm:text-base font-semibold uppercase tracking-[0.3em]">
            Show de Premios 2026
          </p>
        </motion.div>

        {/* Decorative gold line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="w-24 h-0.5 mx-auto mb-8 bg-gradient-to-r from-transparent via-allways-gold to-transparent"
        />

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl sm:text-6xl md:text-8xl font-black text-white uppercase leading-[0.9] mb-8 text-glow-gold"
        >
          COMPRA. CARGA{' '}
          <span className="text-gold-gradient italic">TU FACTURA</span>.{' '}
          <span className="block mt-2">GANA.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg sm:text-xl text-gray-300 mb-4 max-w-2xl mx-auto"
        >
          30 premios de abril a octubre + <span className="text-allways-gold font-bold">Auto 0 KM</span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-sm text-gray-400 mb-10 max-w-xl mx-auto"
        >
          Compra productos de nuestras marcas participantes, carga tu factura y participa en sorteos mensuales con premios increibles.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/participar" className="btn-gold text-lg px-10 py-4">
            CARGAR FACTURA
          </Link>
          <Link
            to="/mis-cupones"
            className="border-2 border-allways-gold/50 text-allways-gold hover:bg-allways-gold/10 hover:shadow-gold font-bold px-8 py-4 rounded-xl transition-all duration-300 text-lg"
          >
            MIS CUPONES
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown size={28} className="text-allways-gold/50" />
        </motion.div>
      </motion.div>
    </section>
  )
}
