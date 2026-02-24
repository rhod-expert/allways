'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const config = require('../config/env');

const ALLOWED_TYPES = ['facturas', 'productos'];

/**
 * GET /api/uploads/:type/:filename
 * Serve uploaded images.
 * Admin authentication required for facturas and productos.
 */
router.get('/:type/:filename', verifyToken, (req, res) => {
  const { type, filename } = req.params;

  // Validate type
  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Tipo de archivo no valido.'
    });
  }

  // Prevent directory traversal
  const sanitizedFilename = path.basename(filename);
  if (sanitizedFilename !== filename || filename.includes('..')) {
    return res.status(400).json({
      success: false,
      message: 'Nombre de archivo no valido.'
    });
  }

  const uploadBase = path.resolve(__dirname, '../../', config.upload.dir);
  const filePath = path.join(uploadBase, type, sanitizedFilename);

  // Ensure file exists and is within the uploads directory
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(path.resolve(uploadBase))) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado.'
    });
  }

  if (!fs.existsSync(resolvedPath)) {
    return res.status(404).json({
      success: false,
      message: 'Archivo no encontrado.'
    });
  }

  // Set cache headers
  res.set('Cache-Control', 'private, max-age=3600');

  return res.sendFile(resolvedPath);
});

module.exports = router;
