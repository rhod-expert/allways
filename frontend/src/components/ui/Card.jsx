import { motion } from 'framer-motion'

export default function Card({ children, className = '', dark = false, hover = true, ...props }) {
  const baseClass = dark ? 'glass-card' : 'glass-card-light'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className={`${baseClass} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
