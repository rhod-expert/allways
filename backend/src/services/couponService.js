'use strict';

const db = require('../config/database');
const queries = require('../models/queries');

/**
 * Spanish month names for MES_SORTEO.
 */
const MESES_ESPANOL = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

/**
 * Get current month name in Spanish.
 * @returns {string}
 */
function getMesSorteo() {
  const now = new Date();
  return MESES_ESPANOL[now.getMonth()];
}

/**
 * Generate a unique coupon code in format AW-2026-XXXXXX.
 * Checks database to ensure uniqueness.
 * @returns {string} Unique coupon code.
 */
async function generateUniqueCouponCode() {
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i++) {
    const randomDigits = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    const code = `AW-2026-${randomDigits}`;

    const existing = await db.execute(queries.CUPON_FIND_BY_CODIGO, { numeroCupon: code });
    if (!existing.rows || existing.rows.length === 0) {
      return code;
    }
  }
  throw new Error('No se pudo generar un codigo de cupon unico despues de varios intentos.');
}

/**
 * Generate N coupons for an approved registration.
 * @param {number} registroId - Registration ID.
 * @param {number} participanteId - Participant ID.
 * @param {number} cantidad - Number of coupons to generate.
 * @returns {array} Array of generated coupon codes.
 */
async function generateCoupons(registroId, participanteId, cantidad) {
  const mesSorteo = getMesSorteo();
  const codes = [];

  for (let i = 0; i < cantidad; i++) {
    const numeroCupon = await generateUniqueCouponCode();
    await db.execute(queries.CUPON_INSERT, {
      numeroCupon,
      registroId,
      participanteId,
      mesSorteo
    });
    codes.push(numeroCupon);
  }

  return codes;
}

/**
 * Query coupons by participant cedula.
 * @param {string} cedula - Participant document number.
 * @returns {object} Participant info + coupons.
 */
async function consultarPorCedula(cedula) {
  if (!cedula || !cedula.trim()) {
    throw Object.assign(new Error('La cedula es obligatoria.'), { statusCode: 400 });
  }

  // Get participant info
  const participanteResult = await db.execute(
    queries.PARTICIPANTE_FIND_BY_CEDULA,
    { cedula: cedula.trim() }
  );

  if (!participanteResult.rows || participanteResult.rows.length === 0) {
    return {
      success: true,
      data: {
        participante: null,
        cupones: [],
        total: 0,
        message: 'No se encontro un participante con esa cedula.'
      }
    };
  }

  const participante = participanteResult.rows[0];

  // Get coupons
  const cuponesResult = await db.execute(
    queries.CUPON_LIST_BY_CEDULA,
    { cedula: cedula.trim() }
  );

  return {
    success: true,
    data: {
      participante: {
        nombre: participante.NOMBRE,
        cedula: participante.CEDULA
      },
      cupones: cuponesResult.rows || [],
      total: (cuponesResult.rows || []).length
    }
  };
}

module.exports = {
  generateCoupons,
  consultarPorCedula,
  getMesSorteo
};
