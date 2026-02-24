'use strict';

const path = require('path');
const sharp = require('sharp');
const fs = require('fs').promises;
const oracledb = require('oracledb');
const db = require('../config/database');
const queries = require('../models/queries');
const config = require('../config/env');

const MAX_WIDTH = 1920;

/**
 * Validate uploaded image using sharp (checks real MIME type).
 * Also resizes if wider than MAX_WIDTH.
 * @param {string} filePath - Path to uploaded file.
 * @returns {object} Image metadata.
 */
async function validateAndProcessImage(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    const allowedFormats = ['jpeg', 'png'];

    if (!allowedFormats.includes(metadata.format)) {
      // Delete the file since it's not valid
      await fs.unlink(filePath).catch(() => {});
      throw Object.assign(new Error('Formato de imagen no valido. Solo se aceptan JPG y PNG.'), { statusCode: 400 });
    }

    // Resize if too wide
    if (metadata.width > MAX_WIDTH) {
      const tempPath = filePath + '.tmp';
      await sharp(filePath)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .toFile(tempPath);
      await fs.unlink(filePath);
      await fs.rename(tempPath, filePath);
    }

    return metadata;
  } catch (err) {
    if (err.statusCode === 400) throw err;
    // Sharp could not read the file - invalid image
    await fs.unlink(filePath).catch(() => {});
    throw Object.assign(new Error('Archivo de imagen corrupto o formato no soportado.'), { statusCode: 400 });
  }
}

/**
 * Register a new participation.
 * - Finds or creates participant by cedula.
 * - Creates registration record.
 * - Validates and processes uploaded images.
 * @param {object} data - Registration form data.
 * @param {object} files - Uploaded files from multer.
 * @returns {object} Registration result.
 */
async function register(data, files) {
  const {
    nombre, cedula, telefono, email,
    departamento, ciudad,
    numeroFactura, cantidadProductos
  } = data;

  // Validate required fields
  if (!nombre || !cedula || !telefono || !numeroFactura || !cantidadProductos) {
    throw Object.assign(new Error('Todos los campos obligatorios deben ser completados.'), { statusCode: 400 });
  }

  // Validate factura image is present
  if (!files || !files.imagenFactura || files.imagenFactura.length === 0) {
    throw Object.assign(new Error('La imagen de la factura es obligatoria.'), { statusCode: 400 });
  }

  const cantidadNum = parseInt(cantidadProductos, 10);
  if (isNaN(cantidadNum) || cantidadNum < 1) {
    throw Object.assign(new Error('La cantidad de productos debe ser al menos 1.'), { statusCode: 400 });
  }

  // Process images with sharp (validate real MIME + resize)
  const facturaFile = files.imagenFactura[0];
  await validateAndProcessImage(facturaFile.path);

  let productosFilename = null;
  if (files.imagenProductos && files.imagenProductos.length > 0) {
    const productosFile = files.imagenProductos[0];
    await validateAndProcessImage(productosFile.path);
    productosFilename = productosFile.filename;
  }

  // Use a transaction for participant + registration
  const result = await db.executeTransaction(async (connection) => {
    // Check if participant already exists
    const existingResult = await connection.execute(
      queries.PARTICIPANTE_FIND_BY_CEDULA,
      { cedula: cedula.trim() }
    );

    let participanteId;

    if (existingResult.rows && existingResult.rows.length > 0) {
      // Participant exists - link to existing
      participanteId = existingResult.rows[0].ID;
    } else {
      // Create new participant
      const insertResult = await connection.execute(
        queries.PARTICIPANTE_INSERT,
        {
          nombre: nombre.trim(),
          cedula: cedula.trim(),
          telefono: telefono.trim(),
          email: (email || '').trim() || null,
          departamento: (departamento || '').trim() || null,
          ciudad: (ciudad || '').trim() || null,
          id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        },
        { autoCommit: false }
      );
      participanteId = insertResult.outBinds.id[0];
    }

    // Create registration record
    const registroResult = await connection.execute(
      queries.REGISTRO_INSERT,
      {
        participanteId,
        numeroFactura: numeroFactura.trim(),
        cantidadProductos: cantidadNum,
        imagenFactura: facturaFile.filename,
        imagenProductos: productosFilename,
        ipRegistro: data.ipRegistro || null,
        id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      },
      { autoCommit: false }
    );

    const registroId = registroResult.outBinds.id[0];

    return {
      participanteId,
      registroId
    };
  });

  return {
    success: true,
    message: 'Registro exitoso. Su participacion sera revisada y aprobada en breve.',
    data: {
      registroId: result.registroId,
      participanteId: result.participanteId
    }
  };
}

module.exports = { register };
