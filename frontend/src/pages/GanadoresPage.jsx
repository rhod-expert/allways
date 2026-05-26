import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { Trophy, MapPin, ArrowLeft, Sparkles } from 'lucide-react'
import api from '../services/api'
import Spinner from '../components/ui/Spinner'

const MES_ORDER = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
]

function resolvePrizeImage(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  if (path.startsWith('/allways/')) return path
  if (path.startsWith('/')) return '/allways' + path
  return '/allways/' + path
}

function formatFecha(iso) {
  if (!iso) return null
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('es-PY', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return null
  }
}

export default function GanadoresPage() {
  const { mes } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const mesUpper = String(mes || '').toUpperCase()
    if (!MES_ORDER.includes(mesUpper)) {
      setError('Mes invalido.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    api.get(`/ganadores/${mesUpper}`)
      .then((res) => {
        setData(res.data?.data || null)
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'No se pudieron cargar los ganadores.')
      })
      .finally(() => setLoading(false))
  }, [mes])

  return (
    <section className="py-16 sm:py-20 bg-dark-section min-h-[70vh]">
      <div className="max-w-6xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-allways-gold-light hover:text-allways-gold text-sm font-semibold mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Volver
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <p className="text-allways-gold text-sm font-bold uppercase tracking-[0.2em] mb-2 inline-flex items-center gap-2 justify-center">
            <Sparkles size={14} /> Sorteo realizado
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase">
            Ganadores de <span className="text-gold-gradient">{data?.mesLabel || mes}</span>
          </h2>
          {data?.ganadores?.length > 0 && data.ganadores[0].fechaSorteo && (
            <p className="text-gray-400 mt-3 text-sm">
              Sorteo realizado el {formatFecha(data.ganadores[0].fechaSorteo)}
            </p>
          )}
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="glass-card-gold p-8 text-center max-w-md mx-auto">
            <p className="text-white font-semibold mb-2">{error}</p>
            <Link to="/" className="text-allways-gold-light hover:text-allways-gold text-sm underline">
              Volver al inicio
            </Link>
          </div>
        ) : !data?.ganadores?.length ? (
          <div className="glass-card-gold p-8 text-center max-w-md mx-auto">
            <Trophy size={40} className="mx-auto text-allways-gold mb-3" />
            <p className="text-white font-semibold mb-1">Sorteo aun no realizado</p>
            <p className="text-gray-400 text-sm mb-4">
              El sorteo de {data?.mesLabel || mes} todavia no fue ejecutado. Aun estas a tiempo de participar!
            </p>
            <Link
              to="/participar"
              className="inline-flex items-center gap-2 bg-allways-gold text-allways-dark font-bold px-5 py-2.5 rounded-xl hover:brightness-110 transition"
            >
              Participar ahora
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {data.ganadores.map((g, i) => (
              <motion.div
                key={g.premioId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card-gold p-5 flex flex-col"
              >
                {g.premioImagen && (
                  <div className="w-full aspect-square flex items-center justify-center p-3 mb-3 bg-white/5 rounded-2xl">
                    <img
                      src={resolvePrizeImage(g.premioImagen)}
                      alt={g.premio}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                )}
                <h3 className="text-white font-bold text-lg leading-tight mb-3 text-center">
                  {g.premio}
                </h3>
                <div className="bg-allways-gold/15 border border-allways-gold/40 rounded-xl p-4 mt-auto">
                  <p className="text-allways-gold text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Trophy size={14} /> Ganador
                  </p>
                  <p className="text-white font-semibold leading-tight mb-1.5">
                    {g.ganador}
                  </p>
                  {(g.ciudad || g.departamento) && (
                    <p className="text-gray-300 text-xs flex items-center gap-1.5">
                      <MapPin size={12} />
                      {[g.ciudad, g.departamento].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
