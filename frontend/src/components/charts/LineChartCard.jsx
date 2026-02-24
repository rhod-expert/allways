import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function LineChartCard({ title, data, dataKey = 'value', xKey = 'date' }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0A1628',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#D4A843"
              strokeWidth={2.5}
              dot={{ fill: '#D4A843', r: 3 }}
              activeDot={{ r: 5, fill: '#F0D78C' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
