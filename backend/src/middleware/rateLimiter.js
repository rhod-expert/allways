'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for registration endpoint.
 * 5 requests per IP per 15 minutes.
 */
const registroLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes de registro. Intente nuevamente en 15 minutos.'
  },
  keyGenerator: (req) => req.ip
});

/**
 * Rate limiter for coupon query endpoint.
 * 10 requests per IP per 15 minutes.
 */
const consultaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas consultas. Intente nuevamente en 15 minutos.'
  },
  keyGenerator: (req) => req.ip
});

/**
 * Rate limiter for admin endpoints.
 * 30 requests per IP per minute.
 */
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Intente nuevamente en un minuto.'
  },
  keyGenerator: (req) => req.ip
});

/**
 * Rate limiter for admin login endpoint.
 * 5 requests per IP per 15 minutes.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesion. Intente nuevamente en 15 minutos.'
  },
  keyGenerator: (req) => req.ip
});

module.exports = {
  registroLimiter,
  consultaLimiter,
  adminLimiter,
  loginLimiter
};
