'use strict';

const recaptchaService = require('../services/recaptchaService');

/**
 * reCAPTCHA v3 verification middleware.
 * Expects recaptchaToken in the request body.
 *
 * Failure modes:
 *  - missing token            → 400
 *  - Google says invalid      → 403 (with reason logged for diagnosis)
 *  - network error to Google  → 503 (transient, client can retry)
 *
 * In non-production, accepts the literal 'v3_placeholder_token' so
 * end-to-end / manual tests don't need a real Google round-trip.
 */
async function verifyRecaptcha(req, res, next) {
  const token = req.body.recaptchaToken || req.body.recaptcha_token;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token de reCAPTCHA requerido.'
    });
  }

  if (token === 'v3_placeholder_token' && process.env.NODE_ENV !== 'production') {
    console.warn('[RECAPTCHA] placeholder token aceptado (dev mode)');
    return next();
  }

  try {
    const result = await recaptchaService.verify(token, req.ip);

    if (!result.success) {
      // Surface why Google rejected so ops can diagnose (bad domain config,
      // expired token, low score, etc.) without leaking detail to the client.
      console.warn('[RECAPTCHA] verificacion rechazada:', JSON.stringify({
        ip: req.ip,
        score: result.score,
        action: result.action,
        errorCodes: result['error-codes'] || result.errorCodes
      }));
      return res.status(403).json({
        success: false,
        message: 'Verificacion de seguridad fallida. Intenta nuevamente.'
      });
    }

    next();
  } catch (err) {
    // Network error to Google (timeout, DNS, etc.) — not the user's fault.
    // 503 lets the client retry; we don't silently let traffic through.
    console.error('[RECAPTCHA] error de red verificando token:', err.message);
    return res.status(503).json({
      success: false,
      message: 'No se pudo validar la verificacion de seguridad. Reintenta en unos segundos.'
    });
  }
}

module.exports = { verifyRecaptcha };
