'use strict';

const db = require('../config/database');
const queries = require('../models/queries');
const clientAuth = require('../services/clientAuthService');

function reqMeta(req) {
  return {
    ip: req.ip || null,
    userAgent: (req.get('user-agent') || '').slice(0, 300)
  };
}

async function login(req, res, next) {
  try {
    const { cedula, password, recordarme } = req.body || {};
    if (!cedula || !password) {
      return res.status(400).json({ success: false, message: 'Cedula y contrasena son obligatorios.' });
    }
    const result = await clientAuth.login({
      cedula, password,
      rememberMe: !!recordarme,
      ...reqMeta(req)
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) {
      const payload = { success: false, message: err.message };
      if (err.code) payload.code = err.code;
      if (err.retryAfterSeconds) {
        res.set('Retry-After', String(err.retryAfterSeconds));
        payload.retryAfter = err.retryAfterSeconds;
      }
      return res.status(err.statusCode).json(payload);
    }
    next(err);
  }
}

async function logout(req, res) {
  // Stateless JWT: client should drop the token. We log the event.
  await clientAuth.logEvent({
    participanteId: req.cliente?.sub,
    evento: 'LOGOUT',
    exitoso: true,
    ...reqMeta(req)
  });
  return res.json({ success: true });
}

async function recuperarPassword(req, res) {
  // Always returns 200 with a generic message — anti-enumeration.
  const { cedula } = req.body || {};
  if (cedula && String(cedula).trim()) {
    clientAuth.dispatchResetMagicLink({
      cedula: String(cedula).trim(),
      ipSolicitud: req.ip || null
    }).catch((e) => console.error('[CLIENTE] recuperar fallo:', e.message));
  }
  return res.json({
    success: true,
    message: 'Si la cedula esta registrada, te enviamos un enlace por WhatsApp para recuperar tu contrasena.'
  });
}

async function setupPassword(req, res, next) {
  try {
    const { token, password, password2, email } = req.body || {};
    if (!token) return res.status(400).json({ success: false, message: 'Token requerido.' });
    const result = await clientAuth.setupPassword({
      token, password, password2, email,
      ...reqMeta(req)
    });
    return res.json({
      success: true,
      message: 'Contrasena creada. Ya puedes iniciar sesion.',
      data: result
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password, password2 } = req.body || {};
    if (!token) return res.status(400).json({ success: false, message: 'Token requerido.' });
    const result = await clientAuth.resetPassword({
      token, password, password2,
      ...reqMeta(req)
    });
    return res.json({
      success: true,
      message: 'Contrasena actualizada. Ya puedes iniciar sesion.',
      data: result
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { actual, nueva, nueva2 } = req.body || {};
    if (!actual || !nueva) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }
    await clientAuth.changePassword({
      participanteId: req.cliente.sub,
      actual, nueva, nueva2,
      ...reqMeta(req)
    });
    return res.json({ success: true, message: 'Contrasena actualizada.' });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const detail = await clientAuth.findById(req.cliente.sub);
    if (!detail) {
      return res.status(404).json({ success: false, message: 'Participante no encontrado.' });
    }
    return res.json({ success: true, data: detail });
  } catch (err) { next(err); }
}

async function getRegistros(req, res, next) {
  try {
    const r = await db.execute(queries.CLIENTE_REGISTROS, {
      participanteId: req.cliente.sub
    });
    return res.json({ success: true, data: r.rows || [] });
  } catch (err) { next(err); }
}

async function getCupones(req, res, next) {
  try {
    const cuponesRes = await db.execute(queries.CLIENTE_CUPONES, {
      participanteId: req.cliente.sub
    });
    const premiosRes = await db.execute(queries.PREMIO_LIST, {});
    const totales = {
      total: cuponesRes.rows.length,
      ganadores: cuponesRes.rows.filter((c) => c.GANADOR === 'S').length
    };
    return res.json({
      success: true,
      data: {
        cupones: cuponesRes.rows,
        premios: premiosRes.rows,
        totales
      }
    });
  } catch (err) { next(err); }
}

module.exports = {
  login,
  logout,
  recuperarPassword,
  setupPassword,
  resetPassword,
  changePassword,
  getMe,
  getRegistros,
  getCupones
};
