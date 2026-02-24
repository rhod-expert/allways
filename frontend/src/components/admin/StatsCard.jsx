import { motion } from 'framer-motion'

export default function StatsCard({ title, value, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    gold: 'from-yellow-500 to-yellow-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    cyan: 'from-cyan-500 to-cyan-600',
    orange: 'from-orange-500 to-orange-600',
  }

  const bgGradient = colorMap[color] || colorMap.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-md p-5 border border-gray-100 flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bgGradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">{title}</p>
        <p className="text-2xl font-black text-gray-800">{value}</p>
        {trend && (
          <p className={`text-xs font-medium ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? '+' : ''}{trend}% vs semana anterior
          </p>
        )}
      </div>
    </motion.div>
  )
}
