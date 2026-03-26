import { useState, useCallback } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { CheckCircle, ArrowLeft, ChevronDown, Loader2 } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ImageDropzone from '../components/form/ImageDropzone'
import useApi from '../hooks/useApi'
import useRecaptcha from '../hooks/useRecaptcha'
import useGeo from '../hooks/useGeo'
import { validateRegistrationForm } from '../utils/validators'

const initialForm = {
  nombre: '',
  cedula: '',
  telefono: '',
  email: '',
  departamento_id: '',
  distrito_id: '',
  ciudad_id: '',
  barrio_id: '',
  calle: '',
  numero_casa: '',
  complemento: '',
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
  const { getToken } = useRecaptcha()
  const {
    departamentos,
    distritos,
    ciudades,
    barrios,
    loadingGeo,
    fetchDistritos,
    fetchCiudades,
    fetchBarrios,
  } = useGeo()

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

  const handleDepartamentoChange = (e) => {
    const depId = e.target.value
    setForm((prev) => ({
      ...prev,
      departamento_id: depId,
      distrito_id: '',
      ciudad_id: '',
      barrio_id: '',
    }))
    fetchDistritos(depId)
    if (errors.departamento_id) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.departamento_id
        return next
      })
    }
  }

  const handleDistritoChange = (e) => {
    const distId = e.target.value
    setForm((prev) => ({
      ...prev,
      distrito_id: distId,
      ciudad_id: '',
      barrio_id: '',
    }))
    fetchCiudades(form.departamento_id, distId)
    if (errors.distrito_id) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.distrito_id
        return next
      })
    }
  }

  const handleCiudadChange = (e) => {
    const ciudId = e.target.value
    setForm((prev) => ({
      ...prev,
      ciudad_id: ciudId,
      barrio_id: '',
    }))
    fetchBarrios(form.departamento_id, form.distrito_id, ciudId)
    if (errors.ciudad_id) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.ciudad_id
        return next
      })
    }
  }

  const handleBarrioChange = (e) => {
    setForm((prev) => ({ ...prev, barrio_id: e.target.value }))
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

    // Build validation-compatible data (map geo IDs to old field names for validator)
    const selectedDep = departamentos.find((d) => String(d.ID) === String(form.departamento_id))
    const selectedCiud = ciudades.find((c) => String(c.ID) === String(form.ciudad_id))

    const validationData = {
      ...form,
      departamento: selectedDep?.NOMBRE || '',
      ciudad: selectedCiud?.NOMBRE || '',
    }

    const validation = validateRegistrationForm(validationData)

    // Add geo-specific validations
    if (!form.departamento_id) {
      validation.errors.departamento_id = 'El departamento es requerido'
      validation.isValid = false
    }
    if (!form.distrito_id) {
      validation.errors.distrito_id = 'El distrito es requerido'
      validation.isValid = false
    }
    if (!form.ciudad_id) {
      validation.errors.ciudad_id = 'La ciudad es requerida'
      validation.isValid = false
    }
    if (!form.calle || !form.calle.trim()) {
      validation.errors.calle = 'La calle es requerida'
      validation.isValid = false
    }
    if (!form.numero_casa || !form.numero_casa.trim()) {
      validation.errors.numero_casa = 'El numero es requerido'
      validation.isValid = false
    }
    // Remove old field errors since we use IDs now
    delete validation.errors.departamento
    delete validation.errors.ciudad

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
      // Send both text names and IDs
      formData.append('departamento', selectedDep?.NOMBRE || '')
      formData.append('ciudad', selectedCiud?.NOMBRE || '')
      formData.append('departamentoId', form.departamento_id)
      formData.append('distritoId', form.distrito_id)
      formData.append('ciudadId', form.ciudad_id)
      if (form.barrio_id) formData.append('barrioId', form.barrio_id)
      formData.append('calle', form.calle.trim())
      formData.append('numeroCasa', form.numero_casa.trim())
      if (form.complemento.trim()) formData.append('complemento', form.complemento.trim())
      formData.append('numeroFactura', form.numero_factura.trim())
      formData.append('cantidadProductos', form.cantidad_productos)
      formData.append('imagenFactura', form.foto_factura)
      if (form.foto_productos) {
        formData.append('imagenProductos', form.foto_productos)
      }
      const recaptchaToken = await getToken('registro')
      formData.append('recaptchaToken', recaptchaToken)

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

  const selectClasses = (hasError) =>
    `w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 outline-none text-gray-800 bg-white appearance-none
     ${hasError
       ? 'border-red-400 focus:border-red-500'
       : 'border-gray-200 focus:border-allways-blue focus:ring-2 focus:ring-blue-100'
     }`

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
                </div>
              </div>

              {/* Location - cascading selects */}
              <div className="border-b border-gray-100 pb-5 mb-5">
                <h3 className="text-sm font-bold text-allways-navy uppercase tracking-wider mb-4">
                  Ubicacion
                  {loadingGeo && <Loader2 size={14} className="inline ml-2 animate-spin text-allways-blue" />}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Departamento */}
                    <GeoSelect
                      label="Departamento"
                      value={form.departamento_id}
                      onChange={handleDepartamentoChange}
                      options={departamentos}
                      placeholder="Seleccionar departamento..."
                      error={errors.departamento_id}
                      required
                      selectClasses={selectClasses}
                    />

                    {/* Distrito */}
                    <GeoSelect
                      label="Distrito"
                      value={form.distrito_id}
                      onChange={handleDistritoChange}
                      options={distritos}
                      placeholder={form.departamento_id ? 'Seleccionar distrito...' : 'Primero selecciona departamento'}
                      error={errors.distrito_id}
                      disabled={!form.departamento_id}
                      required
                      selectClasses={selectClasses}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Ciudad */}
                    <GeoSelect
                      label="Ciudad / Localidad"
                      value={form.ciudad_id}
                      onChange={handleCiudadChange}
                      options={ciudades}
                      placeholder={form.distrito_id ? 'Seleccionar ciudad...' : 'Primero selecciona distrito'}
                      error={errors.ciudad_id}
                      disabled={!form.distrito_id}
                      required
                      selectClasses={selectClasses}
                    />

                    {/* Barrio */}
                    <GeoSelect
                      label="Barrio"
                      value={form.barrio_id}
                      onChange={handleBarrioChange}
                      options={barrios}
                      placeholder={
                        !form.ciudad_id
                          ? 'Primero selecciona ciudad'
                          : barrios.length === 0
                            ? 'Sin barrios disponibles'
                            : 'Seleccionar barrio...'
                      }
                      disabled={!form.ciudad_id || barrios.length === 0}
                      selectClasses={selectClasses}
                      optional
                    />
                  </div>

                  {/* Address fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <Input
                        label="Calle"
                        name="calle"
                        value={form.calle}
                        onChange={handleChange}
                        placeholder="Ej: Av. Mariscal Lopez"
                        error={errors.calle}
                        required
                      />
                    </div>
                    <Input
                      label="Numero"
                      name="numero_casa"
                      value={form.numero_casa}
                      onChange={handleChange}
                      placeholder="Ej: 1234"
                      error={errors.numero_casa}
                      required
                    />
                  </div>

                  <Input
                    label="Complemento"
                    name="complemento"
                    value={form.complemento}
                    onChange={handleChange}
                    placeholder="Ej: Depto 4B, entre calles... (opcional)"
                    error={errors.complemento}
                  />
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

function GeoSelect({ label, value, onChange, options, placeholder, error, disabled, required, optional, selectClasses }) {
  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {optional && <span className="text-gray-400 ml-1 text-xs font-normal">(opcional)</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`${selectClasses(error)} ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.ID} value={opt.ID}>{opt.NOMBRE}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  )
}
