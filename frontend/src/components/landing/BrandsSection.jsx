import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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

const ITEMS_PER_PAGE = 12

export default function BrandsSection() {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE)
  const currentProducts = products.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)

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
          <p className="text-gray-500 text-sm mt-2">{products.length} productos en la promocion</p>
        </motion.div>

        {/* Paginated product grid */}
        <div className="min-h-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5"
            >
              {currentProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-3 flex flex-col items-center group"
                >
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={`${import.meta.env.BASE_URL}images/productos/${product.id}.png`}
                      alt={product.name}
                      className="w-full h-auto object-contain rounded-lg group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-center font-medium text-allways-dark leading-tight">
                    {product.name}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-full border border-gray-300 text-gray-500 hover:border-allways-gold hover:text-allways-gold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  page === i
                    ? 'bg-allways-gold w-8'
                    : 'bg-gray-300 hover:bg-gray-400 w-2.5'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-2 rounded-full border border-gray-300 text-gray-500 hover:border-allways-gold hover:text-allways-gold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  )
}
