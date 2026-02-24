/**
 * Validates a Paraguayan cedula (numeric, 5-8 digits)
 */
export function validateCedula(cedula) {
  if (!cedula || typeof cedula !== 'string') return 'La cedula es requerida'
  const cleaned = cedula.replace(/\./g, '').trim()
  if (!/^\d{5,8}$/.test(cleaned)) return 'La cedula debe tener entre 5 y 8 digitos numericos'
  return null
}

/**
 * Validates a Paraguayan phone number
 */
export function validateTelefono(telefono) {
  if (!telefono || typeof telefono !== 'string') return 'El telefono es requerido'
  const cleaned = telefono.replace(/[\s\-\(\)]/g, '')
  if (!/^(\+595|0)?\d{8,10}$/.test(cleaned)) return 'Ingrese un numero de telefono valido (ej: 0981123456)'
  return null
}

/**
 * Validates email (optional field)
 */
export function validateEmail(email) {
  if (!email || email.trim() === '') return null // optional
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(email.trim())) return 'Ingrese un email valido'
  return null
}

/**
 * Validates required field is not empty
 */
export function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} es requerido`
  }
  return null
}

/**
 * Validates invoice number
 */
export function validateFactura(numero) {
  if (!numero || typeof numero !== 'string' || numero.trim() === '') {
    return 'El numero de factura es requerido'
  }
  if (numero.trim().length < 3) {
    return 'El numero de factura debe tener al menos 3 caracteres'
  }
  return null
}

/**
 * Validates product quantity (min 1)
 */
export function validateCantidad(cantidad) {
  const num = parseInt(cantidad, 10)
  if (isNaN(num) || num < 1) return 'La cantidad debe ser al menos 1'
  return null
}

/**
 * Validates an image file (max 5MB, jpg/png)
 */
export function validateImage(file) {
  if (!file) return 'La imagen es requerida'
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
  if (!allowedTypes.includes(file.type)) return 'Solo se aceptan imagenes JPG o PNG'
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) return 'La imagen no puede superar los 5MB'
  return null
}

/**
 * Validate all registration form fields
 */
export function validateRegistrationForm(data) {
  const errors = {}

  const nombreErr = validateRequired(data.nombre, 'El nombre completo')
  if (nombreErr) errors.nombre = nombreErr

  const cedulaErr = validateCedula(data.cedula)
  if (cedulaErr) errors.cedula = cedulaErr

  const telefonoErr = validateTelefono(data.telefono)
  if (telefonoErr) errors.telefono = telefonoErr

  const emailErr = validateEmail(data.email)
  if (emailErr) errors.email = emailErr

  const ciudadErr = validateRequired(data.ciudad, 'La ciudad')
  if (ciudadErr) errors.ciudad = ciudadErr

  const departamentoErr = validateRequired(data.departamento, 'El departamento')
  if (departamentoErr) errors.departamento = departamentoErr

  const facturaErr = validateFactura(data.numero_factura)
  if (facturaErr) errors.numero_factura = facturaErr

  const cantidadErr = validateCantidad(data.cantidad_productos)
  if (cantidadErr) errors.cantidad_productos = cantidadErr

  const imgErr = validateImage(data.foto_factura)
  if (imgErr) errors.foto_factura = imgErr

  // foto_productos is optional, but if provided, validate it
  if (data.foto_productos) {
    const prodImgErr = validateImage(data.foto_productos)
    if (prodImgErr) errors.foto_productos = prodImgErr
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Paraguay departments list
 */
export const DEPARTAMENTOS = [
  'Asuncion',
  'Concepcion',
  'San Pedro',
  'Cordillera',
  'Guaira',
  'Caaguazu',
  'Caazapa',
  'Itapua',
  'Misiones',
  'Paraguari',
  'Alto Parana',
  'Central',
  'Neembucu',
  'Amambay',
  'Canindeyu',
  'Presidente Hayes',
  'Boqueron',
  'Alto Paraguay',
]
