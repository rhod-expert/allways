'use strict';

const config = require('../config/env');

const DEFAULT_CC = String(config.evolution.defaultCountryCode || '595');

function normalizePhone(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D+/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) digits = digits.slice(2);

  if (digits.startsWith(DEFAULT_CC)) {
    let local = digits.slice(DEFAULT_CC.length);
    if (local.startsWith('0')) local = local.replace(/^0+/, '');
    return DEFAULT_CC + local;
  }

  if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');

  if (digits.length <= 11) return DEFAULT_CC + digits;

  return digits;
}

function toRemoteJid(raw) {
  const n = normalizePhone(raw);
  return n ? `${n}@s.whatsapp.net` : null;
}

function fromRemoteJid(jid) {
  if (!jid) return null;
  return jid.split('@')[0].replace(/\D+/g, '');
}

module.exports = { normalizePhone, toRemoteJid, fromRemoteJid };
