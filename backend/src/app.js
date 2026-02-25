'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const config = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/uploads');

const app = express();

// ---- Security headers ----
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ---- CORS ----
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (config.cors.origins.includes(origin)) {
      return callback(null, true);
    }
    const err = new Error('Origen no permitido por CORS');
    err.statusCode = 403;
    return callback(err, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));

// ---- Trust proxy (for rate limiter IP detection behind reverse proxy) ----
app.set('trust proxy', 1);

// ---- Body parsers ----
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb', parameterLimit: 20 }));

// ---- Request logging (basic) ----
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl !== '/api/health') {
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
      );
    }
  });
  next();
});

// ---- Health check ----
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Allways Show de Premios API funcionando correctamente.',
    timestamp: new Date().toISOString()
  });
});

// ---- Routes ----
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);

// ---- 404 Handler ----
app.use(notFoundHandler);

// ---- Global error handler ----
app.use(errorHandler);

module.exports = app;
