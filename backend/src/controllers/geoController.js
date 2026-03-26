'use strict';

const db = require('../config/database');
const queries = require('../models/queries');

async function getDepartamentos(req, res, next) {
  try {
    const result = await db.execute(queries.GEO_DEPARTAMENTOS);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getDistritos(req, res, next) {
  try {
    const { departamentoId } = req.params;
    const result = await db.execute(queries.GEO_DISTRITOS, {
      departamentoId: parseInt(departamentoId, 10)
    });
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getCiudades(req, res, next) {
  try {
    const { departamentoId, distritoId } = req.params;
    const result = await db.execute(queries.GEO_CIUDADES, {
      departamentoId: parseInt(departamentoId, 10),
      distritoId: parseInt(distritoId, 10)
    });
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getBarrios(req, res, next) {
  try {
    const { departamentoId, distritoId, ciudadId } = req.params;
    const result = await db.execute(queries.GEO_BARRIOS, {
      departamentoId: parseInt(departamentoId, 10),
      distritoId: parseInt(distritoId, 10),
      ciudadId: parseInt(ciudadId, 10)
    });
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDepartamentos, getDistritos, getCiudades, getBarrios };
