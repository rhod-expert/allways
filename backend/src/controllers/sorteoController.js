'use strict';

const sorteoService = require('../services/sorteoService');

function handleError(err, res, next) {
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  return next(err);
}

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

/**
 * Coupon numbers for the roulette animation shown before each reveal.
 */
async function getMuestra(req, res, next) {
  try {
    const { mes } = req.params;
    const cupones = await sorteoService.getMuestraCupones(mes);
    return res.json({ success: true, data: { mes, cupones } });
  } catch (err) {
    next(err);
  }
}

/**
 * Draw a single prize, live. One prize per request, one transaction each.
 */
async function ejecutarPremio(req, res, next) {
  try {
    const { mes, premioId } = req.params;
    const id = parseInt(premioId, 10);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Premio invalido.' });
    }

    const resultado = await sorteoService.ejecutarSorteoPremio(mes, id, req.admin.id, req.ip);

    return res.json({
      success: true,
      message: resultado.completo
        ? `Sorteo de ${mes} completado.`
        : `Premio sorteado (${resultado.sorteados}/${resultado.totalPremios}).`,
      data: resultado
    });
  } catch (err) {
    handleError(err, res, next);
  }
}

/**
 * Rehearse a single prize without persisting anything.
 */
async function simularPremio(req, res, next) {
  try {
    const { mes, premioId } = req.params;
    const id = parseInt(premioId, 10);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Premio invalido.' });
    }

    const resultado = await sorteoService.simularSorteoPremio(mes, id, req.admin.id, req.ip);

    return res.json({
      success: true,
      message: 'Simulacion: resultado NO guardado.',
      data: resultado
    });
  } catch (err) {
    handleError(err, res, next);
  }
}

async function reset(req, res, next) {
  try {
    const { mes } = req.params;
    const resultado = await sorteoService.resetSorteo(mes, req.admin.id, req.ip);
    return res.json({ success: true, message: `Sorteo de ${mes} reseteado.`, data: resultado });
  } catch (err) {
    handleError(err, res, next);
  }
}

module.exports = {
  getResumen,
  getDetalle,
  getMuestra,
  ejecutarPremio,
  simularPremio,
  reset
};
