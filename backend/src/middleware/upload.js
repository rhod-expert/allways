'use strict';

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

/**
 * Multer storage configuration.
 * Files are stored in subdirectories (facturas / productos) based on field name.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadBase = path.resolve(__dirname, '../../', config.upload.dir);
    if (file.fieldname === 'imagenFactura') {
      cb(null, path.join(uploadBase, 'facturas'));
    } else if (file.fieldname === 'imagenProductos') {
      cb(null, path.join(uploadBase, 'productos'));
    } else {
      cb(new Error('Campo de archivo no permitido'), null);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

/**
 * File filter: only allow jpg and png.
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan JPG y PNG.'), false);
  }
};

/**
 * Multer upload instance for registration.
 * Expects: imagenFactura (required), imagenProductos (optional)
 */
const uploadRegistro = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize,
    files: 2
  }
}).fields([
  { name: 'imagenFactura', maxCount: 1 },
  { name: 'imagenProductos', maxCount: 1 }
]);

/**
 * Middleware wrapper that handles multer errors gracefully.
 */
function handleUpload(req, res, next) {
  uploadRegistro(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'El archivo excede el tamano maximo permitido (5MB).'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Numero maximo de archivos excedido.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Error de carga: ${err.message}`
      });
    }
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
}

module.exports = { handleUpload };
