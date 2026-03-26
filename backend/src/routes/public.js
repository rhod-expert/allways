'use strict';

const express = require('express');
const router = express.Router();

const registrationController = require('../controllers/registrationController');
const couponController = require('../controllers/couponController');
const { verifyRecaptcha } = require('../middleware/recaptcha');
const { registroLimiter, consultaLimiter } = require('../middleware/rateLimiter');
const { handleUpload } = require('../middleware/upload');

/**
 * POST /api/registro
 * Register participant + invoice + images (multipart).
 * Rate limited: 5 per IP per 15min.
 * reCAPTCHA verified after file upload (token in body).
 */
router.post(
  '/registro',
  registroLimiter,
  handleUpload,
  verifyRecaptcha,
  registrationController.register
);

/**
 * POST /api/cupones/consulta
 * Query coupons by cedula.
 * Rate limited: 10 per IP per 15min.
 * reCAPTCHA verified.
 */
router.post(
  '/cupones/consulta',
  consultaLimiter,
  verifyRecaptcha,
  couponController.consulta
);

/**
 * GET /api/premios
 * List campaign prizes (public, no auth).
 */
router.get('/premios', couponController.listPremios);

const geoController = require('../controllers/geoController');

// Geographic reference data (public, no auth)
router.get('/geo/departamentos', geoController.getDepartamentos);
router.get('/geo/departamentos/:departamentoId/distritos', geoController.getDistritos);
router.get('/geo/departamentos/:departamentoId/distritos/:distritoId/ciudades', geoController.getCiudades);
router.get('/geo/departamentos/:departamentoId/distritos/:distritoId/ciudades/:ciudadId/barrios', geoController.getBarrios);

module.exports = router;
