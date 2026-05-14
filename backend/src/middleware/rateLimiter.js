'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for registration endpoint.
 * 30 requests per IP per 15 minutes — generoso para NAT compartilhado em PY.
 */
const registroLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
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
 * 60 requests per IP per 15 minutes — generoso para NAT compartilhado em PY.
 */
const consultaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
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
 * 15 attempts per IP per 15 minutes — allows ~3 distinct people behind
 * the same NAT/router to fail their 5-attempt allowance independently.
 * Per-account brute force is separately protected by BLOQUEADO_HASTA
 * (15-min lockout after 5 failures on the same cuenta).
 */
const clientLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
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
