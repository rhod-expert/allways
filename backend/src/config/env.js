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
  },
  evolution: {
    url: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
    apiKey: process.env.EVOLUTION_API_KEY || '',
    instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'allways-campana',
    defaultCountryCode: process.env.EVOLUTION_DEFAULT_COUNTRY_CODE || '595'
  },
  cliente: {
    jwtSecret: process.env.JWT_SECRET_CLIENTE || process.env.JWT_SECRET,
    jwtExpiresShort: process.env.CLIENTE_JWT_EXPIRES_SHORT || '8h',
    jwtExpiresLong: process.env.CLIENTE_JWT_EXPIRES_LONG || '30d',
    setupTokenMinutes: parseInt(process.env.CLIENTE_SETUP_TOKEN_MIN, 10) || (24 * 60),
    resetTokenMinutes: parseInt(process.env.CLIENTE_RESET_TOKEN_MIN, 10) || 30
  },
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'https://www.sanjosesa.com.py/allways'
};

module.exports = config;
