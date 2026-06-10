'use strict';

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const dashboardController = require('../controllers/dashboardController');
const couponController = require('../controllers/couponController');
const sorteoController = require('../controllers/sorteoController');
const whatsappController = require('../controllers/whatsappController');
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
router.get('/registros/export', adminController.exportRegistros);
router.get('/registros/:id', adminController.getRegistro);
router.put('/registros/:id/validar', adminController.validarRegistro);
router.put('/registros/:id/revertir', adminController.revertirRegistro);
router.put('/registros/:id', adminController.editarRegistro);

// ---- Participantes ----
router.get('/participantes', adminController.listParticipantes);
router.get('/participantes/export', adminController.exportParticipantes);
router.get('/participantes/:id', adminController.getParticipante);
router.post('/participantes/:id/revocar-sesiones', adminController.revocarSesionesParticipante);

// ---- Cupones ----
router.get('/cupones', couponController.listCupones);

// ---- Sorteos ----
router.get('/sorteos', sorteoController.getResumen);
router.get('/sorteos/:mes', sorteoController.getDetalle);
router.post('/sorteos/:mes/ejecutar', sorteoController.ejecutar);
router.delete('/sorteos/:mes/reset', sorteoController.reset);

// ---- WhatsApp ----
router.get('/whatsapp/instancia', whatsappController.getInstancia);
router.post('/whatsapp/instancia/conectar', whatsappController.connectInstancia);
router.post('/whatsapp/instancia/desconectar', whatsappController.disconnectInstancia);
router.get('/whatsapp/chats', whatsappController.listChats);
router.get('/whatsapp/chats/:chatId/mensajes', whatsappController.listMensajes);
router.post('/whatsapp/chats/:chatId/mensajes', whatsappController.sendMensaje);
router.post('/whatsapp/chats/:chatId/leido', whatsappController.marcarLeido);
router.get('/whatsapp/plantillas', whatsappController.listPlantillas);
router.put('/whatsapp/plantillas/:codigo', whatsappController.updatePlantilla);
router.post('/whatsapp/plantillas/:codigo/preview', whatsappController.previewPlantilla);

module.exports = router;
