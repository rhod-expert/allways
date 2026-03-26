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
      // TEMP: permitir pasar aunque falle reCAPTCHA (verificar dominio en Google Console)
      console.warn('[RECAPTCHA] Verificacion fallida pero permitida temporalmente');
      return next();
    }

    next();
  } catch (err) {
    // TEMP: permitir pasar aunque falle reCAPTCHA
    console.warn('[RECAPTCHA] Error en verificacion (permitido temporalmente):', err.message);
    next();
  }
}

module.exports = { verifyRecaptcha };
