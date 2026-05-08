'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const db = require('../config/database');

/**
 * JWT authentication middleware for admin endpoints.
 *
 * Validates: signature + expiry + global revocation.
 * Setting ALLWAYS_ADMIN.TOKENS_VALID_SINCE = CURRENT_TIMESTAMP wipes every
 * active session for that admin (used post credential leak or for "log out
 * everywhere" actions).
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. Token no proporcionado.'
    });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Inicie sesion nuevamente.'
      });
    }
    return res.status(401).json({ success: false, message: 'Token invalido.' });
  }

  try {
    const adminId = decoded.id || decoded.sub;
    const r = await db.execute(
      'SELECT TOKENS_VALID_SINCE FROM ALLWAYS_ADMIN WHERE ID = :id',
      { id: adminId }
    );
    const row = r.rows?.[0];
    if (!row) {
      return res.status(401).json({ success: false, message: 'Sesion invalida.' });
    }
    if (row.TOKENS_VALID_SINCE) {
      // JWT.iat has 1-second precision (start of that second). validSinceMs
      // has full DB precision. Revoke if validSinceMs is AT or AFTER the
      // start of the issuance second. A fresh re-login within ~1s of
      // revocation may also be revoked — UI should retry after a beat.
      const iatStartMs = decoded.iat * 1000;
      const validSinceMs = new Date(row.TOKENS_VALID_SINCE).getTime();
      if (validSinceMs >= iatStartMs) {
        return res.status(401).json({
          success: false,
          message: 'Sesion revocada. Inicie sesion nuevamente.'
        });
      }
    }
  } catch (err) {
    console.error('[AUTH] revocation lookup failed:', err.message);
    return res.status(503).json({ success: false, message: 'Servicio no disponible.' });
  }

  req.admin = decoded;
  next();
}

module.exports = { verifyToken };
