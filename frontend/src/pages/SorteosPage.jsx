import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import {
  Trophy,
  Gift,
  Ticket,
  CheckCircle,
  Clock,
  Calendar,
} from 'lucide-react'
import Spinner from '../components/ui/Spinner'
import useApi from '../hooks/useApi'

const MES_ICONS = {
  ABRIL: '🎯', MAYO: '🎁', JUNIO: '🎪', JULIO: '🎆',
  AGOSTO: '🌟', SEPTIEMBRE: '🏆', OCTUBRE: '🚗'
}

export default function SorteosPage() {
  const { get } = useApi()
  const [meses, setMeses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await get('/admin/sorteos')
        setMeses(data.data || [])
      } catch {
        setMeses([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [get])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  const totalPremios = meses.reduce((s, m) => s + m.TOTAL_PREMIOS, 0)
  const totalSorteados = meses.reduce((s, m) => s + m.PREMIOS_SORTEADOS, 0)
  const totalCupones = meses.reduce((s, m) => s + m.TOTAL_CUPONES, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-800">Sorteos</h2>
        <p className="text-gray-500 text-sm">Gestionar los sorteos mensuales de premios</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 text-center">
          <Gift size={20} className="mx-auto text-purple-500 mb-1" />
          <p className="text-2xl font-black text-gray-800">{totalPremios}</p>
          <p className="text-xs text-gray-500">Premios totales</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 text-center">
          <Trophy size={20} className="mx-auto text-yellow-500 mb-1" />
          <p className="text-2xl font-black text-gray-800">{totalSorteados}</p>
          <p className="text-xs text-gray-500">Ya sorteados</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 text-center">
          <Ticket size={20} className="mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-black text-gray-800">{totalCupones}</p>
          <p className="text-xs text-gray-500">Cupones totales</p>
        </div>
      </div>

      {/* Month cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {meses.map((m, i) => {
          const done = m.PREMIOS_SORTEADOS > 0
          const partial = m.PREMIOS_SORTEADOS > 0 && m.PREMIOS_SORTEADOS < m.TOTAL_PREMIOS
          return (
            <motion.div
              key={m.MES}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/admin/sorteos/${m.MES}`}
                className={`block rounded-2xl shadow-md border-2 p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                  done
                    ? 'bg-green-50 border-green-200 hover:border-green-300'
                    : 'bg-white border-gray-100 hover:border-allways-blue/30'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-2xl mr-2">{MES_ICONS[m.MES] || '🎯'}</span>
                    <h3 className="inline text-lg font-black text-gray-800">{m.MES}</h3>
                  </div>
                  {done ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                      <CheckCircle size={12} /> Sorteado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-full">
                      <Clock size={12} /> Pendiente
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/80 rounded-lg p-2">
                    <p className="text-lg font-black text-purple-600">{m.TOTAL_PREMIOS}</p>
                    <p className="text-[10px] text-gray-500">Premios</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-2">
                    <p className="text-lg font-black text-blue-600">{m.CUPONES_ELEGIBLES}</p>
                    <p className="text-[10px] text-gray-500">Elegibles</p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-2">
                    <p className="text-lg font-black text-green-600">{m.PREMIOS_SORTEADOS}</p>
                    <p className="text-[10px] text-gray-500">Ganadores</p>
                  </div>
                </div>

                {m.FECHA_SORTEO && (
                  <p className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={12} />
                    Sorteado el {new Date(m.FECHA_SORTEO).toLocaleDateString('es-PY')}
                  </p>
                )}
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
