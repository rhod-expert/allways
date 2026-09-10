import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Sparkles,
  X,
  ChevronRight,
  MapPin,
  Ticket,
  AlertTriangle,
  FlaskConical,
  Repeat,
} from 'lucide-react'

// Pacing of a single reveal. The roulette runs for at least ROLL_MS so the
// draw never feels instant, even when Oracle answers in 40ms.
const ROLL_MS = 3600
const SHUFFLE_MS = 70
const COUNTDOWN_FROM = 3

// Keys a presentation remote typically sends, so the operator can advance
// without walking back to the laptop.
const ADVANCE_KEYS = ['Enter', ' ', 'ArrowRight', 'PageDown']

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomCupon() {
  const n = Math.floor(Math.random() * 999999).toString().padStart(6, '0')
  return `AW-2026-${n}`
}

/**
 * Fullscreen, prize-by-prize draw for the live event.
 *
 * Each prize is drawn on its own request at the moment it is revealed, so the
 * winner genuinely does not exist in the database until the roulette stops.
 */
export default function SorteoPresentacion({
  mes,
  premios,
  muestraCupones = [],
  // 'real'       - draws each prize for keeps, one request per reveal
  // 'simulacion' - same animation, nothing persisted
  // 'replay'     - re-shows winners already stored, never draws
  modo = 'real',
  onDraw,
  onClose,
  onFinish,
}) {
  const simulacion = modo === 'simulacion'
  const replay = modo === 'replay'
  // The queue is frozen at mount: prizes still without a winner, in prize order.
  const queue = useMemo(
    () => premios.filter((p) => !p.CUPON_GANADOR_ID),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState('ready') // ready | rolling | revealed | done
  const [ganadores, setGanadores] = useState([])
  const [current, setCurrent] = useState(null)
  const [rolling, setRolling] = useState(randomCupon())
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM)
  const [error, setError] = useState(null)

  const shuffleRef = useRef(null)
  const countdownRef = useRef(null)

  const premio = queue[index]
  const total = premios.length
  const yaSorteados = premios.length - queue.length

  const stopTimers = useCallback(() => {
    if (shuffleRef.current) clearInterval(shuffleRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    shuffleRef.current = null
    countdownRef.current = null
  }, [])

  useEffect(() => stopTimers, [stopTimers])

  const handleSortear = useCallback(async () => {
    if (!premio || phase === 'rolling') return

    setError(null)
    setPhase('rolling')
    setCountdown(COUNTDOWN_FROM)

    const pool = muestraCupones.length > 0 ? muestraCupones : null
    shuffleRef.current = setInterval(() => {
      setRolling(pool ? pool[Math.floor(Math.random() * pool.length)] : randomCupon())
    }, SHUFFLE_MS)

    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c > 1 ? c - 1 : 1))
    }, ROLL_MS / COUNTDOWN_FROM)

    try {
      // The suspense and the real draw run together; the reveal waits for the
      // slower of the two, so a fast DB never cuts the animation short.
      const [ganador] = await Promise.all([onDraw(premio.ID), delay(ROLL_MS)])
      stopTimers()
      setCurrent(ganador)
      setGanadores((prev) => [...prev, ganador])
      setPhase('revealed')
    } catch (err) {
      stopTimers()
      setError(err?.response?.data?.message || 'No se pudo sortear este premio.')
      setPhase('ready')
    }
  }, [premio, phase, muestraCupones, onDraw, stopTimers])

  const handleSiguiente = useCallback(() => {
    if (index + 1 >= queue.length) {
      setPhase('done')
      onFinish?.()
      return
    }
    setIndex((i) => i + 1)
    setCurrent(null)
    setPhase('ready')
  }, [index, queue.length, onFinish])

  // Keyboard control for the presenter.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (phase !== 'rolling') onClose()
        return
      }
      if (!ADVANCE_KEYS.includes(e.key)) return
      e.preventDefault()
      if (phase === 'ready') handleSortear()
      else if (phase === 'revealed') handleSiguiente()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, handleSortear, handleSiguiente, onClose])

  const puedeSalir = phase !== 'rolling'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-allways-dark via-allways-navy to-allways-dark"
    >
      {/* A non-real run is impossible to miss: full-width bar, always on screen. */}
      {simulacion && (
        <div className="sticky top-0 z-10 bg-fuchsia-600 text-white text-center py-2 px-4 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2">
          <FlaskConical size={16} />
          Modo simulacion &mdash; los resultados NO se guardan
        </div>
      )}
      {replay && (
        <div className="sticky top-0 z-10 bg-blue-600 text-white text-center py-2 px-4 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2">
          <Repeat size={16} />
          Repeticion &mdash; ganadores ya sorteados
        </div>
      )}

      <div className="min-h-screen flex flex-col p-4 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-allways-gold text-xs font-bold uppercase tracking-[0.2em]">
              Sorteo de {mes}
            </p>
            <p className="text-white/50 text-xs mt-1">
              {phase === 'done'
                ? `${ganadores.length} premio${ganadores.length !== 1 ? 's' : ''} revelado${ganadores.length !== 1 ? 's' : ''}`
                : `Premio ${yaSorteados + index + 1} de ${total}`}
            </p>
          </div>
          <button
            onClick={puedeSalir ? onClose : undefined}
            disabled={!puedeSalir}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Cerrar presentacion"
          >
            <X size={22} />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {premios.map((p, i) => {
            const done = p.CUPON_GANADOR_ID || i < yaSorteados + index
            const active = i === yaSorteados + index && phase !== 'done'
            return (
              <div
                key={p.ID}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  active ? 'w-10 bg-allways-gold' : done ? 'w-6 bg-allways-gold/60' : 'w-6 bg-white/15'
                }`}
              />
            )
          })}
        </div>

        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {/* ---------- FINAL SCREEN ---------- */}
            {phase === 'done' ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl"
              >
                <div className="text-center mb-8">
                  <Trophy size={48} className="mx-auto text-allways-gold mb-3" />
                  <h2 className="text-3xl sm:text-5xl font-black text-white uppercase">
                    Ganadores de {mes}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ganadores.map((g, i) => (
                    <motion.div
                      key={g.premioId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.12 }}
                      className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-allways-gold/30"
                    >
                      <p className="text-allways-gold text-xs font-bold uppercase tracking-wider mb-2">
                        {g.premioDescripcion}
                      </p>
                      <p className="text-white text-xl font-black leading-tight">
                        {g.participanteNombre}
                      </p>
                      <p className="text-white/50 text-xs font-mono mt-1">{g.numeroCupon}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="text-center mt-10">
                  <button
                    onClick={onClose}
                    className="bg-allways-gold text-allways-dark font-black px-8 py-3.5 rounded-xl hover:brightness-110 transition"
                  >
                    Cerrar presentacion
                  </button>
                </div>
              </motion.div>
            ) : !premio ? (
              /* ---------- NOTHING LEFT TO DRAW ---------- */
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <Trophy size={48} className="mx-auto text-allways-gold mb-4" />
                <p className="text-white text-xl font-bold mb-6">
                  Todos los premios de {mes} ya tienen ganador.
                </p>
                <button
                  onClick={onClose}
                  className="bg-allways-gold text-allways-dark font-black px-8 py-3 rounded-xl hover:brightness-110 transition"
                >
                  Cerrar
                </button>
              </motion.div>
            ) : (
              /* ---------- PRIZE STAGE ---------- */
              <motion.div
                key={`premio-${premio.ID}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-3xl text-center"
              >
                {/* Prize image + name: always on screen, per the request that
                    each prize is shown together with its winner. */}
                <div className="mb-6">
                  <div className="h-40 sm:h-56 flex items-center justify-center mb-4">
                    <img
                      src={`/allways${premio.IMAGEN}`}
                      alt={premio.DESCRIPCION}
                      className="max-h-full max-w-full object-contain drop-shadow-2xl"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-white uppercase leading-tight px-4">
                    {premio.DESCRIPCION}
                  </h2>
                </div>

                {/* ready */}
                {phase === 'ready' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {error && (
                      <div className="max-w-md mx-auto mb-5 bg-red-500/15 border border-red-400/40 rounded-xl p-4 flex items-start gap-3 text-left">
                        <AlertTriangle size={18} className="text-red-300 flex-shrink-0 mt-0.5" />
                        <p className="text-red-100 text-sm">{error}</p>
                      </div>
                    )}
                    <button
                      onClick={handleSortear}
                      className="bg-gradient-to-r from-allways-gold to-yellow-500 text-allways-dark font-black text-lg px-10 py-4 rounded-2xl shadow-2xl hover:brightness-110 hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
                    >
                      <Sparkles size={20} />
                      {replay ? 'Revelar ganador' : 'Sortear este premio'}
                    </button>
                    <p className="text-white/30 text-xs mt-4">
                      Enter o Espacio para {replay ? 'revelar' : 'sortear'}
                    </p>
                  </motion.div>
                )}

                {/* rolling */}
                {phase === 'rolling' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <motion.div
                      key={countdown}
                      initial={{ scale: 1.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-7xl sm:text-8xl font-black text-allways-gold"
                    >
                      {countdown}
                    </motion.div>
                    <div className="bg-black/40 border-2 border-allways-gold/40 rounded-2xl py-5 px-8 inline-block min-w-[280px]">
                      <p className="text-white/40 text-xs uppercase tracking-widest mb-1">
                        {replay ? 'Revelando' : 'Sorteando'}
                      </p>
                      <p className="text-2xl sm:text-3xl font-mono font-black text-allways-gold-light tabular-nums">
                        {rolling}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* revealed */}
                {phase === 'revealed' && current && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 14 }}
                    className="space-y-6"
                  >
                    <div className="bg-allways-gold/15 border-2 border-allways-gold rounded-3xl p-6 sm:p-8 max-w-xl mx-auto">
                      <p className="text-allways-gold text-xs font-black uppercase tracking-[0.25em] mb-3 flex items-center justify-center gap-2">
                        <Trophy size={16} /> Ganador
                      </p>
                      <p className="text-3xl sm:text-5xl font-black text-white leading-tight mb-3">
                        {current.participanteNombre}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm">
                        <span className="text-allways-gold-light font-mono flex items-center gap-1.5">
                          <Ticket size={14} /> {current.numeroCupon}
                        </span>
                        {current.participanteCiudad && (
                          <span className="text-white/60 flex items-center gap-1.5">
                            <MapPin size={14} /> {current.participanteCiudad}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleSiguiente}
                      className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3.5 rounded-xl border border-white/20 transition inline-flex items-center gap-2"
                    >
                      {index + 1 >= queue.length ? 'Ver todos los ganadores' : 'Siguiente premio'}
                      <ChevronRight size={18} />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
