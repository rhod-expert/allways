'use strict';

const express = require('express');
const router = express.Router();
const wa = require('../controllers/whatsappController');

// Public webhook (called by Evolution API on localhost). No auth — Evolution
// runs on localhost:8080 and only sends to localhost:3001/api/whatsapp/webhook.
router.post('/webhook', wa.webhook);
// Some Evolution events post to /webhook/<event>; accept any subpath.
router.post('/webhook/*', wa.webhook);

module.exports = router;
