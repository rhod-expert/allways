import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import {
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Ticket,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import useApi from '../hooks/useApi'

const PAGE_SIZE = 15

export default function ParticipantesPage() {
  const { get } = useApi()
  const [participants, setParticipants] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchParticipants = useCallback(async (page = 1, searchTerm = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE })
      if (searchTerm.trim()) params.set('search', searchTerm.trim())
      const data = await get(`/admin/participantes?${params.toString()}`)
      setParticipants(data.data || [])
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 0 })
    } catch {
      setParticipants([])
    } finally {
      setLoading(false)
    }
  }, [get])

  useEffect(() => {
    fetchParticipants(1, search)
  }, [search, fetchParticipants])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const goToPage = (page) => {
    fetchParticipants(page, search)
  }

  function buildLocation(p) {
    const parts = []
    if (p.GEO_BARRIO) parts.push(p.GEO_BARRIO)
    if (p.GEO_CIUDAD) parts.push(p.GEO_CIUDAD)
    else if (p.CIUDAD) parts.push(p.CIUDAD)
    if (p.GEO_DISTRITO) parts.push(p.GEO_DISTRITO)
    if (p.GEO_DEPARTAMENTO) parts.push(p.GEO_DEPARTAMENTO)
    else if (p.DEPARTAMENTO) parts.push(p.DEPARTAMENTO)
    return parts.join(', ') || '-'
  }

  function buildAddress(p) {
    const parts = []
    if (p.CALLE) parts.push(p.CALLE)
    if (p.NUMERO_CASA) parts.push('N\u00b0 ' + p.NUMERO_CASA)
    if (p.COMPLEMENTO) parts.push('(' + p.COMPLEMENTO + ')')
    return parts.join(' ') || ''
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800">Clientes</h2>
          <p className="text-gray-500 text-sm">
            {pagination.total} participante{pagination.total !== 1 ? 's' : ''} registrado{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre o cedula..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 outline-none focus:border-allways-blue text-sm text-gray-800"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-allways-blue text-white rounded-xl text-sm font-semibold hover:bg-allways-blue/90 transition-colors"
        >
          Buscar
        </button>
      </form>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : participants.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center border border-gray-100">
          <User size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No se encontraron participantes</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {participants.map((p, i) => (
              <motion.div
                key={p.ID}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={`/admin/clientes/${p.ID}`}
                  className="block bg-white rounded-2xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 truncate">{p.NOMBRE}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.CEDULA}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 ml-2">
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-semibold">
                        <FileText size={12} /> {p.TOTAL_REGISTROS}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg font-semibold">
                        <Ticket size={12} /> {p.TOTAL_CUPONES}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    {p.TELEFONO && (
                      <p className="flex items-center gap-1.5"><Phone size={12} /> {p.TELEFONO}</p>
                    )}
                    {p.EMAIL && (
                      <p className="flex items-center gap-1.5 truncate"><Mail size={12} /> {p.EMAIL}</p>
                    )}
                    <p className="flex items-center gap-1.5 truncate"><MapPin size={12} /> {buildLocation(p)}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cedula</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Telefono</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Ubicacion</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Direccion</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Registros</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cupones</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.ID} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <Link to={`/admin/clientes/${p.ID}`} className="text-allways-blue hover:underline font-semibold">
                          {p.NOMBRE}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">{p.CEDULA}</td>
                      <td className="py-3 px-4 text-gray-600">{p.TELEFONO}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs max-w-[200px] truncate">{buildLocation(p)}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs max-w-[180px] truncate">{buildAddress(p)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-bold">
                          {p.TOTAL_REGISTROS}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg font-bold">
                          {p.TOTAL_CUPONES}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs">
                        {p.FECHA_REGISTRO ? new Date(p.FECHA_REGISTRO).toLocaleDateString('es-PY') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-600 px-3">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
