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
  Map,
  Home,
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
  const token = localStorage.getItem('allways_token')
  const authQuery = token ? `?token=${token}` : ''

  const facturaUrl = registration.IMAGEN_FACTURA
    ? `${imageBase}/uploads/facturas/${registration.IMAGEN_FACTURA}${authQuery}`
    : null
  const productosUrl = registration.IMAGEN_PRODUCTOS
    ? `${imageBase}/uploads/productos/${registration.IMAGEN_PRODUCTOS}${authQuery}`
    : null

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            to="/admin/registros"
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} className="text-gray-500" />
          </Link>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-black text-gray-800 truncate">Registro #{registration.ID}</h2>
            <p className="text-gray-500 text-xs sm:text-sm hidden sm:block">Detalle del registro de factura</p>
          </div>
        </div>
        <Badge status={registration.ESTADO || 'PENDIENTE'} className="text-xs sm:text-sm !px-3 sm:!px-4 !py-1 sm:!py-1.5 flex-shrink-0" />
      </div>

      {/* Mobile: action buttons sticky at top */}
      {registration.ESTADO === 'PENDIENTE' && (
        <div className="lg:hidden bg-white rounded-2xl shadow-md p-4 border border-gray-100 sticky top-0 z-10">
          <div className="flex gap-3">
            <Button
              variant="green"
              onClick={handleAccept}
              loading={actionLoading}
              className="flex-1 !py-3"
            >
              <CheckCircle size={18} />
              ACEPTAR
            </Button>
            <Button
              variant="red"
              onClick={() => setRejectModalOpen(true)}
              disabled={actionLoading}
              className="flex-1 !py-3"
            >
              <XCircle size={18} />
              RECHAZAR
            </Button>
          </div>
        </div>
      )}

      {/* Main grid: on mobile show images first, then data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left column: data - shown second on mobile, first on desktop */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6 order-2 lg:order-1">
          {/* Participant data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-md p-4 sm:p-6 border border-gray-100"
          >
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 sm:mb-4">Datos del Participante</h3>
            <div className="space-y-3">
              <InfoRow icon={User} label="Nombre" value={registration.NOMBRE} />
              <InfoRow icon={FileText} label="Cedula" value={registration.CEDULA} mono />
              <InfoRow icon={Phone} label="Telefono" value={registration.TELEFONO} />
              {registration.EMAIL && (
                <InfoRow icon={Mail} label="Email" value={registration.EMAIL} small />
              )}
              <InfoRow icon={MapPin} label="Ubicacion" value={buildLocationString(registration)} small />
              {(registration.CALLE || registration.NUMERO_CASA) && (
                <InfoRow icon={MapPin} label="Direccion" value={buildAddressString(registration)} small />
              )}
            </div>
          </motion.div>

          {/* Location detail + map */}
          {buildMapsQuery(registration) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl shadow-md p-4 sm:p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Map size={14} /> Ubicacion detallada
                </h3>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(buildMapsQuery(registration))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-allways-blue hover:underline"
                >
                  Abrir en Maps
                </a>
              </div>
              <div className="space-y-2 mb-3 text-xs">
                {registration.GEO_DEPARTAMENTO && (
                  <p className="text-gray-600"><span className="text-gray-400">Departamento:</span> {registration.GEO_DEPARTAMENTO}</p>
                )}
                {registration.GEO_DISTRITO && (
                  <p className="text-gray-600"><span className="text-gray-400">Distrito:</span> {registration.GEO_DISTRITO}</p>
                )}
                {registration.GEO_CIUDAD && (
                  <p className="text-gray-600"><span className="text-gray-400">Ciudad:</span> {registration.GEO_CIUDAD}</p>
                )}
                {registration.GEO_BARRIO && (
                  <p className="text-gray-600"><span className="text-gray-400">Barrio:</span> {registration.GEO_BARRIO}</p>
                )}
                {(registration.CALLE || registration.NUMERO_CASA) && (
                  <p className="text-gray-600"><span className="text-gray-400">Direccion:</span> {buildAddressString(registration)}</p>
                )}
              </div>
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(buildMapsQuery(registration))}&output=embed`}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicacion"
                />
              </div>
            </motion.div>
          )}

          {/* Registration data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-md p-4 sm:p-6 border border-gray-100"
          >
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 sm:mb-4">Datos de la Factura</h3>
            <div className="space-y-3">
              <InfoRow icon={FileText} label="Numero de factura" value={registration.NUMERO_FACTURA} mono />
              <div className="flex items-center gap-3">
                <Package size={16} className="text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Cantidad de productos</p>
                  <p className="font-bold text-xl sm:text-2xl text-allways-blue">{registration.CANTIDAD_PRODUCTOS}</p>
                </div>
              </div>
              <InfoRow
                icon={Calendar}
                label="Fecha de registro"
                value={registration.FECHA_REGISTRO
                  ? new Date(registration.FECHA_REGISTRO).toLocaleString('es-PY')
                  : '-'}
                small
              />
              {registration.MOTIVO_RECHAZO && (
                <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-xs text-red-400 font-semibold mb-1">Motivo de rechazo:</p>
                  <p className="text-sm text-red-700">{registration.MOTIVO_RECHAZO}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Desktop: action buttons */}
          {registration.ESTADO === 'PENDIENTE' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden lg:block bg-white rounded-2xl shadow-md p-6 border border-gray-100"
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

        {/* Right column: images - shown first on mobile */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-1 lg:order-2">
          {/* Invoice image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-md p-4 sm:p-6 border border-gray-100"
          >
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 sm:mb-4">Foto de la Factura</h3>
            {facturaUrl ? (
              <div
                className="relative group cursor-pointer rounded-xl overflow-hidden bg-gray-100"
                onClick={() => setZoomImage(facturaUrl)}
              >
                <img
                  src={facturaUrl}
                  alt="Factura"
                  className="w-full max-h-[300px] sm:max-h-[500px] object-contain"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {/* Mobile tap hint */}
                <div className="absolute bottom-2 right-2 lg:hidden bg-black/60 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                  <ZoomIn size={12} />
                  Tocar para ampliar
                </div>
              </div>
            ) : (
              <div className="h-32 sm:h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                <p className="text-gray-400">Sin imagen</p>
              </div>
            )}
          </motion.div>

          {/* Product image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-md p-4 sm:p-6 border border-gray-100"
          >
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 sm:mb-4">Foto de los Productos</h3>
            {productosUrl ? (
              <div
                className="relative group cursor-pointer rounded-xl overflow-hidden bg-gray-100"
                onClick={() => setZoomImage(productosUrl)}
              >
                <img
                  src={productosUrl}
                  alt="Productos"
                  className="w-full max-h-[300px] sm:max-h-[500px] object-contain"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-2 right-2 lg:hidden bg-black/60 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                  <ZoomIn size={12} />
                  Tocar para ampliar
                </div>
              </div>
            ) : (
              <div className="h-24 sm:h-32 bg-gray-100 rounded-xl flex items-center justify-center">
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
              className="bg-white rounded-2xl shadow-md p-4 sm:p-6 border border-gray-100"
            >
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Otros registros del participante
              </h3>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-sm min-w-[400px]">
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

      {/* Zoom image modal - touch-friendly fullscreen */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center cursor-pointer touch-manipulation"
          onClick={() => setZoomImage(null)}
        >
          <button
            className="absolute top-4 right-4 z-10 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            onClick={() => setZoomImage(null)}
          >
            <X size={24} className="text-white" />
          </button>
          <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-auto">
            <img
              src={zoomImage}
              alt="Imagen ampliada"
              className="max-w-full max-h-[90vh] object-contain rounded-lg select-none"
              onClick={(e) => e.stopPropagation()}
              style={{ touchAction: 'pinch-zoom' }}
            />
          </div>
          <p className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-xs lg:hidden">
            Pellizcar para hacer zoom - Tocar fuera para cerrar
          </p>
        </div>
      )}
    </div>
  )
}

function buildMapsQuery(reg) {
  const parts = []
  if (reg.CALLE) {
    let addr = reg.CALLE
    if (reg.NUMERO_CASA) addr += ' ' + reg.NUMERO_CASA
    parts.push(addr)
  }
  if (reg.GEO_BARRIO) parts.push(reg.GEO_BARRIO)
  if (reg.GEO_CIUDAD) parts.push(reg.GEO_CIUDAD)
  else if (reg.CIUDAD) parts.push(reg.CIUDAD)
  if (reg.GEO_DISTRITO) parts.push(reg.GEO_DISTRITO)
  if (reg.GEO_DEPARTAMENTO) parts.push(reg.GEO_DEPARTAMENTO)
  else if (reg.DEPARTAMENTO) parts.push(reg.DEPARTAMENTO)
  parts.push('Paraguay')
  return parts.length > 1 ? parts.join(', ') : ''
}

function buildAddressString(reg) {
  const parts = []
  if (reg.CALLE) parts.push(reg.CALLE)
  if (reg.NUMERO_CASA) parts.push('N° ' + reg.NUMERO_CASA)
  if (reg.COMPLEMENTO) parts.push('(' + reg.COMPLEMENTO + ')')
  return parts.join(' ') || '-'
}

function buildLocationString(reg) {
  // Prefer geo-resolved names, fallback to text fields
  const parts = []
  if (reg.GEO_BARRIO) parts.push(reg.GEO_BARRIO)
  if (reg.GEO_CIUDAD) parts.push(reg.GEO_CIUDAD)
  else if (reg.CIUDAD) parts.push(reg.CIUDAD)
  if (reg.GEO_DISTRITO) parts.push(reg.GEO_DISTRITO)
  if (reg.GEO_DEPARTAMENTO) parts.push(reg.GEO_DEPARTAMENTO)
  else if (reg.DEPARTAMENTO) parts.push(reg.DEPARTAMENTO)
  return parts.join(', ') || '-'
}

function InfoRow({ icon: Icon, label, value, mono, small }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="text-gray-400 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-gray-800 truncate ${mono ? 'font-mono font-semibold' : small ? 'text-sm' : 'font-semibold'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
