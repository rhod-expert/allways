'use strict';

const db = require('../config/database');
const queries = require('../models/queries');
const config = require('../config/env');

/**
 * Sequential (prize-by-prize) draw.
 *
 * Each prize is drawn on its own request, in its own transaction, at the
 * moment it is revealed on screen. This is what makes the draw defensible as
 * a live event: nothing about a prize exists in the database until the instant
 * its winner is announced.
 *
 * The consequence is that a month is legitimately allowed to sit half-drawn
 * (3 of 5 prizes). Callers must therefore reason about `sorteados` / `total`
 * rather than a single boolean.
 */

function httpError(message, statusCode) {
  return Object.assign(new Error(message), { statusCode });
}

/**
 * Get summary of all months with draw status.
 */
async function getResumenMeses() {
  const result = await db.execute(queries.SORTEO_RESUMEN_MESES, {});
  return result.rows || [];
}

async function contarElegibles(mes) {
  const [cuponesResult, participantesResult] = await Promise.all([
    db.execute(queries.SORTEO_CUPONES_ELEGIBLES_COUNT, { mes }),
    db.execute(queries.SORTEO_PARTICIPANTES_ELEGIBLES_COUNT, { mes })
  ]);

  return {
    cupones: cuponesResult.rows?.[0]?.TOTAL || 0,
    participantes: participantesResult.rows?.[0]?.TOTAL || 0
  };
}

/**
 * Get detail for a specific month: prizes + winners + remaining pool.
 */
async function getDetalleMes(mes) {
  const [premiosResult, elegibles] = await Promise.all([
    db.execute(queries.SORTEO_PREMIOS_BY_MES, { mes }),
    contarElegibles(mes)
  ]);

  const premios = premiosResult.rows || [];
  const sorteados = premios.filter((p) => p.CUPON_GANADOR_ID !== null).length;
  const pendientes = premios.length - sorteados;

  return {
    mes,
    premios,
    totalPremios: premios.length,
    sorteados,
    pendientes,
    // The month is only finished when every prize has a winner.
    completo: premios.length > 0 && sorteados === premios.length,
    // A month caught mid-draw: the admin can resume from the next prize.
    enProgreso: sorteados > 0 && sorteados < premios.length,
    totalElegibles: elegibles.cupones,
    participantesElegibles: elegibles.participantes,
    // Not enough distinct people left to fill the prizes still pending.
    participantesInsuficientes: pendientes > 0 && elegibles.participantes < pendientes,
    simulacionHabilitada: config.sorteo.simulacionHabilitada
  };
}

/**
 * Coupon numbers used purely to feed the roulette animation before a reveal.
 */
async function getMuestraCupones(mes) {
  const result = await db.execute(queries.SORTEO_CUPONES_MUESTRA, { mes });
  return (result.rows || []).map((r) => r.NUMERO_CUPON);
}

/**
 * Load a prize and assert it can still be drawn for this month.
 */
async function cargarPremioSorteable(mes, premioId) {
  const result = await db.execute(queries.SORTEO_PREMIO_BY_ID, { premioId });
  const premio = result.rows?.[0];

  if (!premio) {
    throw httpError('El premio no existe o no esta activo.', 404);
  }

  if (String(premio.MES).toUpperCase() !== String(mes).toUpperCase()) {
    throw httpError(`El premio no pertenece al sorteo de ${mes}.`, 400);
  }

  if (premio.CUPON_GANADOR_ID !== null) {
    throw httpError(`El premio "${premio.DESCRIPCION}" ya tiene ganador.`, 409);
  }

  return premio;
}

/**
 * Pick one random winner from the current pot.
 *
 * Read-only: this is the shared core of both the real draw and the simulation,
 * so a simulation exercises exactly the selection the live event will run.
 */
async function seleccionarGanador(mes, premio) {
  const result = await db.execute(queries.SORTEO_CUPON_GANADOR_PICK, { mes });
  const cupon = result.rows?.[0];

  if (!cupon) {
    const elegibles = await contarElegibles(mes);
    if (elegibles.cupones === 0) {
      throw httpError(
        `No quedan cupones elegibles para ${mes}. Cada participante puede ganar un solo premio por mes, ` +
        'y los participantes restantes ya ganaron uno.',
        400
      );
    }
    throw httpError(`No se pudo seleccionar un ganador para ${mes}.`, 400);
  }

  return {
    premioId: premio.ID,
    premioDescripcion: premio.DESCRIPCION,
    premioImagen: premio.IMAGEN,
    cuponId: cupon.ID,
    numeroCupon: cupon.NUMERO_CUPON,
    participanteId: cupon.PARTICIPANTE_ID,
    participanteNombre: cupon.NOMBRE,
    participanteCedula: cupon.CEDULA,
    participanteCiudad: cupon.CIUDAD,
    participanteDepartamento: cupon.DEPARTAMENTO
  };
}

/**
 * Draw ONE prize and persist it (transactional).
 */
async function ejecutarSorteoPremio(mes, premioId, adminId, ip) {
  const premio = await cargarPremioSorteable(mes, premioId);
  const ganador = await seleccionarGanador(mes, premio);

  await db.executeTransaction(async (connection) => {
    // Both updates are guarded on the row still being un-drawn, so two admins
    // drawing the same prize concurrently cannot both succeed.
    const premioUpdate = await connection.execute(queries.SORTEO_MARCAR_GANADOR_PREMIO, {
      cuponId: ganador.cuponId,
      premioId: ganador.premioId
    });

    if (premioUpdate.rowsAffected !== 1) {
      throw httpError(`El premio "${premio.DESCRIPCION}" ya fue sorteado por otro usuario.`, 409);
    }

    const cuponUpdate = await connection.execute(queries.SORTEO_MARCAR_GANADOR_CUPON, {
      cuponId: ganador.cuponId
    });

    if (cuponUpdate.rowsAffected !== 1) {
      throw httpError('El cupon seleccionado ya habia sido marcado como ganador.', 409);
    }

    await connection.execute(queries.ADMIN_LOG_INSERT, {
      adminId,
      accion: 'EJECUTAR_SORTEO_PREMIO',
      detalle:
        `Sorteo ${mes} - premio ${ganador.premioId} (${ganador.premioDescripcion}): ` +
        `cupon ${ganador.numeroCupon} / CI ${ganador.participanteCedula}`,
      ip: ip || 'unknown'
    });
  });

  const detalle = await getDetalleMes(mes);

  return {
    mes,
    simulacion: false,
    ganador,
    sorteados: detalle.sorteados,
    totalPremios: detalle.totalPremios,
    completo: detalle.completo
  };
}

/**
 * Simulate ONE prize: same selection, zero writes to cupones/premios.
 *
 * Gated by SORTEO_SIMULACION_ENABLED so the endpoint simply does not exist in
 * production during the real event.
 */
async function simularSorteoPremio(mes, premioId, adminId, ip) {
  if (!config.sorteo.simulacionHabilitada) {
    throw httpError('La simulacion de sorteos no esta habilitada.', 404);
  }

  const result = await db.execute(queries.SORTEO_PREMIO_BY_ID, { premioId });
  const premio = result.rows?.[0];

  if (!premio) {
    throw httpError('El premio no existe o no esta activo.', 404);
  }

  if (String(premio.MES).toUpperCase() !== String(mes).toUpperCase()) {
    throw httpError(`El premio no pertenece al sorteo de ${mes}.`, 400);
  }

  // Deliberately NOT checking CUPON_GANADOR_ID: rehearsing the presentation on
  // an already-drawn month is the main use case. Note that in that case the
  // real winners are out of the pot, so the simulation shows different people.
  const ganador = await seleccionarGanador(mes, premio);

  // The selection itself writes nothing; the log entry exists so a simulation
  // can never be mistaken for (or hidden as) a real draw in the audit trail.
  await db.execute(queries.ADMIN_LOG_INSERT, {
    adminId,
    accion: 'SIMULAR_SORTEO_PREMIO',
    detalle:
      `SIMULACION ${mes} - premio ${ganador.premioId} (${ganador.premioDescripcion}): ` +
      `cupon ${ganador.numeroCupon} (no persistido)`,
    ip: ip || 'unknown'
  });

  return {
    mes,
    simulacion: true,
    ganador
  };
}

/**
 * Reset draw for a specific month (transactional).
 *
 * Month-level only, on purpose: there is no per-prize reset, so nobody can
 * re-roll a single prize until a preferred name comes up.
 */
async function resetSorteo(mes, adminId, ip) {
  await db.executeTransaction(async (connection) => {
    await connection.execute(queries.SORTEO_RESET_CUPONES, { mes });
    await connection.execute(queries.SORTEO_RESET_PREMIOS, { mes });
    await connection.execute(queries.ADMIN_LOG_INSERT, {
      adminId,
      accion: 'RESET_SORTEO',
      detalle: `Sorteo ${mes}: reseteado`,
      ip: ip || 'unknown'
    });
  });

  return { mes, reseteado: true };
}

module.exports = {
  getResumenMeses,
  getDetalleMes,
  getMuestraCupones,
  ejecutarSorteoPremio,
  simularSorteoPremio,
  resetSorteo
};
