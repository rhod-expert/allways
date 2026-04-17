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
  Home,
  FileText,
  Package,
  Ticket,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Map,
} from 'lucide-react'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import useApi from '../hooks/useApi'

export default function ParticipanteDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { get } = useApi()

  const [participant, setParticipant] = useState(null)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await get(`/admin/participantes/${id}`)
        setParticipant(data.data || data)
      } catch {
        toast.error('No se pudo cargar el participante')
        navigate('/admin/clientes', { replace: true })
      } finally {
        setPageLoading(false)
      }
    }
    fetchDetail()
  }, [id, get, navigate])

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!participant) return null

  const location = buildLocationString(participant)
  const address = buildAddressString(participant)
  const mapsQuery = buildMapsQuery(participant)
  const mapsEmbedUrl = mapsQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}&output=embed`
    : null

  const registros = participant.registros || []
  const totalCupones = registros.reduce((sum, r) => sum + (r.cupones?.length || 0), 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to="/admin/clientes"
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-black text-gray-800 truncate">{participant.NOMBRE}</h2>
          <p className="text-gray-500 text-xs sm:text-sm">CI: {participant.CEDULA}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={FileText} label="Registros" value={registros.length} color="blue" />
        <StatCard icon={Ticket} label="Cupones" value={totalCupones} color="green" />
        <StatCard icon={Calendar} label="Desde" value={participant.FECHA_REGISTRO ? new Date(participant.FECHA_REGISTRO).toLocaleDateString('es-PY') : '-'} color="gray" small />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Personal data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-md p-4 sm:p-6 border border-gray-100"
        >
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Datos Personales</h3>
          <div className="space-y-3">
            <InfoRow icon={User} label="Nombre completo" value={participant.NOMBRE} />
            <InfoRow icon={FileText} label="Cedula de identidad" value={participant.CEDULA} mono />
            <InfoRow icon={Phone} label="Telefono" value={participant.TELEFONO} />
            {participant.EMAIL && (
              <InfoRow icon={Mail} label="Email" value={participant.EMAIL} />
            )}
          </div>
        </motion.div>

        {/* Location data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-md p-4 sm:p-6 border border-gray-100"
        >
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Ubicacion</h3>
          <div className="space-y-3">
            {participant.GEO_DEPARTAMENTO && (
              <InfoRow icon={MapPin} label="Departamento" value={participant.GEO_DEPARTAMENTO} />
            )}
            {participant.GEO_DISTRITO && (
              <InfoRow icon={MapPin} label="Distrito" value={participant.GEO_DISTRITO} />
            )}
            {participant.GEO_CIUDAD && (
              <InfoRow icon={MapPin} label="Ciudad" value={participant.GEO_CIUDAD} />
            )}
            {participant.GEO_BARRIO && (
              <InfoRow icon={MapPin} label="Barrio" value={participant.GEO_BARRIO} />
            )}
            {address && (
              <InfoRow icon={Home} label="Direccion" value={address} />
            )}
            {!participant.GEO_DEPARTAMENTO && !participant.GEO_CIUDAD && (
              <InfoRow icon={MapPin} label="Ubicacion" value={location} />
            )}
          </div>
        </motion.div>
      </div>

      {/* Google Maps */}
      {mapsEmbedUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-md p-4 sm:p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Map size={16} />
              Mapa
            </h3>
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(mapsQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-allways-blue hover:underline"
            >
              Abrir en Google Maps
            </a>
          </div>
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <iframe
              src={mapsEmbedUrl}
              width="100%"
              height="350"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicacion del participante"
            />
          </div>
        </motion.div>
      )}

      {/* Registrations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-md p-4 sm:p-6 border border-gray-100"
      >
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          Registros ({registros.length})
        </h3>
        {registros.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Sin registros</p>
        ) : (
          <div className="space-y-4">
            {registros.map((reg) => (
              <div
                key={reg.ID}
                className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <Link
                      to={`/admin/registros/${reg.ID}`}
                      className="text-allways-blue hover:underline font-bold text-sm"
                    >
                      Registro #{reg.ID}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {reg.FECHA_REGISTRO ? new Date(reg.FECHA_REGISTRO).toLocaleString('es-PY') : '-'}
                    </p>
                  </div>
                  <Badge status={reg.ESTADO || 'PENDIENTE'} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400">Factura</p>
                    <p className="font-mono font-semibold text-gray-700">{reg.NUMERO_FACTURA}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Productos</p>
                    <p className="font-bold text-gray-700">{reg.CANTIDAD_PRODUCTOS}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Estado</p>
                    <p className="font-semibold text-gray-700 flex items-center gap-1">
                      {reg.ESTADO === 'ACEPTADO' && <CheckCircle size={12} className="text-green-500" />}
                      {reg.ESTADO === 'RECHAZADO' && <XCircle size={12} className="text-red-500" />}
                      {reg.ESTADO === 'PENDIENTE' && <Clock size={12} className="text-yellow-500" />}
                      {reg.ESTADO}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Cupones</p>
                    <p className="font-bold text-green-700">{reg.cupones?.length || 0}</p>
                  </div>
                </div>

                {/* Coupons list */}
                {reg.cupones && reg.cupones.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1.5">Cupones generados:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {reg.cupones.map((c) => (
                        <span
                          key={c.ID || c.NUMERO_CUPON}
                          className={`inline-block text-xs font-mono px-2 py-0.5 rounded-lg ${
                            c.GANADOR === 'S'
                              ? 'bg-yellow-100 text-yellow-800 font-bold'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {c.NUMERO_CUPON}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection reason */}
                {reg.MOTIVO_RECHAZO && (
                  <div className="mt-3 p-2.5 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs text-red-600">
                      <span className="font-semibold">Motivo:</span> {reg.MOTIVO_RECHAZO}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, small }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    gray: 'bg-gray-50 text-gray-700',
  }
  return (
    <div className={`rounded-xl p-3 sm:p-4 ${colors[color]}`}>
      <Icon size={18} className="mb-1 opacity-60" />
      <p className={`font-black ${small ? 'text-sm' : 'text-xl sm:text-2xl'}`}>{value}</p>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  )
}

function buildAddressString(p) {
  const parts = []
  if (p.CALLE) parts.push(p.CALLE)
  if (p.NUMERO_CASA) parts.push('N\u00b0 ' + p.NUMERO_CASA)
  if (p.COMPLEMENTO) parts.push('(' + p.COMPLEMENTO + ')')
  return parts.join(' ') || ''
}

function buildLocationString(p) {
  const parts = []
  if (p.GEO_BARRIO) parts.push(p.GEO_BARRIO)
  if (p.GEO_CIUDAD) parts.push(p.GEO_CIUDAD)
  else if (p.CIUDAD) parts.push(p.CIUDAD)
  if (p.GEO_DISTRITO) parts.push(p.GEO_DISTRITO)
  if (p.GEO_DEPARTAMENTO) parts.push(p.GEO_DEPARTAMENTO)
  else if (p.DEPARTAMENTO) parts.push(p.DEPARTAMENTO)
  return parts.join(', ') || '-'
}

function buildMapsQuery(p) {
  const parts = []
  if (p.CALLE) {
    let addr = p.CALLE
    if (p.NUMERO_CASA) addr += ' ' + p.NUMERO_CASA
    parts.push(addr)
  }
  if (p.GEO_BARRIO) parts.push(p.GEO_BARRIO)
  if (p.GEO_CIUDAD) parts.push(p.GEO_CIUDAD)
  else if (p.CIUDAD) parts.push(p.CIUDAD)
  if (p.GEO_DISTRITO) parts.push(p.GEO_DISTRITO)
  if (p.GEO_DEPARTAMENTO) parts.push(p.GEO_DEPARTAMENTO)
  else if (p.DEPARTAMENTO) parts.push(p.DEPARTAMENTO)
  parts.push('Paraguay')
  return parts.length > 1 ? parts.join(', ') : ''
}

function InfoRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={16} className="text-gray-400 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-gray-800 ${mono ? 'font-mono font-semibold' : 'font-medium'}`}>
          {value || '-'}
        </p>
      </div>
    </div>
  )
}
