'use strict';

const fs = require('fs');

const db = require('../config/database');
const queries = require('../models/queries');
const couponService = require('../services/couponService');
const registrationService = require('../services/registrationService');
const notificationService = require('../services/notificationService');
const excelExport = require('../services/excelExportService');
const { formatRuc, cedulaSearchTerm } = require('../utils/cedula');
const { normalizeFactura } = require('../utils/factura');

// ALLWAYS_ADMIN_LOG.DETALLE is VARCHAR2(500), and MOTIVO_RECHAZO is itself
// VARCHAR2(500) - a single user-written reason can fill the whole log column on
// its own. Free text going into a log line must be clamped per field, and the
// finished line clamped again as a backstop, or the INSERT fails with ORA-12899
// and takes the whole request down with a 500.
const LOG_DETALLE_MAX = 500;
const LOG_MOTIVO_MAX = 180;

function clampText(text, max) {
  const t = String(text ?? '');
  return t.length <= max ? t : `${t.slice(0, max - 3)}...`;
}

const logMotivo = (text) => clampText(text, LOG_MOTIVO_MAX);
const logDetalle = (text) => clampText(text, LOG_DETALLE_MAX);

const EXPORT_MAX_ROWS = 50000;
const EXPORT_TS = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
};

/**
 * GET /api/admin/registros
 * List registrations with filters and pagination.
 */
async function listRegistros(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { estado, fecha, fechaDesde, fechaHasta, search } = req.query;

    let countSql = queries.REGISTRO_LIST_COUNT;
    let listSql = queries.REGISTRO_LIST;
    const binds = {};

    // Filter by estado
    if (estado && estado.trim()) {
      const estadoFilter = ` AND R.ESTADO = :estado`;
      countSql += estadoFilter;
      listSql += estadoFilter;
      binds.estado = estado.trim().toUpperCase();
    }

    // Filter by exact date
    if (fecha && fecha.trim()) {
      const fechaFilter = ` AND TRUNC(R.FECHA_REGISTRO) = TO_DATE(:fecha, 'YYYY-MM-DD')`;
      countSql += fechaFilter;
      listSql += fechaFilter;
      binds.fecha = fecha.trim();
    }

    // Filter by date range
    if (fechaDesde && fechaDesde.trim()) {
      const desdeFilter = ` AND R.FECHA_REGISTRO >= TO_DATE(:fechaDesde, 'YYYY-MM-DD')`;
      countSql += desdeFilter;
      listSql += desdeFilter;
      binds.fechaDesde = fechaDesde.trim();
    }
    if (fechaHasta && fechaHasta.trim()) {
      const hastaFilter = ` AND R.FECHA_REGISTRO < TO_DATE(:fechaHasta, 'YYYY-MM-DD') + 1`;
      countSql += hastaFilter;
      listSql += hastaFilter;
      binds.fechaHasta = fechaHasta.trim();
    }

    // Search by name, cedula, or factura number
    if (search && search.trim()) {
      const searchFilter = ` AND (P.CEDULA LIKE :search OR UPPER(P.NOMBRE) LIKE :searchUpper OR R.NUMERO_FACTURA LIKE :searchFactura)`;
      countSql += searchFilter;
      listSql += searchFilter;
      binds.search = `%${cedulaSearchTerm(search)}%`;
      binds.searchUpper = `%${search.trim().toUpperCase()}%`;
      binds.searchFactura = `%${search.trim()}%`;
    }

    // Order and paginate
    listSql += ` ORDER BY R.FECHA_REGISTRO DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;

    const countBinds = { ...binds };
    binds.offset = offset;
    binds.limit = limit;

    const [countResult, listResult] = await Promise.all([
      db.execute(countSql, countBinds),
      db.execute(listSql, binds)
    ]);

    const total = countResult.rows[0].TOTAL;

    return res.json({
      success: true,
      data: listResult.rows || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/registros/:id
 * Get registration detail with images.
 */
async function getRegistro(req, res, next) {
  try {
    const { id } = req.params;

    const result = await db.execute(queries.REGISTRO_FIND_BY_ID, {
      id: parseInt(id, 10)
    });

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado.'
      });
    }

    const registro = result.rows[0];

    // Get coupons for this registration
    const cuponesResult = await db.execute(queries.CUPON_LIST_BY_REGISTRO, {
      registroId: parseInt(id, 10)
    });

    return res.json({
      success: true,
      data: {
        ...registro,
        cupones: cuponesResult.rows || []
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/registros/:id/validar
 * Accept or reject a registration. On accept, generate coupons.
 */
async function validarRegistro(req, res, next) {
  try {
    const { id } = req.params;
    const { accion, motivo } = req.body;

    if (!accion || !['ACEPTAR', 'RECHAZAR'].includes(accion.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Accion invalida. Use ACEPTAR o RECHAZAR.'
      });
    }

    const registroId = parseInt(id, 10);

    // Fetch current registration
    const registroResult = await db.execute(queries.REGISTRO_FIND_BY_ID, {
      id: registroId
    });

    if (!registroResult.rows || registroResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado.'
      });
    }

    const registro = registroResult.rows[0];

    if (registro.ESTADO !== 'PENDIENTE') {
      return res.status(400).json({
        success: false,
        message: `El registro ya fue ${registro.ESTADO === 'ACEPTADO' ? 'aceptado' : 'rechazado'}.`
      });
    }

    const isApproving = accion.toUpperCase() === 'ACEPTAR';

    if (!isApproving && (!motivo || !motivo.trim())) {
      return res.status(400).json({
        success: false,
        message: 'El motivo de rechazo es obligatorio.'
      });
    }

    const nuevoEstado = isApproving ? 'ACEPTADO' : 'RECHAZADO';
    const motivoRechazo = isApproving ? null : motivo.trim();

    // Update registration state
    await db.execute(queries.REGISTRO_UPDATE_ESTADO, {
      estado: nuevoEstado,
      validadoPor: req.admin.id,
      motivoRechazo,
      id: registroId
    });

    let cupones = [];
    if (isApproving) {
      // Generate N coupons (1 per product)
      cupones = await couponService.generateCoupons(
        registroId,
        registro.PARTICIPANTE_ID,
        registro.CANTIDAD_PRODUCTOS
      );
    }

    // Log admin action
    await db.execute(queries.ADMIN_LOG_INSERT, {
      adminId: req.admin.id,
      accion: isApproving ? 'ACEPTAR_REGISTRO' : 'RECHAZAR_REGISTRO',
      detalle: isApproving
        ? `Registro #${registroId} aceptado. ${cupones.length} cupones generados.`
        : `Registro #${registroId} rechazado. Motivo: ${motivoRechazo}`,
      ip: req.ip || null
    });

    // Fire-and-forget WhatsApp notification
    if (isApproving) {
      notificationService.notifyAceptado({
        participante: registro,
        registro,
        cupones
      }).catch((e) => console.error('[NOTIF] notifyAceptado fallo:', e.message));
    } else {
      notificationService.notifyRechazado({
        participante: registro,
        registro,
        motivo: motivoRechazo
      }).catch((e) => console.error('[NOTIF] notifyRechazado fallo:', e.message));
    }

    return res.json({
      success: true,
      message: isApproving
        ? `Registro aceptado exitosamente. ${cupones.length} cupones generados.`
        : 'Registro rechazado exitosamente.',
      data: {
        estado: nuevoEstado,
        cupones: isApproving ? cupones : []
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/registros/:id/revertir
 * Revert an already-ACCEPTED registration back to RECHAZADO and cancel
 * (delete) the coupons it generated. Blocked if any of those coupons is
 * already a winner or backs a prize. A motivo is mandatory.
 */
async function revertirRegistro(req, res, next) {
  try {
    const registroId = parseInt(req.params.id, 10);
    if (Number.isNaN(registroId)) {
      return res.status(400).json({ success: false, message: 'ID invalido.' });
    }

    const { motivo } = req.body;
    if (!motivo || !motivo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El motivo de rechazo es obligatorio.'
      });
    }

    // Fetch current registration (also brings participant data for the notif)
    const registroResult = await db.execute(queries.REGISTRO_FIND_BY_ID, {
      id: registroId
    });

    if (!registroResult.rows || registroResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registro no encontrado.' });
    }

    const registro = registroResult.rows[0];

    if (registro.ESTADO !== 'ACEPTADO') {
      return res.status(400).json({
        success: false,
        message: `Solo se pueden revertir registros aceptados (estado actual: ${registro.ESTADO}).`
      });
    }

    // Safety guard: do not delete coupons that already won or back a prize.
    const bloqueadosResult = await db.execute(
      queries.CUPON_COUNT_BLOQUEADOS_BY_REGISTRO,
      { registroId }
    );
    const bloqueados = bloqueadosResult.rows[0].TOTAL;
    if (bloqueados > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede revertir: uno o mas cupones de este registro ya resultaron ganadores o estan asociados a un premio.'
      });
    }

    const motivoRechazo = motivo.trim();

    // Transaction: flip state to RECHAZADO, delete its coupons, log the action.
    const cuponesAnulados = await db.executeTransaction(async (conn) => {
      await conn.execute(queries.REGISTRO_UPDATE_ESTADO, {
        estado: 'RECHAZADO',
        validadoPor: req.admin.id,
        motivoRechazo,
        id: registroId
      });

      const del = await conn.execute(queries.CUPON_DELETE_BY_REGISTRO, { registroId });

      await conn.execute(queries.ADMIN_LOG_INSERT, {
        adminId: req.admin.id,
        accion: 'REVERTIR_REGISTRO',
        detalle: logDetalle(
          `Registro #${registroId} revertido de ACEPTADO a RECHAZADO. `
          + `${del.rowsAffected} cupon(es) anulado(s). Motivo: ${logMotivo(motivoRechazo)}`
        ),
        ip: req.ip || null
      });

      return del.rowsAffected;
    });

    // Fire-and-forget WhatsApp notification (same template as a normal rejection)
    notificationService.notifyRechazado({
      participante: registro,
      registro,
      motivo: motivoRechazo
    }).catch((e) => console.error('[NOTIF] notifyRechazado fallo:', e.message));

    return res.json({
      success: true,
      message: `Registro revertido a rechazado. ${cuponesAnulados} cupon(es) anulado(s).`,
      data: {
        estado: 'RECHAZADO',
        cuponesAnulados
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Reopen a rejected registration: RECHAZADO -> PENDIENTE.
 *
 * The mirror of revertirRegistro. It exists because RECHAZADO was a terminal
 * state: a registro rejected by mistake could not be recovered from the panel,
 * and UK_FACTURA_PART (PARTICIPANTE_ID, NUMERO_FACTURA) blocks the participant
 * from simply submitting that invoice again.
 *
 * It deliberately returns the registro to PENDIENTE rather than straight to
 * ACEPTADO, so it goes through the normal validation path and the acceptance is
 * recorded against whoever actually re-validates it.
 */
async function reabrirRegistro(req, res, next) {
  try {
    const registroId = parseInt(req.params.id, 10);
    if (Number.isNaN(registroId)) {
      return res.status(400).json({ success: false, message: 'ID invalido.' });
    }

    const { motivo } = req.body;
    if (!motivo || !motivo.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El motivo de reapertura es obligatorio.'
      });
    }

    const registroResult = await db.execute(queries.REGISTRO_FIND_BY_ID, { id: registroId });

    if (!registroResult.rows || registroResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Registro no encontrado.' });
    }

    const registro = registroResult.rows[0];

    if (registro.ESTADO !== 'RECHAZADO') {
      return res.status(400).json({
        success: false,
        message: `Solo se pueden reabrir registros rechazados (estado actual: ${registro.ESTADO}).`
      });
    }

    // Invariant check: a rejected registro should carry no coupons. If it does,
    // accepting it again would mint a second set.
    const cuponesResult = await db.execute(queries.CUPON_COUNT_BY_REGISTRO, { registroId });
    const cupones = cuponesResult.rows[0].TOTAL;
    if (cupones > 0) {
      return res.status(409).json({
        success: false,
        message: `No se puede reabrir: el registro conserva ${cupones} cupon(es). Revisalo manualmente antes de reabrirlo.`
      });
    }

    const motivoReapertura = motivo.trim();
    const motivoRechazoPrevio = registro.MOTIVO_RECHAZO || '(sin motivo registrado)';

    await db.executeTransaction(async (conn) => {
      const upd = await conn.execute(queries.REGISTRO_REABRIR, { id: registroId });

      if (upd.rowsAffected !== 1) {
        throw Object.assign(
          new Error('El registro cambio de estado mientras se lo reabria. Recarga la pagina.'),
          { statusCode: 409 }
        );
      }

      await conn.execute(queries.ADMIN_LOG_INSERT, {
        adminId: req.admin.id,
        accion: 'REABRIR_REGISTRO',
        // The rejection reason is wiped from the row, so it is preserved here:
        // otherwise reopening would erase why it had been rejected.
        detalle: logDetalle(
          `Registro #${registroId} reabierto de RECHAZADO a PENDIENTE. `
          + `Motivo del rechazo previo: ${logMotivo(motivoRechazoPrevio)}. `
          + `Motivo de reapertura: ${logMotivo(motivoReapertura)}`
        ),
        ip: req.ip || null
      });
    });

    return res.json({
      success: true,
      message: 'Registro reabierto. Vuelve a la cola de validacion como PENDIENTE.',
      data: {
        estado: 'PENDIENTE',
        motivoRechazoPrevio
      }
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
}

/**
 * Replace the invoice photo of a registration.
 *
 * For the case where the participant uploaded the wrong invoice: instead of
 * rejecting and forcing a re-registration (which UK_FACTURA_PART would block
 * for the same invoice number), an admin swaps the photo in place.
 *
 * Only PENDIENTE and RECHAZADO are allowed. An ACEPTADO registration already
 * minted coupons, and its invoice photo is the evidence behind them - swapping
 * it would rewrite that evidence silently. To fix an accepted one, revert it
 * first (which voids the coupons), then reopen it.
 *
 * The previous file is deliberately left on disk and its name recorded in the
 * audit log, so the original upload can still be produced if it is ever
 * questioned.
 */
async function reemplazarImagenFactura(req, res, next) {
  // Any early return must clean up the file multer already wrote to disk.
  const nuevoArchivo = req.file;

  const descartarArchivo = () => {
    if (!nuevoArchivo) return;
    fs.unlink(nuevoArchivo.path, (e) => {
      if (e) console.error('[UPLOAD] No se pudo borrar el archivo descartado:', e.message);
    });
  };

  try {
    const registroId = parseInt(req.params.id, 10);
    if (Number.isNaN(registroId)) {
      descartarArchivo();
      return res.status(400).json({ success: false, message: 'ID invalido.' });
    }

    if (!nuevoArchivo) {
      return res.status(400).json({
        success: false,
        message: 'Debes adjuntar la nueva foto de la factura (campo imagenFactura).'
      });
    }

    const registroResult = await db.execute(queries.REGISTRO_FIND_BY_ID, { id: registroId });

    if (!registroResult.rows || registroResult.rows.length === 0) {
      descartarArchivo();
      return res.status(404).json({ success: false, message: 'Registro no encontrado.' });
    }

    const registro = registroResult.rows[0];

    if (registro.ESTADO === 'ACEPTADO') {
      descartarArchivo();
      return res.status(409).json({
        success: false,
        message: 'No se puede cambiar la foto de un registro aceptado, porque respalda los '
          + 'cupones ya emitidos. Reverti la aceptacion primero (anula los cupones) y luego reabrilo.'
      });
    }

    // Same sharp validation the public form runs: confirms the real format and
    // resizes. Deletes the file itself when the content is not a valid image.
    try {
      await registrationService.validateAndProcessImage(nuevoArchivo.path);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: e.message || 'La imagen es invalida o esta corrupta.'
      });
    }

    const imagenAnterior = registro.IMAGEN_FACTURA;

    await db.executeTransaction(async (conn) => {
      const upd = await conn.execute(queries.REGISTRO_UPDATE_IMAGEN_FACTURA, {
        imagenFactura: nuevoArchivo.filename,
        id: registroId
      });

      if (upd.rowsAffected !== 1) {
        throw Object.assign(
          new Error('El registro cambio de estado mientras se subia la imagen. Recarga la pagina.'),
          { statusCode: 409 }
        );
      }

      await conn.execute(queries.ADMIN_LOG_INSERT, {
        adminId: req.admin.id,
        accion: 'CAMBIAR_IMAGEN_FACTURA',
        detalle: logDetalle(
          `Registro #${registroId} (${registro.ESTADO}): foto de factura reemplazada. `
          + `Anterior: ${imagenAnterior} (se conserva en disco). Nueva: ${nuevoArchivo.filename}`
        ),
        ip: req.ip || null
      });
    });

    return res.json({
      success: true,
      message: 'Foto de la factura actualizada.',
      data: {
        imagenFactura: nuevoArchivo.filename,
        imagenAnterior
      }
    });
  } catch (err) {
    descartarArchivo();
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
}

/**
 * PUT /api/admin/registros/:id
 * Edit a pending registration's invoice data before approving.
 * Only fields the admin can correct based on the picture: factura number,
 * product count, store, seller. Restricted to PENDIENTE state.
 */
async function editarRegistro(req, res, next) {
  try {
    const registroId = parseInt(req.params.id, 10);
    if (Number.isNaN(registroId)) {
      return res.status(400).json({ success: false, message: 'ID invalido.' });
    }

    const { numeroFactura, cantidadProductos, tienda, vendedor } = req.body || {};

    let numero = (numeroFactura || '').toString().trim();
    if (!numero) {
      return res.status(400).json({ success: false, message: 'El numero de factura es obligatorio.' });
    }
    const cantidad = parseInt(cantidadProductos, 10);
    if (Number.isNaN(cantidad) || cantidad < 1 || cantidad > 999) {
      return res.status(400).json({ success: false, message: 'La cantidad de productos debe ser un entero entre 1 y 999.' });
    }

    const found = await db.execute(queries.REGISTRO_FIND_BY_ID, { id: registroId });
    const registro = found.rows && found.rows[0];
    if (!registro) {
      return res.status(404).json({ success: false, message: 'Registro no encontrado.' });
    }
    if (registro.ESTADO !== 'PENDIENTE') {
      return res.status(400).json({
        success: false,
        message: `Solo se pueden editar registros pendientes (estado actual: ${registro.ESTADO}).`
      });
    }

    // Same rule as the public form. An unchanged number is kept as stored so a
    // registro saved before normalization can still have its other fields fixed.
    if (numero !== registro.NUMERO_FACTURA) {
      numero = normalizeFactura(numero);
      if (!numero) {
        return res.status(400).json({
          success: false,
          message: 'Numero de factura invalido. Use el formato 001-001-0012345 (no el timbrado).'
        });
      }
    }

    try {
      await db.execute(queries.REGISTRO_UPDATE_FIELDS, {
        numeroFactura: numero,
        cantidadProductos: cantidad,
        tienda: (tienda || '').toString().trim() || null,
        vendedor: (vendedor || '').toString().trim() || null,
        id: registroId
      }, { autoCommit: true });
    } catch (e) {
      // ORA-00001 on UK_FACTURA_PART: the participant already has this number.
      if (e && e.errorNum === 1) {
        return res.status(409).json({
          success: false,
          message: `El participante ya tiene otro registro con la factura ${numero}.`
        });
      }
      throw e;
    }

    const diffs = [];
    if (registro.NUMERO_FACTURA !== numero) diffs.push(`factura ${registro.NUMERO_FACTURA} -> ${numero}`);
    if (registro.CANTIDAD_PRODUCTOS !== cantidad) diffs.push(`cantidad ${registro.CANTIDAD_PRODUCTOS} -> ${cantidad}`);
    if ((registro.TIENDA || null) !== ((tienda || '').toString().trim() || null)) diffs.push(`tienda "${registro.TIENDA || ''}" -> "${tienda || ''}"`);
    if ((registro.VENDEDOR || null) !== ((vendedor || '').toString().trim() || null)) diffs.push(`vendedor "${registro.VENDEDOR || ''}" -> "${vendedor || ''}"`);

    await db.execute(queries.ADMIN_LOG_INSERT, {
      adminId: req.admin.id,
      accion: 'EDITAR_REGISTRO',
      detalle: `Registro #${registroId} editado. ${diffs.length ? diffs.join('; ') : 'sin cambios'}`,
      ip: req.ip || null
    });

    return res.json({ success: true, message: 'Registro actualizado.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/participantes
 * List all participants with pagination.
 */
async function listParticipantes(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { search } = req.query;

    let countSql = queries.PARTICIPANTE_LIST_COUNT;
    let listSql = queries.PARTICIPANTE_LIST;
    const binds = {};

    if (search && search.trim()) {
      const searchFilter = ` AND (P.CEDULA LIKE :search OR UPPER(P.NOMBRE) LIKE :searchUpper)`;
      countSql += ` AND (CEDULA LIKE :search OR UPPER(NOMBRE) LIKE :searchUpper)`;
      listSql += searchFilter;
      binds.search = `%${cedulaSearchTerm(search)}%`;
      binds.searchUpper = `%${search.trim().toUpperCase()}%`;
    }

    listSql += ` GROUP BY P.ID, P.NOMBRE, P.CEDULA, P.TELEFONO, P.EMAIL, P.DEPARTAMENTO, P.CIUDAD, P.CALLE, P.NUMERO_CASA, P.COMPLEMENTO, GD.NOMBRE, GDI.NOMBRE, GC.NOMBRE, GB.NOMBRE, P.FECHA_REGISTRO`;
    listSql += ` ORDER BY P.FECHA_REGISTRO DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;

    const countBinds = { ...binds };
    binds.offset = offset;
    binds.limit = limit;

    const [countResult, listResult] = await Promise.all([
      db.execute(countSql, countBinds),
      db.execute(listSql, binds)
    ]);

    const total = countResult.rows[0].TOTAL;

    return res.json({
      success: true,
      data: (listResult.rows || []).map((r) => ({ ...r, RUC: formatRuc(r.CEDULA) })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/participantes/:id
 * Get participant detail with their registrations.
 */
async function getParticipante(req, res, next) {
  try {
    const { id } = req.params;

    const participanteResult = await db.execute(queries.PARTICIPANTE_DETAIL, {
      id: parseInt(id, 10)
    });

    if (!participanteResult.rows || participanteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Participante no encontrado.'
      });
    }

    const participante = participanteResult.rows[0];

    const registrosResult = await db.execute(queries.PARTICIPANTE_REGISTROS, {
      participanteId: parseInt(id, 10)
    });

    // Get coupons for each registration
    const registros = [];
    for (const reg of (registrosResult.rows || [])) {
      const cuponesResult = await db.execute(queries.CUPON_LIST_BY_REGISTRO, {
        registroId: reg.ID
      });
      registros.push({
        ...reg,
        cupones: cuponesResult.rows || []
      });
    }

    return res.json({
      success: true,
      data: {
        ...participante,
        RUC: formatRuc(participante.CEDULA),
        registros
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/participantes/:id/revocar-sesiones
 * Wipes every active cliente session for the participant.
 * Used after a confirmed credential leak / account takeover report.
 */
async function revocarSesionesParticipante(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID invalido.' });
    }
    const clientAuth = require('../services/clientAuthService');
    await clientAuth.revokeAllSessions({
      participanteId: id,
      ip: req.ip || null,
      userAgent: (req.get('user-agent') || '').slice(0, 300),
      reason: `admin:${req.admin?.username || req.admin?.id || 'unknown'}`
    });
    return res.json({ success: true, message: 'Sesiones del cliente revocadas.' });
  } catch (err) { next(err); }
}

/**
 * GET /api/admin/registros/export
 * Devuelve un .xlsx con los registros que pasan los mismos filtros que
 * /admin/registros (search, estado, fecha, fechaDesde, fechaHasta), sin paginar.
 */
async function exportRegistros(req, res, next) {
  try {
    const { estado, fecha, fechaDesde, fechaHasta, search } = req.query;

    let sql = queries.REGISTRO_EXPORT;
    const binds = {};

    if (estado && estado.trim()) {
      sql += ` AND R.ESTADO = :estado`;
      binds.estado = estado.trim().toUpperCase();
    }
    if (fecha && fecha.trim()) {
      sql += ` AND TRUNC(R.FECHA_REGISTRO) = TO_DATE(:fecha, 'YYYY-MM-DD')`;
      binds.fecha = fecha.trim();
    }
    if (fechaDesde && fechaDesde.trim()) {
      sql += ` AND R.FECHA_REGISTRO >= TO_DATE(:fechaDesde, 'YYYY-MM-DD')`;
      binds.fechaDesde = fechaDesde.trim();
    }
    if (fechaHasta && fechaHasta.trim()) {
      sql += ` AND R.FECHA_REGISTRO < TO_DATE(:fechaHasta, 'YYYY-MM-DD') + 1`;
      binds.fechaHasta = fechaHasta.trim();
    }
    if (search && search.trim()) {
      sql += ` AND (P.CEDULA LIKE :search OR UPPER(P.NOMBRE) LIKE :searchUpper OR R.NUMERO_FACTURA LIKE :searchFactura)`;
      binds.search = `%${cedulaSearchTerm(search)}%`;
      binds.searchUpper = `%${search.trim().toUpperCase()}%`;
      binds.searchFactura = `%${search.trim()}%`;
    }

    sql += ` ORDER BY R.FECHA_REGISTRO DESC FETCH FIRST :maxRows ROWS ONLY`;
    binds.maxRows = EXPORT_MAX_ROWS;

    const result = await db.execute(sql, binds);
    const rows = result.rows || [];

    const buffer = await excelExport.buildRegistrosXlsx(rows, {
      adminId: req.admin?.id,
      adminUsername: req.admin?.username,
      filters: { search, estado, fecha, fechaDesde, fechaHasta }
    });

    await db.execute(queries.ADMIN_LOG_INSERT, {
      adminId: req.admin.id,
      accion: 'EXPORT_REGISTROS',
      detalle: `Exportados ${rows.length} registros (filtros: ${JSON.stringify({ search, estado, fecha, fechaDesde, fechaHasta })})`,
      ip: req.ip || null
    });

    const filename = `allways-registros-${EXPORT_TS()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.end(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/participantes/export
 * Devuelve un .xlsx con los participantes filtrados por search, sin paginar.
 */
async function exportParticipantes(req, res, next) {
  try {
    const { search } = req.query;

    let sql = queries.PARTICIPANTE_EXPORT;
    const binds = {};

    if (search && search.trim()) {
      sql += ` AND (P.CEDULA LIKE :search OR UPPER(P.NOMBRE) LIKE :searchUpper)`;
      binds.search = `%${cedulaSearchTerm(search)}%`;
      binds.searchUpper = `%${search.trim().toUpperCase()}%`;
    }

    sql += ` GROUP BY P.ID, P.NOMBRE, P.CEDULA, P.TELEFONO, P.EMAIL, P.DEPARTAMENTO, P.CIUDAD, P.CALLE, P.NUMERO_CASA, P.COMPLEMENTO, GD.NOMBRE, GDI.NOMBRE, GC.NOMBRE, GB.NOMBRE, P.FECHA_REGISTRO, P.ACTIVO`;
    sql += ` ORDER BY P.FECHA_REGISTRO DESC FETCH FIRST :maxRows ROWS ONLY`;
    binds.maxRows = EXPORT_MAX_ROWS;

    const result = await db.execute(sql, binds);
    const rows = result.rows || [];

    const buffer = await excelExport.buildParticipantesXlsx(rows, {
      adminId: req.admin?.id,
      adminUsername: req.admin?.username,
      filters: { search }
    });

    await db.execute(queries.ADMIN_LOG_INSERT, {
      adminId: req.admin.id,
      accion: 'EXPORT_PARTICIPANTES',
      detalle: `Exportados ${rows.length} clientes (filtros: ${JSON.stringify({ search })})`,
      ip: req.ip || null
    });

    const filename = `allways-clientes-${EXPORT_TS()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.end(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listRegistros,
  getRegistro,
  validarRegistro,
  revertirRegistro,
  reabrirRegistro,
  reemplazarImagenFactura,
  editarRegistro,
  listParticipantes,
  getParticipante,
  revocarSesionesParticipante,
  exportRegistros,
  exportParticipantes
};
