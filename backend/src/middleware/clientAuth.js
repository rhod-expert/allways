'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const db = require('../config/database');

/**
 * JWT auth for cliente endpoints.
 *
 * Two layers of validity:
 *   1. signature + expiry (jwt.verify)
 *   2. global revocation: rejects tokens whose `iat` is older than the
 *      participante's TOKENS_VALID_SINCE column. Setting this column to
 *      CURRENT_TIMESTAMP wipes every active session for that user — used
 *      after a credential leak or by a "log out everywhere" UI action.
 *
 * Uses a separate secret (config.cliente.jwtSecret) so admin and cliente
 * tokens can't be cross-used. The token MUST carry kind === 'cliente'.
 */
async function verifyClientToken(req, res, next) {
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
    decoded = jwt.verify(token, config.cliente.jwtSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Sesion expirada. Inicia sesion nuevamente.'
      });
    }
    return res.status(401).json({ success: false, message: 'Token invalido.' });
  }

  if (decoded.kind !== 'cliente') {
    return res.status(401).json({ success: false, message: 'Token invalido.' });
  }

  // Global revocation check: TOKENS_VALID_SINCE in DB must be <= JWT.iat
  try {
    const r = await db.execute(
      'SELECT TOKENS_VALID_SINCE FROM ALLWAYS_PARTICIPANTES WHERE ID = :id',
      { id: decoded.sub }
    );
    const row = r.rows?.[0];
    if (!row) {
      return res.status(401).json({ success: false, message: 'Sesion invalida.' });
    }
    if (row.TOKENS_VALID_SINCE) {
      // JWT.iat has 1-second precision (start of that second). validSinceMs
      // has full DB precision. Revoke if validSinceMs falls AT or AFTER the
      // start of the issuance second. Result: tokens issued in the exact
      // same second as the revocation moment are also invalidated. Cost: a
      // fresh re-login within ~1s of revocation may be revoked too — UI
      // should retry after the next second tick.
      const iatStartMs = decoded.iat * 1000;
      const validSinceMs = new Date(row.TOKENS_VALID_SINCE).getTime();
      if (validSinceMs >= iatStartMs) {
        return res.status(401).json({
          success: false,
          message: 'Sesion revocada. Inicia sesion nuevamente.'
        });
      }
    }
  } catch (err) {
    // Fail closed if DB lookup fails — better to log out than to silently let
    // potentially-revoked tokens through.
    console.error('[CLIENT_AUTH] revocation lookup failed:', err.message);
    return res.status(503).json({ success: false, message: 'Servicio no disponible.' });
  }

  req.cliente = decoded;
  next();
}

module.exports = { verifyClientToken };
