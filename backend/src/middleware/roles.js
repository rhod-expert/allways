'use strict';

/**
 * Role-based authorization for the admin panel.
 *
 * Roles (ALLWAYS_ADMIN.ROL):
 *   ADMIN        - full access: validate/reject registros, run and reset
 *                  sorteos, edit data, operate WhatsApp.
 *   VISUALIZADOR - read-only: sees the whole panel (dashboard, participantes,
 *                  registros, cupones, sorteos, invoice images) but cannot
 *                  perform any action that changes state.
 *
 * The rule is a deny-by-default on HTTP verb rather than an endpoint
 * whitelist: any new mutating route added later is blocked for
 * VISUALIZADOR without anyone having to remember to guard it.
 */

const ROL_ADMIN = 'ADMIN';
const ROL_VISUALIZADOR = 'VISUALIZADOR';

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Mutating routes a VISUALIZADOR is still allowed to call, because they only
// affect their own account. Paths are relative to the /api/admin mount point.
const SELF_SERVICE_PATHS = new Set(['/cambiar-password']);

function isVisualizador(admin) {
  return String(admin?.rol || '').toUpperCase() === ROL_VISUALIZADOR;
}

/**
 * Blocks every state-changing request for VISUALIZADOR accounts.
 * Must run after verifyToken (needs req.admin.rol).
 */
function restrictVisualizador(req, res, next) {
  if (!isVisualizador(req.admin)) {
    return next();
  }

  if (READ_METHODS.has(req.method) || SELF_SERVICE_PATHS.has(req.path)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Tu usuario tiene permisos de solo lectura. No podes realizar esta accion.'
  });
}

module.exports = {
  ROL_ADMIN,
  ROL_VISUALIZADOR,
  isVisualizador,
  restrictVisualizador
};
