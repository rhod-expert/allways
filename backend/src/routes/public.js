'use strict';

const express = require('express');
const router = express.Router();

const registrationController = require('../controllers/registrationController');
const couponController = require('../controllers/couponController');
const publicSorteoController = require('../controllers/publicSorteoController');
const { registroLimiter, consultaLimiter } = require('../middleware/rateLimiter');
const { handleUpload } = require('../middleware/upload');

/**
 * POST /api/registro
 * Register participant + invoice + images (multipart).
 * Rate limited: 5 per IP per 15min.
 */
router.post(
  '/registro',
  registroLimiter,
  handleUpload,
  registrationController.register
);

/**
 * POST /api/cupones/consulta
 * Query coupons by cedula.
 * Rate limited: 10 per IP per 15min.
 */
router.post(
  '/cupones/consulta',
  consultaLimiter,
  couponController.consulta
);

/**
 * GET /api/premios
 * List campaign prizes (public, no auth).
 */
router.get('/premios', couponController.listPremios);

/**
 * GET /api/sorteo-banner
 * Returns the current state for the landing-page top banner.
 */
router.get('/sorteo-banner', publicSorteoController.getBanner);

/**
 * GET /api/ganadores/:mes
 * Public list of winners for the given month (no PII beyond name + city).
 */
router.get('/ganadores/:mes', publicSorteoController.listGanadores);

const geoController = require('../controllers/geoController');

// Geographic reference data (public, no auth)
router.get('/geo/departamentos', geoController.getDepartamentos);
router.get('/geo/departamentos/:departamentoId/distritos', geoController.getDistritos);
router.get('/geo/departamentos/:departamentoId/distritos/:distritoId/ciudades', geoController.getCiudades);
router.get('/geo/departamentos/:departamentoId/distritos/:distritoId/ciudades/:ciudadId/barrios', geoController.getBarrios);

module.exports = router;
