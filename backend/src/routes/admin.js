'use strict';

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const dashboardController = require('../controllers/dashboardController');
const couponController = require('../controllers/couponController');
const { verifyToken } = require('../middleware/auth');
const { adminLimiter, loginLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/admin/login
 * Admin authentication - returns JWT.
 * Rate limited: 5 per IP per 15min.
 */
router.post('/login', loginLimiter, authController.login);

// ---- All routes below require JWT authentication ----
router.use(verifyToken);
router.use(adminLimiter);

// ---- Password change ----
router.put('/cambiar-password', authController.changePassword);

// ---- Dashboard ----
router.get('/dashboard/stats', dashboardController.getStats);
router.get('/dashboard/chart', dashboardController.getChartData);
router.get('/dashboard/top-clientes', dashboardController.getTopClientes);
router.get('/dashboard/mapa', dashboardController.getMapaData);

// ---- Registros ----
router.get('/registros', adminController.listRegistros);
router.get('/registros/:id', adminController.getRegistro);
router.put('/registros/:id/validar', adminController.validarRegistro);

// ---- Participantes ----
router.get('/participantes', adminController.listParticipantes);
router.get('/participantes/:id', adminController.getParticipante);

// ---- Cupones ----
router.get('/cupones', couponController.listCupones);

module.exports = router;
