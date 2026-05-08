import { useEffect, useState } from 'react'
import { Ticket, Trophy, Calendar, Sparkles, MapPin, Phone, Mail } from 'lucide-react'
import clientApi from '../../services/clientApi'
import useClientAuth from '../../hooks/useClientAuth'

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function currentMesNombre() {
  return MESES[new Date().getMonth()]
}

export default function ClienteDashboardPage() {
  const { user } = useClientAuth()
  const [me, setMe] = useState(null)
  const [data, setData] = useState({ cupones: [], premios: [], totales: { total: 0, ganadores: 0 } })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      clientApi.get('/cliente/me'),
      clientApi.get('/cliente/cupones')
    ]).then(([meRes, cuponesRes]) => {
      if (!mounted) return
      setMe(meRes.data.data)
      setData(cuponesRes.data.data)
    }).catch(() => {}).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  const mesActual = currentMesNombre()
  const cuponesMes = data.cupones.filter((c) => (c.MES_SORTEO || '').toLowerCase() === mesActual)
  const cuponesGanadores = data.cupones.filter((c) => c.GANADOR === 'S')
  const premiosMes = data.premios.filter((p) => (p.MES || '').toLowerCase() === mesActual)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-black text-white">
          Hola, <span className="text-allways-gold">{(user?.nombre || '').split(' ')[0] || 'Bienvenido'}</span>
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Estos son tus cupones, premios del mes y datos registrados.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Ticket} label="Cupones totales" value={data.totales.total} loading={loading} />
        <StatCard icon={Calendar} label={`Cupones en ${mesActual}`} value={cuponesMes.length} loading={loading} />
        <StatCard icon={Trophy} label="Cupones ganadores" value={cuponesGanadores.length} loading={loading} highlight />
        <StatCard icon={Sparkles} label="Premios del mes" value={premiosMes.length} loading={loading} />
      </div>

      {/* Premios del mes */}
      <section className="glass-card !p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="text-allways-gold" size={20} />
          <h2 className="text-lg font-bold text-white capitalize">Premios de {mesActual}</h2>
        </div>
        {premiosMes.length === 0 ? (
          <p className="text-sm text-gray-400">Aun no hay premios cargados para este mes.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {premiosMes.map((p) => (
              <li key={p.ID} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-full bg-allways-gold/20 flex items-center justify-center text-allways-gold">
                  <Trophy size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.DESCRIPCION}</p>
                  {p.CUPON_GANADOR_ID && (
                    <p className="text-xs text-gray-500">Sorteado</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Cupones */}
      <section className="glass-card !p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Ticket className="text-allways-gold" size={20} />
            <h2 className="text-lg font-bold text-white">Mis Cupones</h2>
          </div>
          <span className="text-xs text-gray-500">{data.cupones.length} en total</span>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : data.cupones.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">Aun no tenes cupones aprobados.</p>
            <p className="text-gray-500 text-xs mt-1">
              Cada factura validada genera 1 cupon por producto declarado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {data.cupones.map((c) => (
              <div
                key={c.ID}
                className={`relative p-4 rounded-xl border ${
                  c.GANADOR === 'S'
                    ? 'border-allways-gold bg-allways-gold/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-bold text-white tracking-wider">
                      {c.NUMERO_CUPON}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Factura {c.NUMERO_FACTURA}
                    </p>
                  </div>
                  {c.GANADOR === 'S' && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-allways-gold text-allways-dark uppercase tracking-wider">
                      Ganador
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  <span className="capitalize">Sorteo: <strong className="text-gray-200">{c.MES_SORTEO?.toLowerCase()}</strong></span>
                  {c.TIENDA && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} className="text-allways-gold" /> {c.TIENDA}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Datos personales */}
      {me && (
        <section className="glass-card !p-5">
          <h2 className="text-lg font-bold text-white mb-3">Mis datos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <DataRow label="Nombre" value={me.NOMBRE} />
            <DataRow label="Cedula" value={me.CEDULA} />
            <DataRow label="Telefono" value={me.TELEFONO} icon={Phone} />
            <DataRow label="Email" value={me.EMAIL || '—'} icon={Mail} />
            <DataRow label="Departamento" value={me.GEO_DEPARTAMENTO || me.DEPARTAMENTO || '—'} />
            <DataRow label="Ciudad" value={me.GEO_CIUDAD || me.CIUDAD || '—'} />
            <DataRow label="Direccion" value={[me.CALLE, me.NUMERO_CASA, me.COMPLEMENTO].filter(Boolean).join(' ') || '—'} />
            <DataRow label="Registrado el" value={me.FECHA_REGISTRO ? new Date(me.FECHA_REGISTRO).toLocaleDateString('es-PY') : '—'} />
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Para modificar tus datos contacta a soporte. Esta vista es de solo lectura.
          </p>
        </section>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, loading, highlight }) {
  return (
    <div className={`glass-card !p-4 ${highlight ? 'ring-2 ring-allways-gold/50' : ''}`}>
      <div className="flex items-center justify-between">
        <Icon className={highlight ? 'text-allways-gold' : 'text-gray-400'} size={20} />
        {highlight && <span className="text-[10px] font-bold text-allways-gold uppercase">premio</span>}
      </div>
      <p className="text-2xl font-black text-white mt-2">{loading ? '—' : value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}

function DataRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5">
      {Icon && <Icon size={14} className="text-allways-gold mt-0.5" />}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
        <p className="text-sm text-gray-200 truncate">{value}</p>
      </div>
    </div>
  )
}
