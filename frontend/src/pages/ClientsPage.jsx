import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router'
import { Search, Filter, ChevronLeft, ChevronRight, Eye, FileText, User, Calendar } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import useApi from '../hooks/useApi'

const ESTADOS = ['', 'PENDIENTE', 'ACEPTADO', 'RECHAZADO']
const PAGE_SIZE = 15

export default function ClientsPage() {
  const [registrations, setRegistrations] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const navigate = useNavigate()
  const { get } = useApi()

  const fetchRegistrations = useCallback(async () => {
    setPageLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page)
      params.set('limit', PAGE_SIZE)
      if (searchTerm.trim()) params.set('search', searchTerm.trim())
      if (statusFilter) params.set('estado', statusFilter)
      if (dateFrom) params.set('fechaDesde', dateFrom)
      if (dateTo) params.set('fechaHasta', dateTo)

      const data = await get(`/admin/registros?${params.toString()}`)
      setRegistrations(data.data || [])
      setTotalCount(data.pagination?.total || 0)
    } catch {
      setRegistrations([])
      setTotalCount(0)
    } finally {
      setPageLoading(false)
    }
  }, [get, page, searchTerm, statusFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchRegistrations()
  }, [fetchRegistrations])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchRegistrations()
  }

  const activeFiltersCount = [statusFilter, dateFrom, dateTo].filter(Boolean).length

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-800">Registros</h2>
        <p className="text-gray-500 text-xs sm:text-sm">Gestiona las facturas y registros de los participantes</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-md p-4 sm:p-5 border border-gray-100">
        {/* Search bar - always visible */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar nombre, cedula o factura..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-allways-blue transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors
              ${filtersOpen || activeFiltersCount > 0
                ? 'border-allways-blue bg-blue-50 text-allways-blue'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-allways-blue text-white text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </form>

        {/* Collapsible extra filters */}
        {filtersOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-allways-blue bg-white"
            >
              <option value="">Todos los estados</option>
              {ESTADOS.filter(Boolean).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-allways-blue"
              placeholder="Desde"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-allways-blue"
              placeholder="Hasta"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        {pageLoading ? (
          <div className="py-16">
            <Spinner size="lg" />
          </div>
        ) : registrations.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-lg font-medium">No se encontraron registros</p>
            <p className="text-gray-300 text-sm mt-1">Intenta con otros filtros de busqueda</p>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-gray-100">
              {registrations.map((reg) => (
                <div
                  key={reg.ID}
                  className="p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/registros/${reg.ID}`)}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono text-gray-400">#{reg.ID}</span>
                        <Badge status={reg.ESTADO || 'PENDIENTE'} />
                      </div>
                      <p className="font-semibold text-gray-800 truncate">{reg.NOMBRE}</p>
                    </div>
                    <Eye size={18} className="text-gray-300 flex-shrink-0 mt-1" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {reg.CEDULA}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={12} />
                      {reg.NUMERO_FACTURA}
                    </span>
                    {reg.FECHA_REGISTRO && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(reg.FECHA_REGISTRO).toLocaleDateString('es-PY')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Cedula</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Factura</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Cant.</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Fecha</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => (
                    <tr
                      key={reg.ID}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/registros/${reg.ID}`)}
                    >
                      <td className="py-3 px-4 font-mono text-xs text-gray-400">#{reg.ID}</td>
                      <td className="py-3 px-4 font-medium text-gray-800">{reg.NOMBRE}</td>
                      <td className="py-3 px-4 text-gray-500 font-mono text-xs">{reg.CEDULA}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{reg.NUMERO_FACTURA}</td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700 hidden lg:table-cell">{reg.CANTIDAD_PRODUCTOS}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={reg.ESTADO || 'PENDIENTE'} />
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs hidden lg:table-cell">
                        {reg.FECHA_REGISTRO ? new Date(reg.FECHA_REGISTRO).toLocaleDateString('es-PY') : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          to={`/admin/registros/${reg.ID}`}
                          className="inline-flex items-center gap-1 text-allways-blue hover:text-blue-700 text-xs font-semibold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye size={14} />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              <span className="hidden sm:inline">Mostrando </span>
              {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalCount)}
              <span className="hidden sm:inline"> de</span>
              <span className="sm:hidden">/</span> {totalCount}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} className="text-gray-500" />
              </button>
              <span className="px-3 text-sm font-medium text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} className="text-gray-500" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
