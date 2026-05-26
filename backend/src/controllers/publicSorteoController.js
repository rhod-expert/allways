'use strict';

const db = require('../config/database');
const queries = require('../models/queries');

const WINDOW_AFTER_SORTEO_DAYS = 7;

const MES_ORDER = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const MES_LABEL = {
  ENERO: 'Enero', FEBRERO: 'Febrero', MARZO: 'Marzo', ABRIL: 'Abril',
  MAYO: 'Mayo', JUNIO: 'Junio', JULIO: 'Julio', AGOSTO: 'Agosto',
  SEPTIEMBRE: 'Septiembre', OCTUBRE: 'Octubre', NOVIEMBRE: 'Noviembre',
  DICIEMBRE: 'Diciembre'
};

function daysBetween(a, b) {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * GET /api/sorteo-banner
 * Decide que mensaje mostrar en el banner del header de la landing:
 *   - mode 'ganadores' cuando el sorteo del mes mas reciente termino
 *     hace <= 7 dias (lleva al usuario a ver los ganadores)
 *   - mode 'participar' cuando hay un mes activo aun sin sortear
 *     (lleva a /participar)
 *   - mode 'campana_finalizada' cuando ya no hay nada por sortear
 */
async function getBanner(req, res, next) {
  try {
    const r = await db.execute(queries.SORTEO_BANNER_STATUS);
    const rows = r.rows || [];

    // Index by uppercase month
    const byMes = {};
    rows.forEach((row) => { byMes[String(row.MES).toUpperCase()] = row; });

    const now = new Date();
    const currentMesIdx = now.getMonth(); // 0-based
    const currentMes = MES_ORDER[currentMesIdx];

    // Last completed month (todos premios con ganador, ordenado cronologicamente)
    const completed = MES_ORDER
      .map((m) => byMes[m])
      .filter((row) => row && row.TOTAL_PREMIOS > 0 && row.PREMIOS_SORTEADOS === row.TOTAL_PREMIOS);
    const lastCompleted = completed[completed.length - 1];

    // First month not yet fully drawn (the one we'd want users to participate in)
    const pending = MES_ORDER
      .map((m) => byMes[m])
      .find((row) => row && row.TOTAL_PREMIOS > 0 && row.PREMIOS_SORTEADOS < row.TOTAL_PREMIOS);

    // Mode 1: recent sorteo (<= 7 days) → showcase winners
    if (lastCompleted && lastCompleted.ULTIMO_SORTEO) {
      const since = daysBetween(now, new Date(lastCompleted.ULTIMO_SORTEO));
      if (since >= 0 && since <= WINDOW_AFTER_SORTEO_DAYS) {
        return res.json({
          success: true,
          data: {
            mode: 'ganadores',
            mes: String(lastCompleted.MES).toUpperCase(),
            mesLabel: MES_LABEL[String(lastCompleted.MES).toUpperCase()] || lastCompleted.MES,
            totalPremios: lastCompleted.TOTAL_PREMIOS,
            diasDesdeSorteo: since,
            link: `/ganadores/${String(lastCompleted.MES).toLowerCase()}`
          }
        });
      }
    }

    // Mode 2: pending sorteo → push participation
    if (pending) {
      return res.json({
        success: true,
        data: {
          mode: 'participar',
          mes: String(pending.MES).toUpperCase(),
          mesLabel: MES_LABEL[String(pending.MES).toUpperCase()] || pending.MES,
          premioDestacado: pending.PREMIO_DESTACADO || null,
          link: '/participar'
        }
      });
    }

    // Mode 3: nothing pending and last sorteo > 7 days ago
    if (lastCompleted) {
      return res.json({
        success: true,
        data: {
          mode: 'campana_finalizada',
          mes: String(lastCompleted.MES).toUpperCase(),
          mesLabel: MES_LABEL[String(lastCompleted.MES).toUpperCase()] || lastCompleted.MES,
          link: `/ganadores/${String(lastCompleted.MES).toLowerCase()}`
        }
      });
    }

    // Fallback: no data at all (campaign empty)
    return res.json({
      success: true,
      data: {
        mode: 'participar',
        mes: currentMes,
        mesLabel: MES_LABEL[currentMes] || currentMes,
        link: '/participar'
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/ganadores/:mes
 * Lista publica de ganadores del mes. Solo nombre + ciudad + premio.
 */
async function listGanadores(req, res, next) {
  try {
    const mes = String(req.params.mes || '').trim().toUpperCase();
    if (!MES_ORDER.includes(mes)) {
      return res.status(400).json({
        success: false,
        message: 'Mes invalido.'
      });
    }

    const r = await db.execute(queries.SORTEO_GANADORES_PUBLICOS, { mes });
    const ganadores = (r.rows || []).map((row) => ({
      premioId: row.ID,
      premio: row.PREMIO,
      premioImagen: row.PREMIO_IMAGEN,
      fechaSorteo: row.FECHA_SORTEO,
      ganador: row.GANADOR_NOMBRE,
      ciudad: row.GANADOR_CIUDAD,
      departamento: row.GANADOR_DEPARTAMENTO
    }));

    return res.json({
      success: true,
      data: {
        mes,
        mesLabel: MES_LABEL[mes] || mes,
        ganadores
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBanner,
  listGanadores
};
