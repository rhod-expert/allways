import { forwardRef } from 'react'

const variants = {
  gold: 'btn-gold',
  green: 'bg-allways-green hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5',
  red: 'bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-0.5',
  outline: 'border-2 border-allways-gold text-allways-gold hover:bg-allways-gold hover:text-white font-bold px-6 py-3 rounded-xl transition-all duration-300',
  ghost: 'text-gray-300 hover:text-white hover:bg-white/10 font-medium px-4 py-2 rounded-lg transition-all duration-200',
}

const sizes = {
  sm: 'text-sm px-4 py-2',
  md: 'text-base px-6 py-3',
  lg: 'text-lg px-8 py-4',
}

const Button = forwardRef(function Button(
  { variant = 'gold', size = 'md', className = '', children, disabled, loading, ...props },
  ref
) {
  const baseClass = variants[variant] || variants.gold
  const sizeClass = variant === 'gold' ? '' : (sizes[size] || '')

  return (
    <button
      ref={ref}
      className={`${baseClass} ${sizeClass} inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  )
})

export default Button
