const statusStyles = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  ACEPTADO: 'bg-green-100 text-green-800 border-green-300',
  RECHAZADO: 'bg-red-100 text-red-800 border-red-300',
  ACTIVO: 'bg-blue-100 text-blue-800 border-blue-300',
  INACTIVO: 'bg-gray-100 text-gray-600 border-gray-300',
  default: 'bg-gray-100 text-gray-700 border-gray-300',
}

export default function Badge({ status, className = '' }) {
  const style = statusStyles[status] || statusStyles.default

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${style} ${className}`}
    >
      {status}
    </span>
  )
}
