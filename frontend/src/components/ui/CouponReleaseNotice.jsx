import { motion } from 'framer-motion'
import { ShieldCheck, Clock, CalendarDays } from 'lucide-react'

/**
 * Aviso destacado sobre la liberación de cupones:
 * verificación doble, hasta 24 horas, y cupones del fin de semana liberados el lunes.
 * Variante "gold" alineada a la identidad premium del sorteo.
 */
export default function CouponReleaseNotice({ className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      role="note"
      className={`relative overflow-hidden rounded-2xl border-2 border-allways-gold bg-allways-gold-light/40 p-5 shadow-gold ${className}`}
    >
      {/* shimmer sutil en el borde superior */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-allways-gold to-transparent" />

      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-allways-gold/20 animate-pulse-gold">
          <ShieldCheck size={24} className="text-allways-gold" />
        </div>

        <div className="min-w-0">
          <h4 className="text-sm font-black uppercase tracking-wider text-allways-navy">
            Verificación en dos pasos
          </h4>

          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-gray-700">
            <Clock size={16} className="mt-0.5 flex-shrink-0 text-allways-gold" />
            <span>
              Tus cupones serán habilitados luego de una{' '}
              <strong className="font-bold text-allways-navy">doble verificación</strong>, que
              puede demorar{' '}
              <strong className="font-bold text-allways-navy">hasta 24 horas</strong>.
            </span>
          </p>

          <p className="mt-2 flex items-start gap-1.5 text-sm text-gray-700">
            <CalendarDays size={16} className="mt-0.5 flex-shrink-0 text-allways-gold" />
            <span>
              Los registros realizados durante el{' '}
              <strong className="font-bold text-allways-navy">fin de semana</strong>{' '}
              se procesarán el{' '}
              <strong className="font-bold text-allways-navy">lunes</strong>.
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  )
}
