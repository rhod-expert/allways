import { motion } from 'framer-motion'
import { ShoppingCart, Upload, Ticket } from 'lucide-react'

const steps = [
  {
    icon: ShoppingCart,
    number: '01',
    title: 'COMPRA',
    description: 'Adquiri productos de las marcas participantes en cualquier punto de venta habilitado en todo Paraguay.',
  },
  {
    icon: Upload,
    number: '02',
    title: 'CARGA TU FACTURA',
    description: 'Registrate en nuestra pagina y subi la foto de tu factura con los productos participantes.',
  },
  {
    icon: Ticket,
    number: '03',
    title: 'GANA PREMIOS',
    description: 'Por cada producto obtenes un cupon para los sorteos mensuales. Mas productos, mas oportunidades de ganar.',
  },
]

export default function HowToSection() {
  return (
    <section className="py-20 bg-white" id="como-participar">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-allways-blue text-sm font-bold uppercase tracking-[0.2em] mb-2">Asi de facil</p>
          <h2 className="text-3xl sm:text-4xl font-black text-allways-dark uppercase">
            Como Participar
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="glass-card-light text-center group"
              >
                <div className="mb-5 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-allways-gold to-allways-gold-light shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Icon size={28} className="text-allways-dark" />
                </div>
                <div className="text-xs font-bold text-allways-gold tracking-widest mb-2">{step.number}</div>
                <h3 className="text-xl font-black text-allways-dark uppercase mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
