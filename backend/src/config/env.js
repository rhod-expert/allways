'use strict';

const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredVars = [
  'PORT',
  'ORACLE_USER',
  'ORACLE_PASSWORD',
  'ORACLE_CONNECTION_STRING',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'RECAPTCHA_SECRET_KEY',
  'RECAPTCHA_MIN_SCORE',
  'CORS_ORIGINS',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD'
];

const missing = requiredVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[ENV] Variables de entorno faltantes: ${missing.join(', ')}`);
  process.exit(1);
}

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'production',
  oracle: {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectionString: process.env.ORACLE_CONNECTION_STRING,
    poolMin: parseInt(process.env.ORACLE_POOL_MIN, 10) || 2,
    poolMax: parseInt(process.env.ORACLE_POOL_MAX, 10) || 10
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  },
  recaptcha: {
    siteKey: process.env.RECAPTCHA_SITE_KEY,
    secretKey: process.env.RECAPTCHA_SECRET_KEY,
    minScore: parseFloat(process.env.RECAPTCHA_MIN_SCORE) || 0.5
  },
  cors: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
      : []
  },
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 5242880,
    dir: process.env.UPLOAD_DIR || './uploads'
  },
  admin: {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD
  }
};

module.exports = config;
