'use strict';

// CI: 5-8 digitos. RUC: CI + digito verificador. C. Extranjeria: alfanumerico
// con al menos una letra (sin letra seria una CI y debe cumplir el largo).
const CI_RE = /^\d{5,8}$/;
const RUC_RE = /^(\d{5,8})-\d$/;
const EXTRANJERIA_RE = /^(?=.*[A-Z])[A-Z0-9]{5,15}$/;

function cleanCedula(raw) {
  return String(raw || '').replace(/[.\s]/g, '').trim().toUpperCase();
}

/**
 * Normalize a document to its participant identity key.
 * A Paraguayan RUC is the holder's CI plus a check digit, so both collapse to
 * the same participant and their coupons stay on a single record.
 * @param {string} raw - Document as typed (CI, RUC or C. Extranjeria).
 * @returns {string|null} Normalized key, or null if empty.
 */
function normalizeCedula(raw) {
  const cleaned = cleanCedula(raw);
  if (!cleaned) return null;
  const ruc = cleaned.match(RUC_RE);
  return ruc ? ruc[1] : cleaned;
}

/**
 * @param {string} raw - Document as typed.
 * @returns {boolean} True if it is a valid CI, RUC or C. Extranjeria.
 */
function isValidCedula(raw) {
  const cleaned = cleanCedula(raw);
  if (!cleaned) return false;
  return CI_RE.test(cleaned) || RUC_RE.test(cleaned) || EXTRANJERIA_RE.test(cleaned);
}

module.exports = { normalizeCedula, isValidCedula };
