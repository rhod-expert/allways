import { useEffect, useState } from 'react'
import { FileText, CheckCircle2, XCircle, Clock, Store, User } from 'lucide-react'
import clientApi from '../../services/clientApi'

const ESTADO_BADGE = {
  PENDIENTE: { label: 'En revision', icon: Clock, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
  ACEPTADO:  { label: 'Aceptado', icon: CheckCircle2, color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  RECHAZADO: { label: 'Rechazado', icon: XCircle, color: 'text-red-400 bg-red-400/10 border-red-400/30' }
}

export default function MisRegistrosPage() {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    clientApi.get('/cliente/registros')
      .then((r) => mounted && setRegistros(r.data.data || []))
      .catch(() => {})
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
          <FileText className="text-allways-gold" /> Mis Registros
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Todas las facturas que cargaste y su estado actual.
        </p>
      </header>

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : registros.length === 0 ? (
        <div className="glass-card !p-8 text-center">
          <FileText className="text-gray-500 mx-auto mb-3" size={36} />
          <p className="text-gray-300">Aun no tenes registros cargados.</p>
          <a href="/allways/participar" className="text-allways-gold hover:underline text-sm mt-2 inline-block">
            Cargar mi primera factura
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {registros.map((r) => {
            const badge = ESTADO_BADGE[r.ESTADO] || ESTADO_BADGE.PENDIENTE
            const Icon = badge.icon
            return (
              <div key={r.ID} className="glass-card !p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white">Factura {r.NUMERO_FACTURA}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}>
                        <Icon size={12} /> {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(r.FECHA_REGISTRO).toLocaleDateString('es-PY', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                      {r.FECHA_VALIDACION && ' · Revisado el ' + new Date(r.FECHA_VALIDACION).toLocaleDateString('es-PY')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Cupones generados</p>
                    <p className="text-2xl font-black text-allways-gold">{r.TOTAL_CUPONES || 0}</p>
                    <p className="text-[10px] text-gray-500">
                      {r.CANTIDAD_PRODUCTOS} producto{r.CANTIDAD_PRODUCTOS === 1 ? '' : 's'} declarado{r.CANTIDAD_PRODUCTOS === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                  {r.TIENDA && (
                    <span className="inline-flex items-center gap-1">
                      <Store size={12} className="text-allways-gold" /> {r.TIENDA}
                    </span>
                  )}
                  {r.VENDEDOR && (
                    <span className="inline-flex items-center gap-1">
                      <User size={12} className="text-allways-gold" /> {r.VENDEDOR}
                    </span>
                  )}
                </div>

                {r.ESTADO === 'RECHAZADO' && r.MOTIVO_RECHAZO && (
                  <div className="mt-3 p-2.5 rounded-lg bg-red-400/10 border border-red-400/30 text-sm text-red-200">
                    <strong>Motivo:</strong> {r.MOTIVO_RECHAZO}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
