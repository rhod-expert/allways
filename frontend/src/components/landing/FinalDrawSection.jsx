import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { Trophy, Star, Sparkles } from 'lucide-react'

const confettiColors = ['#D4A843', '#F0D78C', '#4DB8FF', '#2563EB', '#ffffff']

export default function FinalDrawSection() {
  return (
    <section className="py-24 bg-dark-subtle spotlight-bg relative overflow-hidden">
      {/* Confetti particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="confetti-particle"
            style={{
              left: `${5 + (i * 4.7) % 90}%`,
              backgroundColor: confettiColors[i % confettiColors.length],
              animationDuration: `${6 + (i % 5) * 2}s`,
              animationDelay: `${(i * 0.7) % 8}s`,
              borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0',
              width: `${6 + (i % 3) * 3}px`,
              height: `${6 + (i % 3) * 3}px`,
            }}
          />
        ))}
      </div>

      {/* Background glow - enhanced */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] rounded-full bg-allways-gold/5 blur-3xl animate-spotlight" />
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <Star size={20} className="text-allways-gold animate-pulse" />
            <Sparkles size={16} className="text-allways-gold-light" />
            <p className="text-allways-gold text-sm font-bold uppercase tracking-[0.3em]">Gran Sorteo Final</p>
            <Sparkles size={16} className="text-allways-gold-light" />
            <Star size={20} className="text-allways-gold animate-pulse" />
          </motion.div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white uppercase mb-2 text-glow-gold">
            Renault <span className="text-gold-gradient">Kwid</span> 0 KM
          </h2>
          <p className="text-gray-400 text-lg">Octubre 2026</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8, type: 'spring', stiffness: 100 }}
          className="rounded-3xl border-2 border-allways-gold/40 pulse-gold-border p-6 sm:p-10 bg-white/5 backdrop-blur-sm shadow-gold-lg"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <motion.div
              className="flex-1"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <img
                src="/allways/images/prizes/kwid.png"
                alt="Renault Kwid 0 KM"
                className="w-full max-w-md mx-auto drop-shadow-2xl"
              />
            </motion.div>
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-allways-gold/20 rounded-full px-4 py-2 mb-4">
                <Trophy size={18} className="text-allways-gold" />
                <span className="text-allways-gold-light font-bold text-sm">PREMIO MAYOR</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">
                Todos tus cupones del ano participan
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Cada cupon que acumules durante toda la promocion participa automaticamente en el gran sorteo final de octubre. Mientras mas compres, mas oportunidades tenes de llevarte un Renault Kwid 0 KM.
              </p>
              <Link to="/participar" className="btn-gold inline-flex">
                PARTICIPAR AHORA
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
