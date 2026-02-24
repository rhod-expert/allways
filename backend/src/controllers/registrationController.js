'use strict';

const registrationService = require('../services/registrationService');

/**
 * POST /api/registro
 * Register a new participation with invoice and product images.
 */
async function register(req, res, next) {
  try {
    const data = { ...req.body, ipRegistro: req.ip || null };
    const result = await registrationService.register(data, req.files);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { register };
