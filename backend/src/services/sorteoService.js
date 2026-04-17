'use strict';

const db = require('../config/database');
const queries = require('../models/queries');

/**
 * Get summary of all months with draw status.
 */
async function getResumenMeses() {
  const result = await db.execute(queries.SORTEO_RESUMEN_MESES, {});
  return result.rows || [];
}

/**
 * Get detail for a specific month: prizes + winners + eligible coupons count.
 */
async function getDetalleMes(mes) {
  const [premiosResult, elegiblesResult] = await Promise.all([
    db.execute(queries.SORTEO_PREMIOS_BY_MES, { mes }),
    db.execute(queries.SORTEO_CUPONES_ELEGIBLES, { mes })
  ]);

  const premios = premiosResult.rows || [];
  const elegibles = elegiblesResult.rows || [];

  const sorteado = premios.some((p) => p.CUPON_GANADOR_ID !== null);

  return {
    mes,
    premios,
    totalElegibles: elegibles.length,
    sorteado
  };
}

/**
 * Execute draw for a specific month (transactional).
 * Randomly assigns one coupon per prize, ensuring no participant wins twice.
 */
async function ejecutarSorteo(mes, adminId, ip) {
  // Pre-flight checks (read-only, no transaction needed)
  const premiosResult = await db.execute(queries.SORTEO_PREMIOS_BY_MES, { mes });
  const premios = premiosResult.rows || [];

  if (premios.length === 0) {
    throw Object.assign(new Error(`No hay premios configurados para el mes: ${mes}`), { statusCode: 400 });
  }

  const yasorteado = premios.some((p) => p.CUPON_GANADOR_ID !== null);
  if (yasorteado) {
    throw Object.assign(new Error(`El sorteo de ${mes} ya fue realizado. Resetee primero si desea repetirlo.`), { statusCode: 400 });
  }

  const elegiblesResult = await db.execute(queries.SORTEO_CUPONES_ELEGIBLES, { mes });
  const elegibles = elegiblesResult.rows || [];

  if (elegibles.length === 0) {
    throw Object.assign(new Error(`No hay cupones elegibles para el mes: ${mes}`), { statusCode: 400 });
  }

  // Pre-select winners in memory (no DB writes yet)
  const ganadores = [];
  const participantesGanadores = new Set();
  let idx = 0;

  for (const premio of premios) {
    let cuponGanador = null;

    while (idx < elegibles.length) {
      const candidato = elegibles[idx];
      idx++;

      if (!participantesGanadores.has(candidato.PARTICIPANTE_ID)) {
        cuponGanador = candidato;
        participantesGanadores.add(candidato.PARTICIPANTE_ID);
        break;
      }
    }

    if (!cuponGanador) {
      throw Object.assign(new Error(
        `No hay suficientes participantes unicos para asignar todos los premios. ` +
        `Se necesitan ${premios.length} participantes distintos, pero solo hay ${participantesGanadores.size} elegibles.`
      ), { statusCode: 400 });
    }

    ganadores.push({
      premioId: premio.ID,
      premioDescripcion: premio.DESCRIPCION,
      cuponId: cuponGanador.ID,
      numeroCupon: cuponGanador.NUMERO_CUPON,
      participanteNombre: cuponGanador.NOMBRE,
      participanteCedula: cuponGanador.CEDULA
    });
  }

  // Execute all writes in a single transaction (all-or-nothing)
  await db.executeTransaction(async (connection) => {
    for (const g of ganadores) {
      await connection.execute(queries.SORTEO_MARCAR_GANADOR_CUPON, {
        cuponId: g.cuponId
      }, { autoCommit: false });

      await connection.execute(queries.SORTEO_MARCAR_GANADOR_PREMIO, {
        cuponId: g.cuponId,
        premioId: g.premioId
      }, { autoCommit: false });
    }

    await connection.execute(queries.ADMIN_LOG_INSERT, {
      adminId,
      accion: 'EJECUTAR_SORTEO',
      detalle: `Sorteo ${mes}: ${ganadores.length} premios asignados`,
      ip: ip || 'unknown'
    }, { autoCommit: false });
  });

  return {
    mes,
    totalPremios: premios.length,
    totalGanadores: ganadores.length,
    ganadores
  };
}

/**
 * Reset draw for a specific month (transactional).
 */
async function resetSorteo(mes, adminId, ip) {
  await db.executeTransaction(async (connection) => {
    await connection.execute(queries.SORTEO_RESET_CUPONES, { mes }, { autoCommit: false });
    await connection.execute(queries.SORTEO_RESET_PREMIOS, { mes }, { autoCommit: false });
    await connection.execute(queries.ADMIN_LOG_INSERT, {
      adminId,
      accion: 'RESET_SORTEO',
      detalle: `Sorteo ${mes}: reseteado`,
      ip: ip || 'unknown'
    }, { autoCommit: false });
  });

  return { mes, reseteado: true };
}

module.exports = {
  getResumenMeses,
  getDetalleMes,
  ejecutarSorteo,
  resetSorteo
};
