import { useState, useEffect } from 'react'
import { Users, UserPlus, Calendar, CalendarDays, Ticket, Clock, MapPin } from 'lucide-react'
import StatsCard from '../components/admin/StatsCard'
import LineChartCard from '../components/charts/LineChartCard'
import BarChartCard from '../components/charts/BarChartCard'
import Spinner from '../components/ui/Spinner'
import useApi from '../hooks/useApi'

const placeholderStats = {
  totalParticipantes: 0,
  registrosHoy: 0,
  registrosSemana: 0,
  registrosMes: 0,
  totalCupones: 0,
  pendientes: 0,
}

const placeholderDailyData = []
const placeholderMonthlyData = []
const placeholderTopClients = []
const placeholderDepartamentos = []

export default function DashboardPage() {
  const [stats, setStats] = useState(placeholderStats)
  const [dailyData, setDailyData] = useState(placeholderDailyData)
  const [monthlyData, setMonthlyData] = useState(placeholderMonthlyData)
  const [topClients, setTopClients] = useState(placeholderTopClients)
  const [departamentos, setDepartamentos] = useState(placeholderDepartamentos)
  const [pageLoading, setPageLoading] = useState(true)
  const { get } = useApi()

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, chartRes, topRes, mapaRes] = await Promise.all([
          get('/admin/dashboard/stats').catch(() => null),
          get('/admin/dashboard/chart').catch(() => null),
          get('/admin/dashboard/top-clientes').catch(() => null),
          get('/admin/dashboard/mapa').catch(() => null),
        ])

        if (statsRes?.data) {
          setStats(statsRes.data)
        }

        if (chartRes?.data) {
          const { daily, monthly } = chartRes.data
          if (daily) {
            setDailyData(daily.map((d) => ({
              date: d.FECHA ? d.FECHA.substring(5).replace('-', '/') : '',
              value: d.TOTAL || 0,
            })))
          }
          if (monthly) {
            setMonthlyData(monthly.map((m) => ({
              month: m.MES || '',
              value: m.TOTAL || 0,
            })))
          }
        }

        if (topRes?.data) {
          setTopClients(topRes.data.map((c) => ({
            id: c.ID,
            nombre: c.NOMBRE,
            cedula: c.CEDULA,
            departamento: c.DEPARTAMENTO,
            totalCupones: c.TOTAL_CUPONES,
          })))
        }

        if (mapaRes?.data) {
          setDepartamentos(mapaRes.data.map((d) => ({
            departamento: d.DEPARTAMENTO,
            cantidad: d.TOTAL_PARTICIPANTES || 0,
          })))
        }
      } catch {
        // Use placeholder data if API not available
      } finally {
        setPageLoading(false)
      }
    }
    fetchDashboard()
  }, [get])

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-800">Dashboard</h2>
        <p className="text-gray-500 text-sm">Resumen general de la promocion</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard title="Total participantes" value={stats.totalParticipantes} icon={Users} color="blue" />
        <StatsCard title="Registros hoy" value={stats.registrosHoy} icon={UserPlus} color="green" />
        <StatsCard title="Registros esta semana" value={stats.registrosSemana} icon={Calendar} color="cyan" />
        <StatsCard title="Registros este mes" value={stats.registrosMes} icon={CalendarDays} color="purple" />
        <StatsCard title="Total cupones" value={stats.totalCupones} icon={Ticket} color="gold" />
        <StatsCard title="Pendientes validacion" value={stats.pendientes} icon={Clock} color="orange" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChartCard
          title="Registros ultimos 30 dias"
          data={dailyData}
          dataKey="value"
          xKey="date"
        />
        <BarChartCard
          title="Registros por mes"
          data={monthlyData}
          dataKey="value"
          xKey="month"
        />
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 clients */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Top 10 Clientes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-400 uppercase">#</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-400 uppercase">Nombre</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-400 uppercase">Cedula</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-400 uppercase">Cupones</th>
                </tr>
              </thead>
              <tbody>
                {topClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-400 text-sm">Sin datos</td>
                  </tr>
                ) : topClients.map((client, index) => (
                  <tr key={client.id || index} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-2 text-gray-400 font-mono text-xs">{index + 1}</td>
                    <td className="py-2.5 px-2 font-medium text-gray-800">{client.nombre}</td>
                    <td className="py-2.5 px-2 text-gray-500 font-mono text-xs">{client.cedula}</td>
                    <td className="py-2.5 px-2 text-right font-bold text-allways-gold">{client.totalCupones}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department distribution */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
            <MapPin size={14} className="inline mr-1 -mt-0.5" />
            Distribucion por Departamento
          </h3>
          <div className="space-y-3">
            {departamentos.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">Sin datos</p>
            ) : departamentos.map((dep, index) => {
              const maxVal = Math.max(...departamentos.map((d) => d.cantidad), 1)
              const percentage = (dep.cantidad / maxVal) * 100
              return (
                <div key={dep.departamento || index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{dep.departamento}</span>
                    <span className="text-sm font-bold text-gray-500">{dep.cantidad}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-allways-blue to-allways-cyan transition-all duration-700"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            Mapa interactivo disponible proximamente
          </p>
        </div>
      </div>
    </div>
  )
}
