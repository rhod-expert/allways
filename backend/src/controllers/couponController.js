'use strict';

const couponService = require('../services/couponService');
const db = require('../config/database');
const queries = require('../models/queries');

/**
 * POST /api/cupones/consulta
 * Query coupons by cedula (public, with reCAPTCHA).
 */
async function consulta(req, res, next) {
  try {
    const { cedula } = req.body;
    const result = await couponService.consultarPorCedula(cedula);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/premios
 * List all campaign prizes.
 */
async function listPremios(req, res, next) {
  try {
    const result = await db.execute(queries.PREMIO_LIST);
    return res.json({
      success: true,
      data: result.rows || []
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/cupones
 * List all coupons (admin, with pagination).
 */
async function listCupones(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { search, mesSorteo } = req.query;

    let countSql = queries.CUPON_LIST_ALL_COUNT;
    let listSql = queries.CUPON_LIST_ALL;
    const binds = {};

    if (search && search.trim()) {
      const searchFilter = ` AND (P.CEDULA LIKE :search OR UPPER(P.NOMBRE) LIKE :searchName OR C.NUMERO_CUPON LIKE :searchCupon)`;
      countSql += searchFilter;
      listSql += searchFilter;
      binds.search = `%${search.trim()}%`;
      binds.searchName = `%${search.trim().toUpperCase()}%`;
      binds.searchCupon = `%${search.trim().toUpperCase()}%`;
    }

    if (mesSorteo && mesSorteo.trim()) {
      const mesFilter = ` AND C.MES_SORTEO = :mesSorteo`;
      countSql += mesFilter;
      listSql += mesFilter;
      binds.mesSorteo = mesSorteo.trim().toUpperCase();
    }

    listSql += ` ORDER BY C.FECHA_GENERACION DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;

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

module.exports = { consulta, listPremios, listCupones };
