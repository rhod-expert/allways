'use strict';

const path = require('path');
const sharp = require('sharp');
const fs = require('fs').promises;
const oracledb = require('oracledb');
const db = require('../config/database');
const queries = require('../models/queries');
const config = require('../config/env');
const notificationService = require('./notificationService');
const { normalizeCedula, isValidCedula } = require('../utils/cedula');

const MAX_WIDTH = 1920;

/**
 * Strip HTML tags from a string for defense-in-depth.
 */
function stripHtml(str) {
  if (!str) return str;
  return str.replace(/<[^>]*>/g, '').trim();
}

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
    departamentoId, distritoId, ciudadId, barrioId,
    calle, numeroCasa, complemento,
    numeroFactura, cantidadProductos,
    tienda, vendedor
  } = data;

  // Validate required fields
  if (!nombre || !cedula || !telefono || !numeroFactura || !cantidadProductos) {
    throw Object.assign(new Error('Todos los campos obligatorios deben ser completados.'), { statusCode: 400 });
  }
  if (!tienda || !tienda.trim()) {
    throw Object.assign(new Error('El nombre de la tienda / punto de venta es obligatorio.'), { statusCode: 400 });
  }
  if (!isValidCedula(cedula)) {
    throw Object.assign(new Error('Ingrese una CI (5-8 digitos), RUC (ej: 4836971-3) o C. Extranjeria valida.'), { statusCode: 400 });
  }

  // A RUC is the holder's CI plus a check digit: collapse both to one participant.
  const cedulaKey = normalizeCedula(cedula);

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
      { cedula: cedulaKey }
    );

    let participanteId;
    let isNewParticipante = false;

    if (existingResult.rows && existingResult.rows.length > 0) {
      // Participant exists - link to existing
      participanteId = existingResult.rows[0].ID;
    } else {
      isNewParticipante = true;
      // Create new participant (sanitize HTML from all text inputs)
      const insertResult = await connection.execute(
        queries.PARTICIPANTE_INSERT,
        {
          nombre: stripHtml(nombre),
          cedula: cedulaKey,
          telefono: telefono.trim(),
          email: (email || '').trim() || null,
          departamento: stripHtml(departamento || '') || null,
          ciudad: stripHtml(ciudad || '') || null,
          departamentoId: departamentoId ? parseInt(departamentoId, 10) : null,
          distritoId: distritoId ? parseInt(distritoId, 10) : null,
          ciudadId: ciudadId ? parseInt(ciudadId, 10) : null,
          barrioId: barrioId ? parseInt(barrioId, 10) : null,
          calle: stripHtml(calle || '') || null,
          numeroCasa: stripHtml(numeroCasa || '') || null,
          complemento: stripHtml(complemento || '') || null,
          id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        },
        { autoCommit: false }
      );
      participanteId = insertResult.outBinds.id[0];
    }

    // Create registration record
    let registroResult;
    try {
      registroResult = await connection.execute(
        queries.REGISTRO_INSERT,
        {
          participanteId,
          numeroFactura: stripHtml(numeroFactura),
          cantidadProductos: cantidadNum,
          imagenFactura: facturaFile.filename,
          imagenProductos: productosFilename,
          ipRegistro: data.ipRegistro || null,
          tienda: stripHtml(tienda),
          vendedor: stripHtml(vendedor || '') || null,
          id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        },
        { autoCommit: false }
      );
    } catch (e) {
      // ORA-00001: unique_constraint_violation on UK_FACTURA_PART
      if (e && e.errorNum === 1) {
        throw Object.assign(
          new Error('Esta factura ya fue registrada anteriormente.'),
          { statusCode: 409 }
        );
      }
      throw e;
    }

    const registroId = registroResult.outBinds.id[0];

    return {
      participanteId,
      registroId,
      isNewParticipante
    };
  });

  // Fire-and-forget WhatsApp confirmation. Failure must NOT abort registration.
  notificationService.notifyRecibido({
    participante: {
      ID: result.participanteId,
      NOMBRE: nombre,
      TELEFONO: telefono
    },
    registro: {
      ID: result.registroId,
      NUMERO_FACTURA: numeroFactura,
      CANTIDAD_PRODUCTOS: cantidadNum
    }
  }).catch((e) => {
    console.error('[NOTIF] notifyRecibido fallo:', e.message);
  });

  // Brand new participant: send a magic-link to set up their cliente-area password.
  if (result.isNewParticipante) {
    // Lazy require to avoid circular deps at module load.
    const clientAuthService = require('./clientAuthService');
    clientAuthService.dispatchSetupMagicLink({
      participanteId: result.participanteId,
      nombre,
      telefono,
      ipSolicitud: data.ipRegistro || null
    }).catch((e) => {
      console.error('[NOTIF] setup magic link fallo:', e.message);
    });
  }

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
