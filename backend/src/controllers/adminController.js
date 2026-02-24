'use strict';

const db = require('../config/database');
const queries = require('../models/queries');
const couponService = require('../services/couponService');

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
      binds.search = `%${search.trim()}%`;
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
      binds.search = `%${search.trim()}%`;
      binds.searchUpper = `%${search.trim().toUpperCase()}%`;
    }

    listSql += ` GROUP BY P.ID, P.NOMBRE, P.CEDULA, P.TELEFONO, P.EMAIL, P.DEPARTAMENTO, P.CIUDAD, P.FECHA_REGISTRO`;
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
        registros
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listRegistros,
  getRegistro,
  validarRegistro,
  listParticipantes,
  getParticipante
};
