'use strict';

const sorteoService = require('../services/sorteoService');

async function getResumen(req, res, next) {
  try {
    const meses = await sorteoService.getResumenMeses();
    return res.json({ success: true, data: meses });
  } catch (err) {
    next(err);
  }
}

async function getDetalle(req, res, next) {
  try {
    const { mes } = req.params;
    const detalle = await sorteoService.getDetalleMes(mes);
    return res.json({ success: true, data: detalle });
  } catch (err) {
    next(err);
  }
}

async function ejecutar(req, res, next) {
  try {
    const { mes } = req.params;
    const adminId = req.admin.id;
    const ip = req.ip;
    const resultado = await sorteoService.ejecutarSorteo(mes, adminId, ip);
    return res.json({ success: true, message: `Sorteo de ${mes} realizado exitosamente.`, data: resultado });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
}

async function reset(req, res, next) {
  try {
    const { mes } = req.params;
    const adminId = req.admin.id;
    const ip = req.ip;
    const resultado = await sorteoService.resetSorteo(mes, adminId, ip);
    return res.json({ success: true, message: `Sorteo de ${mes} reseteado.`, data: resultado });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
}

module.exports = {
  getResumen,
  getDetalle,
  ejecutar,
  reset
};
