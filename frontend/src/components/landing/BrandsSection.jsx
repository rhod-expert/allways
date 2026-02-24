import { motion } from 'framer-motion'

const brands = [
  'Empalux',
  'Scotch-Brite',
  'Wyda',
  'Allways',
  'Allways Health',
  'Guapo',
  'Trento',
]

export default function BrandsSection() {
  return (
    <section className="py-16 bg-allways-gray-light">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-allways-navy text-sm font-bold uppercase tracking-[0.2em] mb-2">Nuestras marcas</p>
          <h2 className="text-2xl sm:text-3xl font-black text-allways-dark uppercase">
            Marcas Participantes
          </h2>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
          {brands.map((brand, index) => (
            <motion.div
              key={brand}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="brand-badge !bg-white !text-allways-navy !border-allways-gold/70 shadow-md"
            >
              {brand}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
