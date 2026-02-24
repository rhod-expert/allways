'use strict';

const dashboardService = require('../services/dashboardService');

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics.
 */
async function getStats(req, res, next) {
  try {
    const stats = await dashboardService.getStats();
    return res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/dashboard/chart
 * Get chart data for registrations (daily + monthly).
 */
async function getChartData(req, res, next) {
  try {
    const chartData = await dashboardService.getChartData();
    return res.json({
      success: true,
      data: chartData
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/dashboard/top-clientes
 * Get top 10 clients by coupons.
 */
async function getTopClientes(req, res, next) {
  try {
    const topClientes = await dashboardService.getTopClientes();
    return res.json({
      success: true,
      data: topClientes
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/dashboard/mapa
 * Get geolocation data grouped by departamento.
 */
async function getMapaData(req, res, next) {
  try {
    const mapaData = await dashboardService.getMapaData();
    return res.json({
      success: true,
      data: mapaData
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStats,
  getChartData,
  getTopClientes,
  getMapaData
};
