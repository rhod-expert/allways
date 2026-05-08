'use strict';

const express = require('express');
const router = express.Router();
const wa = require('../controllers/whatsappController');

/**
 * Only accept webhook deliveries that originated on localhost.
 *
 * Evolution posts directly to http://localhost:3001/api/whatsapp/webhook
 * (it never goes through Nginx). With trust-proxy=1, req.ip is:
 *  - the connection IP when there's no X-Forwarded-For (= direct hit) → 127.0.0.1
 *  - the IP set by Nginx when X-Forwarded-For is present → the real client
 * So accepting only localhost forms is sufficient. Nginx already returns
 * 403 at the edge as a first layer.
 */
function onlyLocalhost(req, res, next) {
  const ip = req.ip;
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return next();
  }
  console.warn('[WA WEBHOOK] non-local request denied from:', ip);
  return res.status(403).end();
}

router.post('/webhook', onlyLocalhost, wa.webhook);
router.post('/webhook/*', onlyLocalhost, wa.webhook);

module.exports = router;
