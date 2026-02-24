import { motion } from 'framer-motion'

const prizes = [
  { month: 'Febrero', prize: 'Licuadora Personal', image: '/allways/images/prizes/licuadora-personal.png' },
  { month: 'Marzo', prize: 'Air Fryer', image: '/allways/images/prizes/air-fryer.png' },
  { month: 'Abril', prize: 'Patinete Electrico', image: '/allways/images/prizes/patinete.png' },
  { month: 'Mayo', prize: 'Licuadora Oster', image: '/allways/images/prizes/licuadora-2.png' },
  { month: 'Junio', prize: 'Robo Aspirador', image: '/allways/images/prizes/robo-aspirador.png' },
  { month: 'Julio', prize: 'Smart TV 55"', image: '/allways/images/prizes/tv.png' },
  { month: 'Agosto', prize: 'iPhone 16', image: '/allways/images/prizes/iphone.png' },
  { month: 'Septiembre', prize: 'Scooter Electrico', image: '/allways/images/prizes/scooter.png' },
  { month: 'Octubre', prize: 'Air Fryer', image: '/allways/images/prizes/air-fryer.png' },
  { month: 'Noviembre', prize: 'Moto 0 KM', image: '/allways/images/prizes/moto.png' },
]

export default function PrizesSection() {
  return (
    <section className="py-20 bg-dark-section" id="premios">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-allways-gold text-sm font-bold uppercase tracking-[0.2em] mb-2">Sorteos mensuales</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase">
            Premios <span className="text-gold-gradient">Increibles</span>
          </h2>
          <p className="text-gray-400 mt-4 max-w-xl mx-auto text-sm">
            Cada mes sorteamos premios entre todos los participantes. Cuantos mas cupones tengas, mas chances de ganar.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {prizes.map((item, index) => (
            <motion.div
              key={`${item.month}-${index}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="glass-card text-center group cursor-default"
            >
              <span className="gold-pill mb-3">{item.month}</span>
              <div className="w-full aspect-square flex items-center justify-center p-2 my-3">
                <img
                  src={item.image}
                  alt={item.prize}
                  className="max-h-full max-w-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <h3 className="text-white font-bold text-sm sm:text-base">{item.prize}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
