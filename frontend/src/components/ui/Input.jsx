import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, error, type = 'text', className = '', required = false, ...props },
  ref
) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 outline-none text-gray-800 bg-white
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-gray-200 focus:border-allways-blue focus:ring-2 focus:ring-blue-100'
          }
          placeholder:text-gray-400`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  )
})

export default Input
