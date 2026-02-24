import { useState, useCallback } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ImageDropzone from '../components/form/ImageDropzone'
import useApi from '../hooks/useApi'
import { validateRegistrationForm, DEPARTAMENTOS } from '../utils/validators'

const initialForm = {
  nombre: '',
  cedula: '',
  telefono: '',
  email: '',
  ciudad: '',
  departamento: '',
  numero_factura: '',
  cantidad_productos: '1',
  foto_factura: null,
  foto_productos: null,
}

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [registrationNumber, setRegistrationNumber] = useState('')
  const { loading, post } = useApi()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleFacturaFile = useCallback((file, fileError) => {
    if (fileError) {
      setErrors((prev) => ({ ...prev, foto_factura: fileError }))
      setForm((prev) => ({ ...prev, foto_factura: null }))
    } else {
      setForm((prev) => ({ ...prev, foto_factura: file }))
      setErrors((prev) => {
        const next = { ...prev }
        delete next.foto_factura
        return next
      })
    }
  }, [])

  const handleProductosFile = useCallback((file, fileError) => {
    if (fileError) {
      setErrors((prev) => ({ ...prev, foto_productos: fileError }))
      setForm((prev) => ({ ...prev, foto_productos: null }))
    } else {
      setForm((prev) => ({ ...prev, foto_productos: file }))
      setErrors((prev) => {
        const next = { ...prev }
        delete next.foto_productos
        return next
      })
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validation = validateRegistrationForm(form)
    if (!validation.isValid) {
      setErrors(validation.errors)
      toast.error('Por favor, corregi los campos marcados en rojo.')
      return
    }

    try {
      const formData = new FormData()
      formData.append('nombre', form.nombre.trim())
      formData.append('cedula', form.cedula.replace(/\./g, '').trim())
      formData.append('telefono', form.telefono.trim())
      formData.append('email', form.email.trim())
      formData.append('ciudad', form.ciudad.trim())
      formData.append('departamento', form.departamento)
      formData.append('numeroFactura', form.numero_factura.trim())
      formData.append('cantidadProductos', form.cantidad_productos)
      formData.append('imagenFactura', form.foto_factura)
      if (form.foto_productos) {
        formData.append('imagenProductos', form.foto_productos)
      }
      formData.append('recaptchaToken', 'v3_placeholder_token')

      const result = await post('/registro', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setRegistrationNumber(result.data?.registroId || 'Enviado')
      setShowSuccess(true)
      setForm(initialForm)
      setErrors({})
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al enviar el registro. Intente nuevamente.'
      toast.error(msg)
    }
  }

  return (
    <section className="min-h-screen bg-allways-gray-light py-10">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-allways-blue hover:text-allways-navy text-sm font-medium mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Volver al inicio
          </Link>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-black text-allways-dark uppercase">
                Cargar <span className="text-gold-gradient">Factura</span>
              </h1>
              <p className="text-gray-500 mt-2 text-sm">
                Completa tus datos y subi la foto de tu factura para participar del sorteo.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Personal info */}
              <div className="border-b border-gray-100 pb-5 mb-5">
                <h3 className="text-sm font-bold text-allways-navy uppercase tracking-wider mb-4">Datos Personales</h3>
                <div className="space-y-4">
                  <Input
                    label="Nombre completo"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Juan Perez"
                    error={errors.nombre}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Cedula de Identidad"
                      name="cedula"
                      value={form.cedula}
                      onChange={handleChange}
                      placeholder="Ej: 4123456"
                      error={errors.cedula}
                      required
                      inputMode="numeric"
                    />
                    <Input
                      label="Telefono"
                      name="telefono"
                      value={form.telefono}
                      onChange={handleChange}
                      placeholder="Ej: 0981 123 456"
                      error={errors.telefono}
                      required
                    />
                  </div>

                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Ej: juan@email.com (opcional)"
                    error={errors.email}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Ciudad"
                      name="ciudad"
                      value={form.ciudad}
                      onChange={handleChange}
                      placeholder="Ej: Asuncion"
                      error={errors.ciudad}
                      required
                    />
                    <div className="w-full">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Departamento<span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        name="departamento"
                        value={form.departamento}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 outline-none text-gray-800 bg-white
                          ${errors.departamento
                            ? 'border-red-400 focus:border-red-500'
                            : 'border-gray-200 focus:border-allways-blue focus:ring-2 focus:ring-blue-100'
                          }`}
                      >
                        <option value="">Seleccionar...</option>
                        {DEPARTAMENTOS.map((dep) => (
                          <option key={dep} value={dep}>{dep}</option>
                        ))}
                      </select>
                      {errors.departamento && (
                        <p className="mt-1 text-sm text-red-500 font-medium">{errors.departamento}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice info */}
              <div className="border-b border-gray-100 pb-5 mb-5">
                <h3 className="text-sm font-bold text-allways-navy uppercase tracking-wider mb-4">Datos de la Factura</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Input
                    label="Numero de factura"
                    name="numero_factura"
                    value={form.numero_factura}
                    onChange={handleChange}
                    placeholder="Ej: 001-001-0012345"
                    error={errors.numero_factura}
                    required
                  />
                  <Input
                    label="Cantidad de productos"
                    name="cantidad_productos"
                    type="number"
                    min="1"
                    value={form.cantidad_productos}
                    onChange={handleChange}
                    error={errors.cantidad_productos}
                    required
                  />
                </div>
              </div>

              {/* Image uploads */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-allways-navy uppercase tracking-wider mb-2">Imagenes</h3>

                <ImageDropzone
                  label="Foto de la factura"
                  required
                  error={errors.foto_factura}
                  onFileSelect={handleFacturaFile}
                />

                <ImageDropzone
                  label="Foto de los productos (opcional)"
                  error={errors.foto_productos}
                  onFileSelect={handleProductosFile}
                />
              </div>

              {/* reCAPTCHA v3 hidden */}
              <input type="hidden" name="recaptcha_token" value="v3_placeholder_token" />

              {/* Submit */}
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="gold"
                  loading={loading}
                  className="w-full !py-4 !text-lg"
                >
                  ENVIAR REGISTRO
                </Button>
                <p className="text-xs text-gray-400 text-center mt-3">
                  Al enviar, aceptas las{' '}
                  <Link to="/bases-y-condiciones" className="text-allways-blue underline">
                    Bases y Condiciones
                  </Link>{' '}
                  y la{' '}
                  <Link to="/privacidad" className="text-allways-blue underline">
                    Politica de Privacidad
                  </Link>.
                </p>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Registro Exitoso"
      >
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle size={36} className="text-allways-green" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Tu factura fue registrada!
          </h3>
          <p className="text-gray-500 mb-4">
            Tu numero de registro es:
          </p>
          <div className="bg-allways-dark rounded-xl px-6 py-4 inline-block mb-6">
            <span className="text-allways-gold font-mono text-2xl font-bold">
              {registrationNumber}
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-6">
            Tu registro sera verificado por nuestro equipo. Podes consultar el estado en la seccion "Mis Cupones".
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setShowSuccess(false)}>
              Cargar otra factura
            </Button>
            <Link to="/mis-cupones">
              <Button variant="gold">Ver mis cupones</Button>
            </Link>
          </div>
        </div>
      </Modal>
    </section>
  )
}
