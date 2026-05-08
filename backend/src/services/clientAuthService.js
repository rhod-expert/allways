'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const oracledb = require('oracledb');
const config = require('../config/env');
const db = require('../config/database');
const queries = require('../models/queries');
const notificationService = require('./notificationService');

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex'); // 64 chars
}

function buildLink(path, token) {
  const base = config.publicBaseUrl.replace(/\/$/, '');
  return `${base}${path}?t=${token}`;
}

function validatePassword(password) {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return 'La contrasena debe tener al menos 8 caracteres.';
  }
  if (!PASSWORD_RULE.test(password)) {
    return 'La contrasena debe contener al menos una letra y un numero.';
  }
  return null;
}

function validateEmail(email) {
  if (!email || !EMAIL_RULE.test(String(email).trim())) {
    return 'Email invalido.';
  }
  return null;
}

async function logEvent({ participanteId = null, cedula = null, evento, exitoso = true, detalle = null, ip = null, userAgent = null }) {
  try {
    await db.execute(queries.CLIENTE_LOG_INSERT, {
      participanteId,
      cedula: cedula ? String(cedula).slice(0, 20) : null,
      evento: String(evento).slice(0, 40),
      exitoso: exitoso ? 'S' : 'N',
      detalle: detalle ? String(detalle).slice(0, 500) : null,
      ip: ip ? String(ip).slice(0, 45) : null,
      userAgent: userAgent ? String(userAgent).slice(0, 300) : null
    }, { autoCommit: true });
  } catch (e) {
    console.error('[CLIENTE_LOG] insert fallo:', e.message);
  }
}

async function findByCedulaForAuth(cedula) {
  const r = await db.execute(queries.CLIENTE_FIND_BY_CEDULA_AUTH, {
    cedula: String(cedula || '').trim()
  });
  return r.rows?.[0] || null;
}

async function findById(id) {
  const r = await db.execute(queries.CLIENTE_DETAIL_FOR_ME, { id });
  return r.rows?.[0] || null;
}

function signToken(participante, { rememberMe }) {
  const payload = {
    sub: participante.ID,
    cedula: participante.CEDULA,
    nombre: participante.NOMBRE,
    kind: 'cliente'
  };
  return jwt.sign(payload, config.cliente.jwtSecret, {
    expiresIn: rememberMe ? config.cliente.jwtExpiresLong : config.cliente.jwtExpiresShort
  });
}

/**
 * Verify CI + password. Implements lockout: 5 fails -> 15 min block.
 * Throws on failure with statusCode + safe message.
 * Returns the participante row + JWT on success.
 */
async function login({ cedula, password, rememberMe, ip, userAgent }) {
  const participante = await findByCedulaForAuth(cedula);
  if (!participante) {
    await logEvent({ cedula, evento: 'LOGIN', exitoso: false, detalle: 'cedula no existe', ip, userAgent });
    throw Object.assign(new Error('Cedula o contrasena invalidos.'), { statusCode: 401 });
  }
  if (participante.ACTIVO === 'N') {
    await logEvent({ participanteId: participante.ID, cedula, evento: 'LOGIN', exitoso: false, detalle: 'cuenta inactiva', ip, userAgent });
    throw Object.assign(new Error('Cuenta inactiva. Contacta a soporte.'), { statusCode: 403 });
  }
  if (participante.BLOQUEADO_HASTA && new Date(participante.BLOQUEADO_HASTA) > new Date()) {
    const segs = Math.ceil((new Date(participante.BLOQUEADO_HASTA).getTime() - Date.now()) / 1000);
    await logEvent({ participanteId: participante.ID, cedula, evento: 'LOGIN', exitoso: false, detalle: 'cuenta bloqueada', ip, userAgent });
    throw Object.assign(new Error('Cuenta bloqueada temporalmente por intentos fallidos.'), { statusCode: 423, retryAfterSeconds: segs });
  }
  if (!participante.PASSWORD_HASH) {
    await logEvent({ participanteId: participante.ID, cedula, evento: 'LOGIN', exitoso: false, detalle: 'sin password configurada', ip, userAgent });
    throw Object.assign(
      new Error('Aun no creaste tu contrasena. Solicita el enlace por WhatsApp desde "Olvide mi contrasena".'),
      { statusCode: 409, code: 'PASSWORD_NOT_SET' }
    );
  }
  const ok = await bcrypt.compare(password, participante.PASSWORD_HASH);
  if (!ok) {
    await db.execute(queries.CLIENTE_UPDATE_LOGIN_FAIL, { id: participante.ID }, { autoCommit: true });
    await logEvent({ participanteId: participante.ID, cedula, evento: 'LOGIN', exitoso: false, detalle: 'password invalida', ip, userAgent });
    throw Object.assign(new Error('Cedula o contrasena invalidos.'), { statusCode: 401 });
  }
  await db.execute(queries.CLIENTE_UPDATE_LOGIN_OK, { id: participante.ID }, { autoCommit: true });
  await logEvent({ participanteId: participante.ID, cedula, evento: 'LOGIN', exitoso: true, ip, userAgent });

  const token = signToken(participante, { rememberMe: !!rememberMe });
  return {
    token,
    participante: {
      id: participante.ID,
      nombre: participante.NOMBRE,
      cedula: participante.CEDULA,
      email: participante.EMAIL,
      telefono: participante.TELEFONO
    }
  };
}

/**
 * Insert a token row and return the plaintext token (for delivery only).
 * Invalidates any other active token of the same kind for the participant.
 */
async function issueToken({ participanteId, tipo, expiraMinutos, ipSolicitud }) {
  const token = generateToken();
  const tokenHash = sha256(token);

  await db.executeTransaction(async (conn) => {
    await conn.execute(queries.TOKEN_INVALIDATE_ALL_FOR, {
      participanteId, tipo
    });
    await conn.execute(queries.TOKEN_INSERT, {
      participanteId,
      tipo,
      tokenHash,
      expiraMinutos,
      ipSolicitud: ipSolicitud || null,
      id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    });
  });

  return token;
}

/**
 * Validate a token and return the row. Throws on invalid/expired/used.
 */
async function consumeToken({ token, tipo }) {
  if (!token || typeof token !== 'string') {
    throw Object.assign(new Error('Token invalido.'), { statusCode: 400 });
  }
  const tokenHash = sha256(token);
  const r = await db.execute(queries.TOKEN_FIND_BY_HASH, { tokenHash });
  const row = r.rows?.[0];
  if (!row || row.TIPO !== tipo) {
    throw Object.assign(new Error('Enlace invalido.'), { statusCode: 400 });
  }
  if (row.USADO_EN) {
    throw Object.assign(new Error('Este enlace ya fue usado.'), { statusCode: 410 });
  }
  if (new Date(row.EXPIRA_EN) < new Date()) {
    throw Object.assign(new Error('Este enlace expiro.'), { statusCode: 410 });
  }
  return row;
}

/**
 * Setup initial password (from magic link). Requires email.
 */
async function setupPassword({ token, password, password2, email, ip, userAgent }) {
  if (password !== password2) {
    throw Object.assign(new Error('Las contrasenas no coinciden.'), { statusCode: 400 });
  }
  const errPwd = validatePassword(password);
  if (errPwd) throw Object.assign(new Error(errPwd), { statusCode: 400 });
  const errEmail = validateEmail(email);
  if (errEmail) throw Object.assign(new Error(errEmail), { statusCode: 400 });

  const row = await consumeToken({ token, tipo: 'SETUP' });
  const hash = await bcrypt.hash(password, 12);

  await db.executeTransaction(async (conn) => {
    await conn.execute(queries.CLIENTE_SET_PASSWORD, {
      id: row.PARTICIPANTE_ID,
      passwordHash: hash,
      email: email.trim()
    });
    await conn.execute(queries.TOKEN_MARK_USED, { id: row.ID });
    await conn.execute(queries.TOKEN_INVALIDATE_ALL_FOR, {
      participanteId: row.PARTICIPANTE_ID, tipo: 'SETUP'
    });
  });

  await logEvent({ participanteId: row.PARTICIPANTE_ID, evento: 'SETUP_PASSWORD', exitoso: true, ip, userAgent });
  return { participanteId: row.PARTICIPANTE_ID };
}

/**
 * Reset password from a RESET token.
 */
async function resetPassword({ token, password, password2, ip, userAgent }) {
  if (password !== password2) {
    throw Object.assign(new Error('Las contrasenas no coinciden.'), { statusCode: 400 });
  }
  const errPwd = validatePassword(password);
  if (errPwd) throw Object.assign(new Error(errPwd), { statusCode: 400 });

  const row = await consumeToken({ token, tipo: 'RESET' });
  const hash = await bcrypt.hash(password, 12);

  await db.executeTransaction(async (conn) => {
    await conn.execute(queries.CLIENTE_SET_PASSWORD, {
      id: row.PARTICIPANTE_ID,
      passwordHash: hash,
      email: null
    });
    await conn.execute(queries.TOKEN_MARK_USED, { id: row.ID });
    // invalidate any other active reset/setup tokens
    await conn.execute(queries.TOKEN_INVALIDATE_ALL_FOR, {
      participanteId: row.PARTICIPANTE_ID, tipo: 'RESET'
    });
    await conn.execute(queries.TOKEN_INVALIDATE_ALL_FOR, {
      participanteId: row.PARTICIPANTE_ID, tipo: 'SETUP'
    });
    // Wipe every active JWT session — if an attacker triggered the reset
    // (e.g., took the magic link), they don't get to keep their stolen
    // session. Legit user just logs in again.
    await conn.execute(
      'UPDATE ALLWAYS_PARTICIPANTES SET TOKENS_VALID_SINCE = :now WHERE ID = :id',
      { id: row.PARTICIPANTE_ID, now: new Date() }
    );
  });

  await logEvent({ participanteId: row.PARTICIPANTE_ID, evento: 'RESET_PASSWORD', exitoso: true, ip, userAgent });

  // Defense in depth: notify the user that the password was changed.
  notificationService.notifyPasswordCambiada({
    participanteId: row.PARTICIPANTE_ID
  }).catch((e) => console.error('[NOTIF] PASSWORD_CAMBIADA fallo:', e.message));

  return { participanteId: row.PARTICIPANTE_ID };
}

/**
 * Authenticated password change.
 */
async function changePassword({ participanteId, actual, nueva, nueva2, ip, userAgent }) {
  if (nueva !== nueva2) {
    throw Object.assign(new Error('Las contrasenas no coinciden.'), { statusCode: 400 });
  }
  const errPwd = validatePassword(nueva);
  if (errPwd) throw Object.assign(new Error(errPwd), { statusCode: 400 });

  const r = await db.execute(queries.CLIENTE_FIND_BY_CEDULA_AUTH,
    { cedula: '__not_used' });
  // We need a find-by-id for auth; use detail + lookup of password.
  const detail = await findById(participanteId);
  if (!detail) throw Object.assign(new Error('Sesion invalida.'), { statusCode: 401 });

  // Re-fetch the password hash via cedula auth query
  const auth = await findByCedulaForAuth(detail.CEDULA);
  if (!auth || !auth.PASSWORD_HASH) {
    throw Object.assign(new Error('No se puede cambiar la contrasena en este momento.'), { statusCode: 400 });
  }
  const ok = await bcrypt.compare(actual, auth.PASSWORD_HASH);
  if (!ok) {
    await logEvent({ participanteId, evento: 'CHANGE_PASSWORD', exitoso: false, detalle: 'actual invalida', ip, userAgent });
    throw Object.assign(new Error('Contrasena actual incorrecta.'), { statusCode: 401 });
  }
  const hash = await bcrypt.hash(nueva, 12);
  await db.executeTransaction(async (conn) => {
    await conn.execute(queries.CLIENTE_SET_PASSWORD, {
      id: participanteId, passwordHash: hash, email: null
    });
    // Force re-login on every device (including the one we're on — UI handles it)
    await conn.execute(
      'UPDATE ALLWAYS_PARTICIPANTES SET TOKENS_VALID_SINCE = :now WHERE ID = :id',
      { id: participanteId, now: new Date() }
    );
  });

  await logEvent({ participanteId, evento: 'CHANGE_PASSWORD', exitoso: true, ip, userAgent });

  notificationService.notifyPasswordCambiada({ participanteId })
    .catch((e) => console.error('[NOTIF] PASSWORD_CAMBIADA fallo:', e.message));
}

/**
 * Issue + send a SETUP magic link via WhatsApp. Used by:
 *  - registrationService when a new participante is created
 *  - explicit "send me my setup link" public flow
 */
async function dispatchSetupMagicLink({ participanteId, nombre, telefono, ipSolicitud }) {
  const token = await issueToken({
    participanteId,
    tipo: 'SETUP',
    expiraMinutos: config.cliente.setupTokenMinutes,
    ipSolicitud
  });
  const link = buildLink('/cliente/setup-password', token);
  await notificationService.notifySetupPassword({
    participante: { ID: participanteId, NOMBRE: nombre, TELEFONO: telefono },
    link,
    expiraMinutos: config.cliente.setupTokenMinutes
  });
}

/**
 * Issue + send a RESET magic link via WhatsApp.
 * Always returns void to avoid leaking participant existence.
 */
async function dispatchResetMagicLink({ cedula, ipSolicitud }) {
  const participante = await findByCedulaForAuth(cedula);
  if (!participante) {
    // Anti-enumeration: log + return silently.
    await logEvent({ cedula, evento: 'RESET_REQUEST', exitoso: false, detalle: 'cedula no existe', ip: ipSolicitud });
    return;
  }
  const token = await issueToken({
    participanteId: participante.ID,
    tipo: 'RESET',
    expiraMinutos: config.cliente.resetTokenMinutes,
    ipSolicitud
  });
  const link = buildLink('/cliente/reset-password', token);
  try {
    await notificationService.notifyRecuperarPassword({
      participante: {
        ID: participante.ID,
        NOMBRE: participante.NOMBRE,
        TELEFONO: participante.TELEFONO
      },
      link,
      expiraMinutos: config.cliente.resetTokenMinutes
    });
    await logEvent({
      participanteId: participante.ID, cedula, evento: 'RESET_REQUEST', exitoso: true, ip: ipSolicitud
    });
  } catch (e) {
    await logEvent({
      participanteId: participante.ID, cedula, evento: 'RESET_REQUEST', exitoso: false,
      detalle: `whatsapp: ${e.message}`, ip: ipSolicitud
    });
  }
}

/**
 * Revoke every active session for a participante.
 *
 * Uses Node's clock (not Oracle's) so the timestamp is consistent with
 * JWT iat values (which are also derived from Node's clock when tokens
 * are signed here). Avoids issues if the DB and app servers have any
 * clock skew between them.
 */
async function revokeAllSessions({ participanteId, ip, userAgent, reason = 'manual' }) {
  await db.execute(
    'UPDATE ALLWAYS_PARTICIPANTES SET TOKENS_VALID_SINCE = :now WHERE ID = :id',
    { id: participanteId, now: new Date() },
    { autoCommit: true }
  );
  await logEvent({
    participanteId,
    evento: 'REVOKE_ALL_SESSIONS',
    exitoso: true,
    detalle: reason,
    ip, userAgent
  });
}

module.exports = {
  login,
  setupPassword,
  resetPassword,
  changePassword,
  dispatchSetupMagicLink,
  dispatchResetMagicLink,
  findById,
  validatePassword,
  validateEmail,
  logEvent,
  issueToken,
  consumeToken,
  revokeAllSessions
};
