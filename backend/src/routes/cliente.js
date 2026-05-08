'use strict';

const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/clientAuthController');
const { verifyClientToken } = require('../middleware/clientAuth');
const {
  clientLoginLimiter,
  clientRecoveryLimiter,
  clientApiLimiter
} = require('../middleware/rateLimiter');

// Security: never let intermediaries cache cliente responses (carry tokens, PII).
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'no-referrer');
  next();
});

// ---- Public (rate limited) ----
router.post('/login', clientLoginLimiter, ctrl.login);
router.post('/password/recuperar', clientRecoveryLimiter, ctrl.recuperarPassword);
router.post('/password/setup', clientRecoveryLimiter, ctrl.setupPassword);
router.post('/password/reset', clientRecoveryLimiter, ctrl.resetPassword);

// ---- Authenticated ----
router.use(verifyClientToken);
router.use(clientApiLimiter);

router.post('/logout', ctrl.logout);
router.post('/logout-everywhere', ctrl.logoutEverywhere);
router.get('/me', ctrl.getMe);
router.get('/registros', ctrl.getRegistros);
router.get('/cupones', ctrl.getCupones);
router.post('/password/cambiar', ctrl.changePassword);

module.exports = router;
