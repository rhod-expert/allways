'use strict';

const db = require('../config/database');
const queries = require('../models/queries');

/**
 * Get dashboard statistics (totals, today, week, month, pending).
 * @returns {object} Stats object.
 */
async function getStats() {
  const [totalsResult, todayResult, weekResult, monthResult] = await Promise.all([
    db.execute(queries.DASHBOARD_STATS_TOTALS),
    db.execute(queries.DASHBOARD_STATS_TODAY),
    db.execute(queries.DASHBOARD_STATS_WEEK),
    db.execute(queries.DASHBOARD_STATS_MONTH)
  ]);

  const totals = totalsResult.rows[0];
  return {
    totalParticipantes: totals.TOTAL_PARTICIPANTES,
    totalRegistros: totals.TOTAL_REGISTROS,
    pendientes: totals.PENDIENTES,
    aceptados: totals.ACEPTADOS,
    rechazados: totals.RECHAZADOS,
    totalCupones: totals.TOTAL_CUPONES,
    registrosHoy: todayResult.rows[0].TOTAL,
    registrosSemana: weekResult.rows[0].TOTAL,
    registrosMes: monthResult.rows[0].TOTAL
  };
}

/**
 * Get chart data: registrations per day (last 30 days) and per month.
 * @returns {object} { daily: [], monthly: [] }
 */
async function getChartData() {
  const [dailyResult, monthlyResult] = await Promise.all([
    db.execute(queries.DASHBOARD_CHART_DAILY),
    db.execute(queries.DASHBOARD_CHART_MONTHLY)
  ]);

  return {
    daily: dailyResult.rows || [],
    monthly: monthlyResult.rows || []
  };
}

/**
 * Get top 10 clients by number of coupons.
 * @returns {array} Array of top clients.
 */
async function getTopClientes() {
  const result = await db.execute(queries.DASHBOARD_TOP_CLIENTES);
  return result.rows || [];
}

/**
 * Get geolocation data grouped by departamento.
 * @returns {array} Array of departamento data.
 */
async function getMapaData() {
  const result = await db.execute(queries.DASHBOARD_MAPA);
  return result.rows || [];
}

module.exports = {
  getStats,
  getChartData,
  getTopClientes,
  getMapaData
};
