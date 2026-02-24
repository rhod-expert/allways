import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Package,
  Calendar,
  CheckCircle,
  XCircle,
  X,
  ZoomIn,
} from 'lucide-react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import useApi from '../hooks/useApi'

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { get, put, loading } = useApi()

  const [registration, setRegistration] = useState(null)
  const [history, setHistory] = useState([])
  const [pageLoading, setPageLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [zoomImage, setZoomImage] = useState(null)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await get(`/admin/registros/${id}`)
        setRegistration(data.data || data)
        setHistory([])
      } catch {
        toast.error('No se pudo cargar el registro')
        navigate('/admin/registros', { replace: true })
      } finally {
        setPageLoading(false)
      }
    }
    fetchDetail()
  }, [id, get, navigate])

  const handleAccept = async () => {
    setActionLoading(true)
    try {
      await put(`/admin/registros/${id}/validar`, { accion: 'ACEPTAR' })
      setRegistration((prev) => ({ ...prev, ESTADO: 'ACEPTADO' }))
      toast.success('Registro aceptado correctamente')
    } catch {
      toast.error('Error al aceptar el registro')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Debes ingresar un motivo de rechazo')
      return
    }
    setActionLoading(true)
    try {
      await put(`/admin/registros/${id}/validar`, {
        accion: 'RECHAZAR',
        motivo: rejectReason.trim(),
      })
      setRegistration((prev) => ({ ...prev, ESTADO: 'RECHAZADO', MOTIVO_RECHAZO: rejectReason.trim() }))
      setRejectModalOpen(false)
      setRejectReason('')
      toast.success('Registro rechazado')
    } catch {
      toast.error('Error al rechazar el registro')
    } finally {
      setActionLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!registration) return null

  const imageBase = '/allways/api'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/registros"
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-500" />
          </Link>
          <div>
            <h2 className="text-2xl font-black text-gray-800">Registro #{registration.ID}</h2>
            <p className="text-gray-500 text-sm">Detalle del registro de factura</p>
          </div>
        </div>
        <Badge status={registration.ESTADO || 'PENDIENTE'} className="text-sm !px-4 !py-1.5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: data */}
        <div className="lg:col-span-1 space-y-6">
          {/* Participant data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
          >
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Datos del Participante</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Nombre</p>
                  <p className="font-semibold text-gray-800">{registration.NOMBRE}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Cedula</p>
                  <p className="font-mono font-semibold text-gray-800">{registration.CEDULA}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Telefono</p>
                  <p className="font-semibold text-gray-800">{registration.TELEFONO}</p>
                </div>
              </div>
              {registration.EMAIL && (
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm text-gray-800">{registration.EMAIL}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Ubicacion</p>
                  <p className="text-sm text-gray-800">{registration.CIUDAD}, {registration.DEPARTAMENTO}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Registration data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
          >
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Datos de la Factura</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Numero de factura</p>
                  <p className="font-mono font-semibold text-gray-800">{registration.NUMERO_FACTURA}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Package size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Cantidad de productos</p>
                  <p className="font-bold text-2xl text-allways-blue">{registration.CANTIDAD_PRODUCTOS}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Fecha de registro</p>
                  <p className="text-sm text-gray-800">
                    {registration.FECHA_REGISTRO
                      ? new Date(registration.FECHA_REGISTRO).toLocaleString('es-PY')
                      : '-'}
                  </p>
                </div>
              </div>
              {registration.MOTIVO_RECHAZO && (
                <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-xs text-red-400 font-semibold mb-1">Motivo de rechazo:</p>
                  <p className="text-sm text-red-700">{registration.MOTIVO_RECHAZO}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Action buttons */}
          {registration.ESTADO === 'PENDIENTE' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
            >
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Acciones</h3>
              <div className="flex gap-3">
                <Button
                  variant="green"
                  onClick={handleAccept}
                  loading={actionLoading}
                  className="flex-1"
                >
                  <CheckCircle size={18} />
                  ACEPTAR
                </Button>
                <Button
                  variant="red"
                  onClick={() => setRejectModalOpen(true)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  <XCircle size={18} />
                  RECHAZAR
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right column: images */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
          >
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Foto de la Factura</h3>
            {registration.IMAGEN_FACTURA ? (
              <div
                className="relative group cursor-pointer rounded-xl overflow-hidden bg-gray-100"
                onClick={() => setZoomImage(`${imageBase}/uploads/facturas/${registration.IMAGEN_FACTURA}`)}
              >
                <img
                  src={`${imageBase}/uploads/facturas/${registration.IMAGEN_FACTURA}`}
                  alt="Factura"
                  className="w-full max-h-[500px] object-contain"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ) : (
              <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                <p className="text-gray-400">Sin imagen</p>
              </div>
            )}
          </motion.div>

          {/* Product image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
          >
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Foto de los Productos</h3>
            {registration.IMAGEN_PRODUCTOS ? (
              <div
                className="relative group cursor-pointer rounded-xl overflow-hidden bg-gray-100"
                onClick={() => setZoomImage(`${imageBase}/uploads/productos/${registration.IMAGEN_PRODUCTOS}`)}
              >
                <img
                  src={`${imageBase}/uploads/productos/${registration.IMAGEN_PRODUCTOS}`}
                  alt="Productos"
                  className="w-full max-h-[500px] object-contain"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ) : (
              <div className="h-32 bg-gray-100 rounded-xl flex items-center justify-center">
                <p className="text-gray-400">No se adjunto foto de productos</p>
              </div>
            )}
          </motion.div>

          {/* History */}
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
            >
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Otros registros del participante
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">ID</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Factura</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Cant.</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Estado</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.ID} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-3">
                          <Link
                            to={`/admin/registros/${h.ID}`}
                            className="text-allways-blue hover:underline font-mono text-xs"
                          >
                            #{h.ID}
                          </Link>
                        </td>
                        <td className="py-2 px-3 text-gray-600 text-xs">{h.NUMERO_FACTURA}</td>
                        <td className="py-2 px-3 text-center font-bold text-gray-700">{h.CANTIDAD_PRODUCTOS}</td>
                        <td className="py-2 px-3 text-center">
                          <Badge status={h.ESTADO || 'PENDIENTE'} />
                        </td>
                        <td className="py-2 px-3 text-gray-400 text-xs">
                          {h.FECHA_REGISTRO ? new Date(h.FECHA_REGISTRO).toLocaleDateString('es-PY') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Reject modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => { setRejectModalOpen(false); setRejectReason('') }}
        title="Rechazar Registro"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Ingresa el motivo del rechazo. Este sera visible para consultas internas.
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Motivo de rechazo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ej: Factura ilegible, producto no participante..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-red-400 text-gray-800 resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => { setRejectModalOpen(false); setRejectReason('') }}
              className="!text-gray-600"
            >
              Cancelar
            </Button>
            <Button
              variant="red"
              onClick={handleReject}
              loading={actionLoading}
            >
              Confirmar Rechazo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Zoom image modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            onClick={() => setZoomImage(null)}
          >
            <X size={24} className="text-white" />
          </button>
          <img
            src={zoomImage}
            alt="Imagen ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  )
}
