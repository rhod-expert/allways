import { motion } from 'framer-motion'

const products = [
  { id: 1, name: 'Whey Protein Dulce de Leche' },
  { id: 7, name: 'Whey Protein Coffee' },
  { id: 12, name: 'Whey Protein Chocolate' },
  { id: 17, name: 'Methylfolate' },
  { id: 19, name: 'Magnesium Quelato' },
  { id: 24, name: 'Vitamin D3+K2' },
  { id: 29, name: 'Cranberry' },
  { id: 34, name: 'Skin Collagen Hidrolizado' },
  { id: 39, name: 'Skin Collagen Hidrolizado Fresa' },
  { id: 46, name: 'ProCollagen Rosa' },
  { id: 52, name: 'ProCollagen Naranja' },
  { id: 57, name: 'Prebiotic' },
  { id: 62, name: 'Multi+NAC Vitamínico' },
  { id: 66, name: 'Tumeric+Q10' },
  { id: 72, name: 'Citrato de Magnesio' },
  { id: 77, name: 'Glutamina' },
  { id: 82, name: 'Creatine 300g' },
  { id: 83, name: 'Creatina 150g' },
  { id: 88, name: 'Vitamina B12' },
  { id: 92, name: 'Magnesium Malate' },
  { id: 96, name: 'Propolis Green' },
  { id: 99, name: '4 Magnesium' },
  { id: 103, name: 'Coenzima Q10' },
  { id: 107, name: 'Collagen Peptides' },
  { id: 111, name: 'ThermoPro' },
  { id: 115, name: 'Creatine 150 Cápsulas' },
]

export default function BrandsSection() {
  return (
    <section className="py-16 bg-allways-gray-light">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-allways-navy text-sm font-bold uppercase tracking-[0.2em] mb-2">Nuestros productos</p>
          <h2 className="text-2xl sm:text-3xl font-black text-allways-dark uppercase">
            Productos Participantes
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03 }}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-3 flex flex-col items-center"
            >
              <img
                src={`${import.meta.env.BASE_URL}images/productos/${product.id}.png`}
                alt={product.name}
                className="w-full h-auto object-contain rounded-lg"
                loading="lazy"
              />
              <p className="mt-2 text-xs sm:text-sm text-center font-medium text-allways-dark leading-tight">
                {product.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
