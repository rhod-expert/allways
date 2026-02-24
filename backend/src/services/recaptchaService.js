'use strict';

const axios = require('axios');
const config = require('../config/env');

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verify a reCAPTCHA v3 token with Google's API.
 * @param {string} token - The reCAPTCHA response token from the client.
 * @param {string} remoteIp - The client's IP address.
 * @returns {object} { success: boolean, score: number }
 */
async function verify(token, remoteIp) {
  try {
    const response = await axios.post(VERIFY_URL, null, {
      params: {
        secret: config.recaptcha.secretKey,
        response: token,
        remoteip: remoteIp
      },
      timeout: 5000
    });

    const data = response.data;

    if (!data.success) {
      console.warn('[RECAPTCHA] Verificacion fallida:', data['error-codes']);
      return { success: false, score: 0 };
    }

    if (data.score < config.recaptcha.minScore) {
      console.warn(`[RECAPTCHA] Score bajo: ${data.score} (minimo: ${config.recaptcha.minScore})`);
      return { success: false, score: data.score };
    }

    return { success: true, score: data.score };
  } catch (err) {
    console.error('[RECAPTCHA] Error de comunicacion con Google:', err.message);
    throw err;
  }
}

module.exports = { verify };
