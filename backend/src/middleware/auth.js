'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * JWT authentication middleware.
 * Verifies the Authorization header contains a valid Bearer token.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. Token no proporcionado.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Inicie sesion nuevamente.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token invalido.'
    });
  }
}

module.exports = { verifyToken };
