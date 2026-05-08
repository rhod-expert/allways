'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for registration endpoint.
 * 5 requests per IP per 15 minutes.
 */
const registroLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
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
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas consultas. Intente nuevamente en 15 minutos.'
  },
  keyGenerator: (req) => req.ip
});

/**
 * Rate limiter for admin endpoints.
 * 120 requests per IP per minute — accommodates the WhatsApp page,
 * which polls instance status (3s) + messages (5s) + chats (8s).
 */
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: 'draft-7',
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
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesion. Intente nuevamente en 15 minutos.'
  },
  keyGenerator: (req) => req.ip
});

/**
 * Rate limiter for cliente login endpoint (CI + password).
 * 5 attempts per IP per 15 minutes.
 */
const clientLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesion. Intente nuevamente en 15 minutos.'
  },
  keyGenerator: (req) => req.ip
});

/**
 * Rate limiter for cliente password recovery / setup endpoints.
 * 3 attempts per IP per hour - protects against WhatsApp spam abuse.
 */
const clientRecoveryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados pedidos. Intente nuevamente en una hora.'
  },
  keyGenerator: (req) => req.ip
});

/**
 * Rate limiter for authenticated cliente endpoints (dashboard polling, etc.).
 * 60 req/min - more permissive than legacy public consultaLimiter
 * because the cliente already authenticated.
 */
const clientApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Intente nuevamente en un minuto.'
  },
  keyGenerator: (req) => req.ip
});

module.exports = {
  registroLimiter,
  consultaLimiter,
  adminLimiter,
  loginLimiter,
  clientLoginLimiter,
  clientRecoveryLimiter,
  clientApiLimiter
};
