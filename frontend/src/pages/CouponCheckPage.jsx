import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Ticket, Calendar, Hash } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import useApi from '../hooks/useApi'
import { validateCedula } from '../utils/validators'
import GoldParticles from '../components/landing/GoldParticles'

export default function CouponCheckPage() {
  const [cedula, setCedula] = useState('')
  const [cedulaError, setCedulaError] = useState(null)
  const [coupons, setCoupons] = useState(null)
  const [searched, setSearched] = useState(false)
  const { loading, post } = useApi()

  const handleSearch = async (e) => {
    e.preventDefault()
    const err = validateCedula(cedula)
    if (err) {
      setCedulaError(err)
      return
    }
    setCedulaError(null)

    try {
      const cleanCedula = cedula.replace(/\./g, '').trim()
      const result = await post('/cupones/consulta', { cedula: cleanCedula, recaptchaToken: 'v3_placeholder_token' })
      setCoupons(result.data?.cupones || [])
      setSearched(true)
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al buscar cupones'
      setCedulaError(msg)
      setCoupons(null)
      setSearched(false)
    }
  }

  const validCount = coupons ? coupons.filter((c) => c.ESTADO_REGISTRO === 'ACEPTADO').length : 0

  return (
    <div className="min-h-screen bg-dark-section relative">
      <GoldParticles />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase mb-3">
            Mis <span className="text-gold-gradient">Cupones</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Ingresa tu numero de cedula para consultar tus cupones y ver el estado de tus registros.
          </p>
        </motion.div>

        {/* Search form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSearch}
          className="glass-card mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => { setCedula(e.target.value); setCedulaError(null) }}
                  placeholder="Ingresa tu cedula de identidad"
                  inputMode="numeric"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-gray-400 outline-none focus:border-allways-gold transition-colors"
                />
              </div>
              {cedulaError && (
                <p className="mt-1 text-sm text-red-400 font-medium">{cedulaError}</p>
              )}
            </div>
            <Button type="submit" variant="gold" loading={loading} className="sm:w-auto">
              CONSULTAR
            </Button>
          </div>
        </motion.form>

        {/* Loading */}
        {loading && (
          <div className="py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Results */}
        {!loading && searched && coupons && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Counter */}
            <div className="glass-card mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-allways-gold to-allways-gold-light flex items-center justify-center">
                  <Ticket size={24} className="text-allways-dark" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Total cupones validos</p>
                  <p className="text-3xl font-black text-allways-gold">{validCount}</p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-gray-400 text-xs">Registros totales</p>
                <p className="text-xl font-bold text-white">{coupons.length}</p>
              </div>
            </div>

            {/* Coupons list */}
            {coupons.length === 0 ? (
              <div className="glass-card text-center py-12">
                <Ticket size={48} className="mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400 text-lg font-medium">No se encontraron cupones</p>
                <p className="text-gray-500 text-sm mt-1">Aun no registraste ninguna factura con esta cedula.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {coupons.map((coupon, index) => (
                  <motion.div
                    key={coupon.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card !p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-allways-gold/20 flex items-center justify-center flex-shrink-0">
                        <Hash size={18} className="text-allways-gold" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-bold text-sm truncate">
                          Cupon #{coupon.NUMERO_CUPON || index + 1}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <Calendar size={12} />
                          <span>{coupon.FECHA_GENERACION ? new Date(coupon.FECHA_GENERACION).toLocaleDateString('es-PY') : '-'}</span>
                          {coupon.MES_SORTEO && (
                            <span className="gold-pill !text-[10px] !py-0.5 !px-2">{coupon.MES_SORTEO}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge status={coupon.ESTADO_REGISTRO || 'PENDIENTE'} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
