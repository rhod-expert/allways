import { motion } from 'framer-motion'

const monthlyPrizes = [
  {
    month: 'Abril',
    prizes: [
      { name: 'TV 50"', image: '/allways/images/prizes/tv.png' },
      { name: 'Licuadora XION 600ml', image: '/allways/images/prizes/licuadora-2.png' },
      { name: 'Licuadora XION 380ml', image: '/allways/images/prizes/licuadora-personal.png' },
      { name: 'Cupon Compra 500.000Gs', image: '/allways/images/prizes/cupon-compra.png' },
    ],
  },
  {
    month: 'Mayo',
    prizes: [
      { name: 'TV 50"', image: '/allways/images/prizes/tv.png' },
      { name: 'Air Fryer XION 5L', image: '/allways/images/prizes/air-fryer.png' },
      { name: 'Licuadora XION 600ml', image: '/allways/images/prizes/licuadora-2.png' },
      { name: 'Licuadora XION 380ml', image: '/allways/images/prizes/licuadora-personal.png' },
      { name: 'Cupon Compra 500.000Gs', image: '/allways/images/prizes/cupon-compra.png' },
    ],
  },
  {
    month: 'Junio',
    prizes: [
      { name: 'TV 50"', image: '/allways/images/prizes/tv.png' },
      { name: 'Aspiradora Robot XION', image: '/allways/images/prizes/robo-aspirador.png' },
      { name: 'Licuadora XION 600ml', image: '/allways/images/prizes/licuadora-2.png' },
      { name: 'Licuadora XION 380ml', image: '/allways/images/prizes/licuadora-personal.png' },
      { name: 'Cupon Compra 500.000Gs', image: '/allways/images/prizes/cupon-compra.png' },
    ],
  },
  {
    month: 'Julio',
    prizes: [
      { name: 'Motoneta Kenton Viva 110', image: '/allways/images/prizes/moto.png' },
      { name: 'Air Fryer XION 5L', image: '/allways/images/prizes/air-fryer.png' },
      { name: 'Licuadora XION 600ml', image: '/allways/images/prizes/licuadora-2.png' },
      { name: 'Cupon Compra 500.000Gs (x2)', image: '/allways/images/prizes/cupon-compra.png' },
    ],
  },
  {
    month: 'Agosto',
    prizes: [
      { name: 'iPhone 16 128GB', image: '/allways/images/prizes/iphone.png' },
      { name: 'Air Fryer XION 5L', image: '/allways/images/prizes/air-fryer.png' },
      { name: 'Scooter Electrico HYE', image: '/allways/images/prizes/scooter.png' },
      { name: 'Patineta Electrica', image: '/allways/images/prizes/patineta.png' },
      { name: 'Cupon Compra 500.000Gs', image: '/allways/images/prizes/cupon-compra.png' },
    ],
  },
  {
    month: 'Septiembre',
    prizes: [
      { name: 'Motoneta Kenton Viva 110', image: '/allways/images/prizes/moto.png' },
      { name: 'iPhone 16 128GB', image: '/allways/images/prizes/iphone.png' },
      { name: 'Aspiradora Robot XION', image: '/allways/images/prizes/robo-aspirador.png' },
      { name: 'Licuadora XION 380ml', image: '/allways/images/prizes/licuadora-personal.png' },
      { name: 'Cupon Compra 500.000Gs', image: '/allways/images/prizes/cupon-compra.png' },
    ],
  },
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
            Cada mes sorteamos premios entre todos los participantes. Cuantos mas cupones tengas, mas chances de ganar. 30 premios de abril a octubre.
          </p>
        </motion.div>

        <div className="space-y-10">
          {monthlyPrizes.map((monthData, monthIndex) => (
            <motion.div
              key={monthData.month}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: monthIndex * 0.1 }}
            >
              <h3 className="text-allways-gold font-bold text-lg uppercase tracking-wider mb-4 text-center sm:text-left">
                {monthData.month}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
                {monthData.prizes.map((item, index) => (
                  <motion.div
                    key={`${monthData.month}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06 }}
                    className="glass-card text-center group cursor-default"
                  >
                    <div className="w-full aspect-square flex items-center justify-center p-2 my-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <h4 className="text-white font-bold text-sm sm:text-base">{item.name}</h4>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
