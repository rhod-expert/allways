'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const queries = require('../models/queries');
const config = require('../config/env');

/**
 * POST /api/admin/login
 * Authenticate admin user and return JWT.
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contrasena son requeridos.'
      });
    }

    const result = await db.execute(queries.ADMIN_FIND_BY_USERNAME, {
      username: username.trim()
    });

    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales invalidas.'
      });
    }

    const admin = result.rows[0];
    const passwordValid = await bcrypt.compare(password, admin.PASSWORD_HASH);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales invalidas.'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: admin.ID,
        username: admin.USERNAME,
        nombre: admin.NOMBRE,
        rol: admin.ROL
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Update last login timestamp
    await db.execute(queries.ADMIN_UPDATE_LOGIN, {
      id: admin.ID
    });

    // Log the login action
    await db.execute(queries.ADMIN_LOG_INSERT, {
      adminId: admin.ID,
      accion: 'LOGIN',
      detalle: 'Inicio de sesion exitoso',
      ip: req.ip || null
    });

    return res.json({
      success: true,
      message: 'Inicio de sesion exitoso.',
      data: {
        token,
        admin: {
          id: admin.ID,
          username: admin.USERNAME,
          nombre: admin.NOMBRE,
          rol: admin.ROL
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/cambiar-password
 * Change admin password. Requires current password.
 */
async function changePassword(req, res, next) {
  try {
    const { passwordActual, passwordNueva } = req.body;
    const adminId = req.admin.id;

    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({
        success: false,
        message: 'La contrasena actual y la nueva son requeridas.'
      });
    }

    if (passwordNueva.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contrasena debe tener al menos 8 caracteres.'
      });
    }

    // Verify current password
    const result = await db.execute(queries.ADMIN_FIND_BY_ID, { id: adminId });
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Administrador no encontrado.'
      });
    }

    const admin = result.rows[0];
    const passwordValid = await bcrypt.compare(passwordActual, admin.PASSWORD_HASH);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'La contrasena actual es incorrecta.'
      });
    }

    // Hash and update new password
    const newHash = await bcrypt.hash(passwordNueva, 12);
    await db.execute(queries.ADMIN_UPDATE_PASSWORD, {
      passwordHash: newHash,
      id: adminId
    });

    // Log the action
    await db.execute(queries.ADMIN_LOG_INSERT, {
      adminId,
      accion: 'CAMBIAR_PASSWORD',
      detalle: 'Contrasena actualizada exitosamente',
      ip: req.ip || null
    });

    return res.json({
      success: true,
      message: 'Contrasena actualizada exitosamente.'
    });
  } catch (err) {
    next(err);
  }
}

const DEFAULT_ADMINS = [
  {
    username: 'mkt.redessociales2@sanjosesa.com.py',
    password: 'Mkt09@75',
    nombre: 'Marketing Redes Sociales',
    rol: 'ADMIN'
  },
  {
    username: 'marketing@sanjosesa.com.py',
    password: 'Mkt@2809',
    nombre: 'Marketing',
    rol: 'ADMIN'
  }
];

async function ensureAdmin({ username, password, nombre, rol }) {
  const existing = await db.execute(queries.ADMIN_FIND_BY_USERNAME, { username });
  if (existing.rows && existing.rows.length > 0) {
    return false;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await db.execute(queries.ADMIN_INSERT, { username, passwordHash, nombre, rol });
  return true;
}

/**
 * Seed admin users on boot. Creates the primary admin (from env) if the table
 * is empty and always ensures the fixed marketing accounts exist.
 */
async function seedAdmin() {
  try {
    const countResult = await db.execute(queries.ADMIN_COUNT);
    const count = countResult.rows[0].TOTAL;

    if (count === 0) {
      const created = await ensureAdmin({
        username: config.admin.username,
        password: config.admin.password,
        nombre: 'Administrador',
        rol: 'ADMIN'
      });
      if (created) console.log('[AUTH] Usuario administrador principal creado');
    }

    for (const admin of DEFAULT_ADMINS) {
      const created = await ensureAdmin(admin);
      if (created) console.log(`[AUTH] Usuario ${admin.username} creado`);
    }
  } catch (err) {
    console.error('[AUTH] Error al crear usuarios administradores:', err.message);
    // Do not throw - the app can still run if tables don't exist yet
  }
}

module.exports = { login, changePassword, seedAdmin };
