import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, Smartphone, FileText, RefreshCw, Send, Power, QrCode, Wifi, WifiOff, Save, Eye } from 'lucide-react'
import { toast } from 'react-toastify'
import useApi from '../hooks/useApi'
import Spinner from '../components/ui/Spinner'

const TABS = [
  { id: 'instancia', label: 'Instancia', icon: Smartphone },
  { id: 'chats', label: 'Chats', icon: MessageCircle },
  { id: 'plantillas', label: 'Plantillas', icon: FileText },
]

const ESTADO_BADGE = {
  CONECTADA: { label: 'Conectada', color: 'bg-green-100 text-green-700 border-green-300', icon: Wifi },
  CONECTANDO: { label: 'Conectando', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: RefreshCw },
  QR_PENDIENTE: { label: 'QR pendiente', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: QrCode },
  DESCONECTADA: { label: 'Desconectada', color: 'bg-gray-100 text-gray-600 border-gray-300', icon: WifiOff },
  ERROR: { label: 'Error', color: 'bg-red-100 text-red-700 border-red-300', icon: WifiOff },
}

export default function WhatsAppPage() {
  const [tab, setTab] = useState('instancia')

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
          <MessageCircle className="text-allways-primary" /> WhatsApp
        </h2>
        <p className="text-gray-500 text-sm">Instancia, chats con clientes y plantillas de notificacion</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${
              tab === id
                ? 'border-allways-primary text-allways-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'instancia' && <InstanciaTab />}
      {tab === 'chats' && <ChatsTab />}
      {tab === 'plantillas' && <PlantillasTab />}
    </div>
  )
}

// ============================================================
// Instancia tab
// ============================================================
function InstanciaTab() {
  const { get, post } = useApi()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [qrBase64, setQrBase64] = useState(null)

  const refresh = async () => {
    try {
      const r = await get('/admin/whatsapp/instancia')
      setData(r.data)
      const stored = r.data?.instancia?.QR_CODE
      if (stored) setQrBase64(stored)
      else if (r.data?.instancia?.ESTADO === 'CONECTADA') setQrBase64(null)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 3000)
    return () => clearInterval(t)
  }, [])

  const onConnect = async () => {
    setBusy(true)
    try {
      const r = await post('/admin/whatsapp/instancia/conectar')
      const code = r?.data?.base64 || r?.data?.qrcode?.base64 || r?.data?.code || null
      if (code) setQrBase64(code.startsWith('data:') ? code : `data:image/png;base64,${code}`)
      toast.success('Conexion iniciada — escanea el QR con WhatsApp')
      refresh()
    } catch (e) {
      const detail = e.response?.data?.detail
      const msg = (typeof detail === 'string' ? detail : detail?.response?.message?.[0] || detail?.message)
        || e.response?.data?.message || 'Error al conectar'
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  const onDisconnect = async () => {
    if (!confirm('Cerrar sesion de WhatsApp?')) return
    setBusy(true)
    try {
      await post('/admin/whatsapp/instancia/desconectar')
      toast.success('Instancia desconectada')
      setQrBase64(null)
      refresh()
    } catch (e) {
      toast.error('Error al desconectar')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  const persisted = data?.instancia
  const live = data?.evolution
  const estado = persisted?.ESTADO || 'DESCONECTADA'
  const Badge = ESTADO_BADGE[estado] || ESTADO_BADGE.DESCONECTADA

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Instancia</p>
            <p className="text-lg font-bold text-gray-800">{persisted?.NOMBRE || 'allways-campana'}</p>
          </div>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${Badge.color}`}>
            <Badge.icon size={14} /> {Badge.label}
          </span>
        </div>

        <dl className="text-sm space-y-2">
          <div className="flex justify-between"><dt className="text-gray-500">Numero</dt>
            <dd className="text-gray-800 font-mono">{persisted?.NUMERO || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Ultima conexion</dt>
            <dd className="text-gray-800">{persisted?.ULTIMA_CONEXION ? new Date(persisted.ULTIMA_CONEXION).toLocaleString('es-PY') : '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Ultimo evento</dt>
            <dd className="text-gray-800 font-mono text-xs">{persisted?.ULTIMO_EVENTO || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Estado Evolution</dt>
            <dd className="text-gray-800 font-mono text-xs">{live?.state || live?.error || '—'}</dd></div>
        </dl>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onConnect}
            disabled={busy || estado === 'CONECTADA'}
            className="flex-1 px-4 py-2 bg-allways-primary text-white rounded-lg font-semibold disabled:opacity-50 hover:opacity-90 flex items-center justify-center gap-2"
          >
            <QrCode size={16} /> {estado === 'CONECTADA' ? 'Conectada' : 'Conectar / QR'}
          </button>
          <button
            onClick={onDisconnect}
            disabled={busy || estado !== 'CONECTADA'}
            className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg font-semibold disabled:opacity-50 hover:bg-red-100 flex items-center gap-2"
          >
            <Power size={16} /> Cerrar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 flex flex-col items-center justify-center min-h-[280px]">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Codigo QR</p>
        {qrBase64 ? (
          <img src={qrBase64} alt="QR WhatsApp" className="w-56 h-56 rounded-lg border border-gray-200" />
        ) : estado === 'CONECTADA' ? (
          <div className="text-center text-green-600">
            <Wifi size={48} className="mx-auto mb-2" />
            <p className="font-semibold">Sesion activa</p>
            <p className="text-xs text-gray-500">No requiere escaneo</p>
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <QrCode size={48} className="mx-auto mb-2" />
            <p className="text-sm">Pulsa <b>Conectar / QR</b> y escanea con WhatsApp en el celular de la campana.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Chats tab
// ============================================================
function ChatsTab() {
  const { get, post } = useApi()
  const [chats, setChats] = useState([])
  const [selected, setSelected] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [loadingChats, setLoadingChats] = useState(true)
  const messagesEndRef = useRef(null)

  const loadChats = async () => {
    try {
      const r = await get('/admin/whatsapp/chats?limit=80')
      setChats(r.data || [])
    } catch {} finally {
      setLoadingChats(false)
    }
  }

  const loadMensajes = async (chatId) => {
    try {
      const r = await get(`/admin/whatsapp/chats/${chatId}/mensajes?limit=200`)
      setMensajes(r.data || [])
      await post(`/admin/whatsapp/chats/${chatId}/leido`)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch {}
  }

  useEffect(() => {
    loadChats()
    const t = setInterval(loadChats, 8000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!selected) return
    loadMensajes(selected.ID)
    const t = setInterval(() => loadMensajes(selected.ID), 5000)
    return () => clearInterval(t)
  }, [selected?.ID])

  const enviarMensaje = async () => {
    if (!texto.trim() || !selected) return
    setEnviando(true)
    try {
      await post(`/admin/whatsapp/chats/${selected.ID}/mensajes`, { texto })
      setTexto('')
      loadMensajes(selected.ID)
    } catch (e) {
      toast.error(e.response?.data?.detail?.message || 'Error enviando')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden grid grid-cols-1 lg:grid-cols-[320px_1fr] h-[calc(100vh-280px)] min-h-[420px]">
      <aside className="border-r border-gray-200 flex flex-col">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-semibold uppercase">Conversaciones</p>
          <button onClick={loadChats} className="p-1 text-gray-500 hover:text-allways-primary">
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="p-8 flex justify-center"><Spinner size="md" /></div>
          ) : chats.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">Sin conversaciones</p>
          ) : (
            chats.map((c) => (
              <button
                key={c.ID}
                onClick={() => setSelected(c)}
                className={`w-full text-left px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 ${
                  selected?.ID === c.ID ? 'bg-allways-primary/5 border-l-4 border-l-allways-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm text-gray-800 truncate">
                    {c.PARTICIPANTE_NOMBRE || c.NOMBRE_CONTACTO || c.TELEFONO}
                  </p>
                  {c.NO_LEIDOS > 0 && (
                    <span className="bg-allways-primary text-white text-xs rounded-full px-2 py-0.5 font-bold">
                      {c.NO_LEIDOS}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{c.ULTIMO_TEXTO || c.TELEFONO}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {c.ULTIMA_ACTIVIDAD ? new Date(c.ULTIMA_ACTIVIDAD).toLocaleString('es-PY') : ''}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="flex flex-col bg-gray-50">
        {selected ? (
          <>
            <div className="px-4 py-3 bg-white border-b border-gray-200">
              <p className="font-bold text-gray-800">
                {selected.PARTICIPANTE_NOMBRE || selected.NOMBRE_CONTACTO || selected.TELEFONO}
              </p>
              <p className="text-xs text-gray-500 font-mono">+{selected.TELEFONO}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {mensajes.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-12">Sin mensajes aun</p>
              ) : (
                mensajes.map((m) => (
                  <div key={m.ID} className={`flex ${m.DIRECCION === 'OUT' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                      m.DIRECCION === 'OUT' ? 'bg-allways-primary text-white' : 'bg-white border border-gray-200 text-gray-800'
                    }`}>
                      {m.PLANTILLA_CODIGO && (
                        <p className="text-[10px] uppercase opacity-60 font-bold mb-0.5">{m.PLANTILLA_CODIGO}</p>
                      )}
                      <p>{m.TEXTO}</p>
                      <p className={`text-[10px] mt-1 ${m.DIRECCION === 'OUT' ? 'text-white/70' : 'text-gray-400'}`}>
                        {m.FECHA ? new Date(m.FECHA).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje() }
                }}
                placeholder="Escribe una respuesta..."
                rows={2}
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-allways-primary/40"
              />
              <button
                onClick={enviarMensaje}
                disabled={enviando || !texto.trim()}
                className="px-4 py-2 bg-allways-primary text-white rounded-lg font-semibold disabled:opacity-50 hover:opacity-90 flex items-center gap-2"
              >
                <Send size={16} /> Enviar
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Selecciona una conversacion
          </div>
        )}
      </section>
    </div>
  )
}

// ============================================================
// Plantillas tab
// ============================================================
function PlantillasTab() {
  const { get, put, post } = useApi()
  const [plantillas, setPlantillas] = useState([])
  const [editing, setEditing] = useState({})
  const [previewText, setPreviewText] = useState({})
  const [loading, setLoading] = useState(true)

  const sampleVars = useMemo(() => ({
    RECIBIDO: { nombre: 'Maria', numeroFactura: '001-001-0001234', cantidadProductos: 3 },
    ACEPTADO: { nombre: 'Maria', cuponesLista: '• AW-2026-AB1234\n• AW-2026-AB1235', mesActual: 'mayo', premiosMes: '• TV 50"\n• Bicicleta' },
    RECHAZADO: { nombre: 'Maria', motivo: 'la imagen de la factura no es legible' },
  }), [])

  const load = async () => {
    try {
      const r = await get('/admin/whatsapp/plantillas')
      setPlantillas(r.data || [])
      const initial = {}
      for (const p of r.data || []) {
        initial[p.CODIGO] = { texto: p.TEXTO, nombre: p.NOMBRE, activo: p.ACTIVO }
      }
      setEditing(initial)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const save = async (codigo) => {
    const e = editing[codigo]
    try {
      await put(`/admin/whatsapp/plantillas/${codigo}`, e)
      toast.success(`Plantilla ${codigo} guardada`)
      load()
    } catch { toast.error('Error guardando plantilla') }
  }

  const preview = async (codigo) => {
    try {
      const e = editing[codigo]
      // Use server-side rendering with current text — saves first if dirty? simpler: render locally
      const rendered = e.texto.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => sampleVars[codigo]?.[k] ?? `{{${k}}}`)
      setPreviewText((p) => ({ ...p, [codigo]: rendered }))
    } catch {}
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Las plantillas usan placeholders <code className="bg-gray-100 px-1 rounded">{'{{nombre}}'}</code>,{' '}
        <code className="bg-gray-100 px-1 rounded">{'{{numeroFactura}}'}</code>,{' '}
        <code className="bg-gray-100 px-1 rounded">{'{{cuponesLista}}'}</code>,{' '}
        <code className="bg-gray-100 px-1 rounded">{'{{mesActual}}'}</code>,{' '}
        <code className="bg-gray-100 px-1 rounded">{'{{premiosMes}}'}</code>,{' '}
        <code className="bg-gray-100 px-1 rounded">{'{{motivo}}'}</code>.
      </p>

      {plantillas.map((p) => (
        <div key={p.CODIGO} className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
          <div className="flex items-start justify-between mb-3 gap-3">
            <div className="flex-1">
              <span className="inline-block px-2 py-0.5 rounded bg-allways-primary/10 text-allways-primary text-xs font-bold mb-1">
                {p.CODIGO}
              </span>
              <input
                value={editing[p.CODIGO]?.nombre || ''}
                onChange={(e) => setEditing((s) => ({ ...s, [p.CODIGO]: { ...s[p.CODIGO], nombre: e.target.value } }))}
                className="w-full font-bold text-gray-800 border-b border-transparent focus:border-allways-primary focus:outline-none text-lg"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing[p.CODIGO]?.activo === 'S'}
                onChange={(e) => setEditing((s) => ({ ...s, [p.CODIGO]: { ...s[p.CODIGO], activo: e.target.checked ? 'S' : 'N' } }))}
              />
              Activa
            </label>
          </div>

          <textarea
            value={editing[p.CODIGO]?.texto || ''}
            onChange={(e) => setEditing((s) => ({ ...s, [p.CODIGO]: { ...s[p.CODIGO], texto: e.target.value } }))}
            rows={10}
            className="w-full font-mono text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-allways-primary/40"
          />

          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => save(p.CODIGO)} className="px-4 py-1.5 bg-allways-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 flex items-center gap-1">
              <Save size={14} /> Guardar
            </button>
            <button onClick={() => preview(p.CODIGO)} className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 flex items-center gap-1">
              <Eye size={14} /> Previsualizar
            </button>
          </div>

          {previewText[p.CODIGO] && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg whitespace-pre-wrap text-sm text-gray-800">
              {previewText[p.CODIGO]}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
