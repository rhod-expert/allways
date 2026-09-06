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
  MapPin,
  Store,
  UserCheck,
  PlayCircle,
  FlaskConical,
  Users,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import SorteoPresentacion from '../components/admin/SorteoPresentacion'
import useApi from '../hooks/useApi'
import useAuth from '../hooks/useAuth'

export default function SorteoDetallePage() {
  const { mes } = useParams()
  const { get, post, del } = useApi()
  const { canWrite } = useAuth()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [starting, setStarting] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [presentacion, setPresentacion] = useState(null)

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

  /**
   * Open the fullscreen stage. Coupon numbers for the roulette are fetched
   * up front so no network hop can stall the animation mid-event.
   */
  const abrirPresentacion = async (modo) => {
    setConfirmModal(null)
    setStarting(true)
    try {
      const muestra = await get(`/admin/sorteos/${mes}/muestra-cupones`)
      setPresentacion({
        modo,
        // A real run only stages the prizes still pending. A rehearsal or a
        // replay walks every prize, so already-drawn ones must re-enter the
        // queue - hence the cleared CUPON_GANADOR_ID.
        premios:
          modo === 'real'
            ? data.premios
            : data.premios.map((p) => ({ ...p, CUPON_GANADOR_ID: null })),
        muestra: muestra.data?.cupones || [],
      })
    } catch {
      toast.error('No se pudo iniciar la presentacion')
    } finally {
      setStarting(false)
    }
  }

  /**
   * Draw a single prize. Called by the stage at the moment of each reveal:
   * this is the request that actually creates the winner in the database.
   */
  const handleDraw = useCallback(
    async (premioId) => {
      // A replay reads the winner already stored - it must never hit a draw
      // endpoint, otherwise re-showing the results would re-roll them.
      if (presentacion?.modo === 'replay') {
        const p = data.premios.find((x) => x.ID === premioId)
        return {
          premioId: p.ID,
          premioDescripcion: p.DESCRIPCION,
          numeroCupon: p.NUMERO_CUPON,
          participanteNombre: p.GANADOR_NOMBRE,
          participanteCedula: p.GANADOR_CEDULA,
          participanteCiudad: p.GANADOR_CIUDAD,
        }
      }

      const path = presentacion?.modo === 'simulacion' ? 'simular' : 'ejecutar'
      const result = await post(`/admin/sorteos/${mes}/premios/${premioId}/${path}`, {})
      return result.data.ganador
    },
    [post, mes, presentacion, data]
  )

  const handleReset = async () => {
    setConfirmModal(null)
    setResetting(true)
    try {
      await del(`/admin/sorteos/${mes}/reset`)
      toast.success('Sorteo reseteado')
      await fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al resetear')
    } finally {
      setResetting(false)
    }
  }

  const cerrarPresentacion = async () => {
    setPresentacion(null)
    await fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!data) return null

  const {
    premios,
    totalElegibles,
    participantesElegibles,
    participantesInsuficientes,
    sorteados,
    pendientes,
    totalPremios,
    completo,
    enProgreso,
    simulacionHabilitada,
  } = data

  const sinCupones = totalElegibles === 0

  return (
    <>
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
                {sorteados} de {totalPremios} premios sorteados &middot; {totalElegibles} cupones acumulados
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {canWrite && simulacionHabilitada && (
              <Button
                variant="ghost"
                onClick={() => setConfirmModal('simular')}
                disabled={starting || sinCupones}
                className="!text-fuchsia-700 !border !border-fuchsia-200 hover:!bg-fuchsia-50"
              >
                <FlaskConical size={16} />
                Simulacion
              </Button>
            )}

            {!canWrite ? null : completo ? (
              <Button
                variant="ghost"
                onClick={() => setConfirmModal('reset')}
                loading={resetting}
                className="!text-red-600 !border !border-red-200 hover:!bg-red-50"
              >
                <RotateCcw size={16} />
                Resetear
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => setConfirmModal('ejecutar')}
                loading={starting}
                disabled={sinCupones}
                className="!bg-gradient-to-r !from-yellow-500 !to-orange-500 hover:!from-yellow-600 hover:!to-orange-600 !text-white !font-black"
              >
                {enProgreso ? <PlayCircle size={16} /> : <Sparkles size={16} />}
                {enProgreso ? `Continuar sorteo (${pendientes} restantes)` : 'Iniciar Sorteo'}
              </Button>
            )}

            {/* Winners already drawn can be re-shown for the audience,
                reading what is stored - this never re-draws. */}
            {sorteados > 0 && (
              <Button
                variant="ghost"
                onClick={() => abrirPresentacion('replay')}
                disabled={starting}
                className="!text-gray-600 !border !border-gray-200 hover:!bg-gray-50"
              >
                <PlayCircle size={16} />
                Ver presentacion
              </Button>
            )}
          </div>
        </div>

        {/* Status banners */}
        {completo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 sm:p-6 text-white text-center"
          >
            <Trophy size={32} className="mx-auto mb-2" />
            <h3 className="text-lg font-black">Sorteo Completado</h3>
            <p className="text-sm text-white/80">{sorteados} ganadores seleccionados</p>
          </motion.div>
        )}

        {enProgreso && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 sm:p-6 text-white text-center"
          >
            <PlayCircle size={32} className="mx-auto mb-2" />
            <h3 className="text-lg font-black">Sorteo en progreso</h3>
            <p className="text-sm text-white/80">
              {sorteados} de {totalPremios} premios ya tienen ganador. Podes continuar desde el premio {sorteados + 1}.
            </p>
          </motion.div>
        )}

        {participantesInsuficientes && !completo && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5 flex items-start gap-3">
            <Users size={22} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-orange-800 text-sm">Participantes insuficientes</h3>
              <p className="text-xs text-orange-700 mt-1">
                Quedan <strong>{pendientes} premios</strong> por sortear pero solo{' '}
                <strong>{participantesElegibles} participantes distintos</strong> elegibles.
                Cada participante puede ganar un solo premio por mes, asi que el sorteo se
                detendra antes de completar todos los premios.
              </p>
            </div>
          </div>
        )}

        {sinCupones && !completo && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 text-center">
            <AlertTriangle size={32} className="mx-auto text-yellow-500 mb-2" />
            <h3 className="font-bold text-yellow-800">Sin cupones elegibles</h3>
            <p className="text-sm text-yellow-600 mt-1">
              No hay cupones para el mes de {mes}. Los cupones se generan al aceptar registros.
            </p>
          </div>
        )}

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
                  p.CUPON_GANADOR_ID ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'
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
                        {p.GANADOR_CIUDAD && (
                          <p className="text-xs text-green-700 flex items-center gap-1.5">
                            <MapPin size={12} /> {p.GANADOR_CIUDAD}
                          </p>
                        )}
                        {p.GANADOR_TIENDA && (
                          <p className="text-xs text-green-700 flex items-center gap-1.5">
                            <Store size={12} /> {p.GANADOR_TIENDA}
                          </p>
                        )}
                        {p.GANADOR_VENDEDOR && (
                          <p className="text-xs text-green-700 flex items-center gap-1.5">
                            <UserCheck size={12} /> {p.GANADOR_VENDEDOR}
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

        {/* Confirm: start / resume the live draw */}
        <Modal
          isOpen={confirmModal === 'ejecutar'}
          onClose={() => setConfirmModal(null)}
          title={enProgreso ? 'Continuar Sorteo' : 'Iniciar Sorteo'}
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800">
                Se abrira la <strong>presentacion en pantalla completa</strong>. Cada premio se
                sortea individualmente en el momento de su revelacion, entre{' '}
                <strong>{totalElegibles} cupones acumulados</strong> de{' '}
                <strong>{participantesElegibles} participantes</strong>.
              </p>
              <p className="text-xs text-yellow-600 mt-2">
                Cada resultado se guarda apenas se revela y <strong>no se puede deshacer
                individualmente</strong>. Si necesitas rehacer el sorteo, hay que resetear el mes completo.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setConfirmModal(null)} className="!text-gray-600">
                Cancelar
              </Button>
              <Button
                onClick={() => abrirPresentacion('real')}
                className="!bg-gradient-to-r !from-yellow-500 !to-orange-500 !text-white !font-bold"
              >
                <Sparkles size={16} />
                {enProgreso ? 'Continuar' : 'Iniciar'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Confirm: rehearsal */}
        <Modal
          isOpen={confirmModal === 'simular'}
          onClose={() => setConfirmModal(null)}
          title="Modo Simulacion"
        >
          <div className="space-y-4">
            <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-4">
              <p className="text-sm text-fuchsia-900">
                Ensayo de la presentacion. Se sortea con la misma logica del sorteo real, pero{' '}
                <strong>no se guarda ningun ganador</strong>.
              </p>
              <p className="text-xs text-fuchsia-700 mt-2">
                Se recorren los {totalPremios} premios del mes.
                {sorteados > 0 && (
                  <> Como este mes ya tiene ganadores reales, esos cupones estan fuera del sorteo,
                  asi que la simulacion mostrara personas distintas.</>
                )}
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setConfirmModal(null)} className="!text-gray-600">
                Cancelar
              </Button>
              <Button
                onClick={() => abrirPresentacion('simulacion')}
                className="!bg-fuchsia-600 hover:!bg-fuchsia-700 !text-white !font-bold"
              >
                <FlaskConical size={16} />
                Iniciar simulacion
              </Button>
            </div>
          </div>
        </Modal>

        {/* Confirm: reset */}
        <Modal
          isOpen={confirmModal === 'reset'}
          onClose={() => setConfirmModal(null)}
          title="Resetear Sorteo"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800">
                Se eliminaran <strong>todos</strong> los ganadores del mes de <strong>{mes}</strong>.
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

      <AnimatePresence>
        {presentacion && (
          <SorteoPresentacion
            mes={mes}
            premios={presentacion.premios}
            muestraCupones={presentacion.muestra}
            modo={presentacion.modo}
            onDraw={handleDraw}
            onClose={cerrarPresentacion}
            onFinish={fetchData}
          />
        )}
      </AnimatePresence>
    </>
  )
}
