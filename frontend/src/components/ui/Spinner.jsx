export default function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} animate-spin rounded-full border-4 border-allways-gold/30 border-t-allways-gold`}
      />
    </div>
  )
}
