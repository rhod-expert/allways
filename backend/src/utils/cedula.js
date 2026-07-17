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

/**
 * Compute the SET check digit for a CI (base-11 modulus, weights 2..11 cyclic
 * right to left). The digit is derived from the CI, so it is never stored.
 * Deliberately not used to reject input: validated against a single real RUC,
 * which is not enough confidence to block registrations on a mismatch.
 * @param {string} cedula - CI (or RUC; the check digit is ignored).
 * @returns {number} Check digit 0-9.
 */
function calcDV(cedula) {
  const digits = String(cedula || '').replace(/\D/g, '');
  let total = 0;
  let k = 2;
  for (let i = digits.length - 1; i >= 0; i--) {
    total += parseInt(digits[i], 10) * k;
    k = k > 10 ? 2 : k + 1;
  }
  const resto = total % 11;
  return resto > 1 ? 11 - resto : 0;
}

/**
 * Rebuild the full RUC from a stored document.
 * @param {string} cedula - Stored document (normalized CI).
 * @returns {string|null} RUC as `CI-DV`, or null if the document has no RUC
 *   (C. Extranjeria).
 */
function formatRuc(cedula) {
  const key = normalizeCedula(cedula);
  if (!key || !CI_RE.test(key)) return null;
  return `${key}-${calcDV(key)}`;
}

/**
 * Build the LIKE term for a CEDULA search. The admin sees the computed RUC, so
 * pasting it into a search box must find the CI it was normalized to on save.
 * Falls back to the raw text so partial input still matches.
 * @param {string} raw - Search box contents.
 * @returns {string} Term to wrap in `%...%`.
 */
function cedulaSearchTerm(raw) {
  const s = String(raw || '').trim();
  return normalizeCedula(s) || s;
}

module.exports = { normalizeCedula, isValidCedula, calcDV, formatRuc, cedulaSearchTerm };
