'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * JWT auth for cliente endpoints.
 * Uses a separate secret (config.cliente.jwtSecret) so admin and cliente
 * tokens can't be cross-used. The token MUST carry kind === 'cliente'.
 */
function verifyClientToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. Token no proporcionado.'
    });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.cliente.jwtSecret);
    if (decoded.kind !== 'cliente') {
      return res.status(401).json({ success: false, message: 'Token invalido.' });
    }
    req.cliente = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Sesion expirada. Inicia sesion nuevamente.'
      });
    }
    return res.status(401).json({ success: false, message: 'Token invalido.' });
  }
}

module.exports = { verifyClientToken };
