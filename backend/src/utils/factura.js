'use strict';

// Paraguayan invoice number: establecimiento (3) - punto de expedicion (3) -
// numero (7), e.g. 001-001-0012345. Participants type it in every imaginable
// way (no dashes, spaces, underscores, missing zero padding), and some type the
// 8-digit timbrado instead, which repeats on every invoice from the same store
// and then collides with their earlier registration.
const SEPARATORS_RE = /[\s\-_.]+/;
const DIGITS_RE = /^\d+$/;

function pad(part, width) {
  const trimmed = part.replace(/^0+(?=\d)/, '');
  return trimmed.length > width ? null : trimmed.padStart(width, '0');
}

/**
 * Normalize an invoice number to `XXX-XXX-XXXXXXX`.
 * Accepts three separated groups (padding each one) or exactly 13 digits in
 * any grouping. Anything else - a timbrado, only the last group - is rejected.
 * @param {string} raw - Invoice number as typed.
 * @returns {string|null} Normalized number, or null if it is not one.
 */
function normalizeFactura(raw) {
  const parts = String(raw || '').trim().split(SEPARATORS_RE).filter(Boolean);
  if (parts.length === 0 || !parts.every((p) => DIGITS_RE.test(p))) return null;

  if (parts.length === 3) {
    const est = pad(parts[0], 3);
    const pto = pad(parts[1], 3);
    const num = pad(parts[2], 7);
    if (est && pto && num) return `${est}-${pto}-${num}`;
  }

  const digits = parts.join('');
  if (digits.length !== 13) return null;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

module.exports = { normalizeFactura };
