'use strict';

const recaptchaService = require('../services/recaptchaService');

/**
 * reCAPTCHA v3 verification middleware.
 * Expects recaptchaToken in the request body.
 */
async function verifyRecaptcha(req, res, next) {
  const token = req.body.recaptchaToken || req.body.recaptcha_token;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token de reCAPTCHA requerido.'
    });
  }

  // Skip verification for placeholder tokens ONLY in development
  if (token === 'v3_placeholder_token' && process.env.NODE_ENV !== 'production') {
    console.warn('[RECAPTCHA] Token placeholder detectado (dev mode) - omitiendo verificacion');
    return next();
  }

  try {
    const result = await recaptchaService.verify(token, req.ip);

    if (!result.success) {
      return res.status(403).json({
        success: false,
        message: 'Verificacion de reCAPTCHA fallida. Intente nuevamente.'
      });
    }

    next();
  } catch (err) {
    console.error('[RECAPTCHA] Error en verificacion:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar reCAPTCHA. Intente nuevamente.'
    });
  }
}

module.exports = { verifyRecaptcha };
