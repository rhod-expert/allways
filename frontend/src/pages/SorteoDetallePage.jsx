import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import {
  ArrowLeft,
  Trophy,
  Gift,
  Ticket,
  User,
  Phone,
  Hash,
  Sparkles,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import useApi from '../hooks/useApi'

export default function SorteoDetallePage() {
  const { mes } = useParams()
  const { get, post, del } = useApi()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [animating, setAnimating] = useState(false)
  const [revealedPrizes, setRevealedPrizes] = useState([])

  const fetchData = useCallback(async () => {
    try {
      const result = await get(`/admin/sorteos/${mes}`)
      setData(result.data)
    } catch {
      toast.error('No se pudo cargar el sorteo')
    } finally {
      setLoading(false)
    }
  }, [get, mes])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleEjecutar = async () => {
    setConfirmModal(null)
    setExecuting(true)
    setAnimating(true)
    setRevealedPrizes([])

    try {
      const result = await post(`/admin/sorteos/${mes}/ejecutar`)
      toast.success(result.message || 'Sorteo realizado exitosamente')

      // Animate prize reveals one by one
      const ganadores = result.data?.ganadores || []
      for (let i = 0; i < ganadores.length; i++) {
        await new Promise((r) => setTimeout(r, 800))
        setRevealedPrizes((prev) => [...prev, ganadores[i]])
      }

      await new Promise((r) => setTimeout(r, 500))
      await fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al ejecutar el sorteo')
    } finally {
      setExecuting(false)
      setAnimating(false)
    }
  }

  const handleReset = async () => {
    setConfirmModal(null)
    setResetting(true)
    try {
      await del(`/admin/sorteos/${mes}/reset`)
      toast.success('Sorteo reseteado')
      setRevealedPrizes([])
      await fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al resetear')
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!data) return null

  const { premios, totalElegibles, sorteado } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/sorteos"
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-500" />
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-800">Sorteo de {mes}</h2>
            <p className="text-gray-500 text-sm">
              {premios.length} premio{premios.length !== 1 ? 's' : ''} &middot; {totalElegibles} cupones elegibles
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {sorteado ? (
            <Button
              variant="ghost"
              onClick={() => setConfirmModal('reset')}
              loading={resetting}
              className="!text-red-600 !border-red-200 hover:!bg-red-50"
            >
              <RotateCcw size={16} />
              Resetear
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => setConfirmModal('ejecutar')}
              loading={executing}
              disabled={totalElegibles === 0}
              className="!bg-gradient-to-r !from-yellow-500 !to-orange-500 hover:!from-yellow-600 hover:!to-orange-600 !text-white !font-black"
            >
              <Sparkles size={16} />
              Realizar Sorteo
            </Button>
          )}
        </div>
      </div>

      {/* Status banner */}
      {sorteado && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 sm:p-6 text-white text-center"
        >
          <Trophy size={32} className="mx-auto mb-2" />
          <h3 className="text-lg font-black">Sorteo Realizado</h3>
          <p className="text-sm text-white/80">
            {premios.filter(p => p.CUPON_GANADOR_ID).length} ganadores seleccionados
          </p>
        </motion.div>
      )}

      {totalElegibles === 0 && !sorteado && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 text-center">
          <AlertTriangle size={32} className="mx-auto text-yellow-500 mb-2" />
          <h3 className="font-bold text-yellow-800">Sin cupones elegibles</h3>
          <p className="text-sm text-yellow-600 mt-1">
            No hay cupones para el mes de {mes}. Los cupones se generan al aceptar registros.
          </p>
        </div>
      )}

      {/* Animation overlay during draw */}
      <AnimatePresence>
        {animating && revealedPrizes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-gradient-to-br from-allways-dark to-allways-blue/90 rounded-2xl p-6 space-y-3"
          >
            <h3 className="text-white font-black text-center text-lg mb-4 flex items-center justify-center gap-2">
              <Sparkles className="text-yellow-400" size={20} />
              Resultados del Sorteo
            </h3>
            {revealedPrizes.map((g, i) => (
              <motion.div
                key={g.premioId}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                  <Trophy size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-bold text-sm truncate">{g.premioDescripcion}</p>
                  <p className="text-yellow-300 text-xs font-mono">{g.numeroCupon}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-semibold text-sm">{g.participanteNombre}</p>
                  <p className="text-white/60 text-xs">CI: {g.participanteCedula}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prizes grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Premios del mes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {premios.map((p, i) => (
            <motion.div
              key={p.ID}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl shadow-md border-2 overflow-hidden transition-colors ${
                p.CUPON_GANADOR_ID
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-100'
              }`}
            >
              {/* Prize image */}
              <div className="h-36 sm:h-44 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center p-4">
                <img
                  src={`/allways${p.IMAGEN}`}
                  alt={p.DESCRIPCION}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
              </div>

              {/* Prize info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="font-bold text-gray-800 text-sm leading-tight">{p.DESCRIPCION}</h4>
                  <Gift size={16} className={p.CUPON_GANADOR_ID ? 'text-green-500' : 'text-gray-300'} />
                </div>

                {p.CUPON_GANADOR_ID ? (
                  <div className="bg-green-100 rounded-xl p-3 space-y-1.5">
                    <p className="text-xs font-bold text-green-800 flex items-center gap-1">
                      <Trophy size={12} /> GANADOR
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-green-900 flex items-center gap-1.5">
                        <User size={13} /> {p.GANADOR_NOMBRE}
                      </p>
                      <p className="text-xs text-green-700 flex items-center gap-1.5">
                        <Hash size={12} /> CI: {p.GANADOR_CEDULA}
                      </p>
                      {p.GANADOR_TELEFONO && (
                        <p className="text-xs text-green-700 flex items-center gap-1.5">
                          <Phone size={12} /> {p.GANADOR_TELEFONO}
                        </p>
                      )}
                      <p className="text-xs text-green-600 flex items-center gap-1.5 font-mono">
                        <Ticket size={12} /> {p.NUMERO_CUPON}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 font-semibold">Pendiente de sorteo</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Confirm modal */}
      <Modal
        isOpen={confirmModal === 'ejecutar'}
        onClose={() => setConfirmModal(null)}
        title="Confirmar Sorteo"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              Se seleccionaran <strong>{premios.length} ganadores</strong> aleatoriamente
              entre <strong>{totalElegibles} cupones elegibles</strong> para el mes de <strong>{mes}</strong>.
            </p>
            <p className="text-xs text-yellow-600 mt-2">
              Cada participante puede ganar maximo un premio por mes.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setConfirmModal(null)} className="!text-gray-600">
              Cancelar
            </Button>
            <Button
              onClick={handleEjecutar}
              className="!bg-gradient-to-r !from-yellow-500 !to-orange-500 !text-white !font-bold"
            >
              <Sparkles size={16} />
              Realizar Sorteo
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={confirmModal === 'reset'}
        onClose={() => setConfirmModal(null)}
        title="Resetear Sorteo"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800">
              Se eliminaran todos los ganadores del mes de <strong>{mes}</strong>.
              Los cupones volveran a estar disponibles para un nuevo sorteo.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setConfirmModal(null)} className="!text-gray-600">
              Cancelar
            </Button>
            <Button variant="red" onClick={handleReset}>
              <RotateCcw size={16} />
              Confirmar Reset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
