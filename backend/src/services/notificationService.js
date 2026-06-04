'use strict';

const db = require('../config/database');
const queries = require('../models/queries');
const wa = require('./whatsappService');

const MESES_ES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre'
];

function currentMesId(date = new Date()) {
  const idx = date.getMonth();
  return { idx, nombre: MESES_ES[idx], anio: date.getFullYear() };
}

function applyTemplate(text, vars) {
  return String(text || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    const v = vars[k];
    return v == null ? '' : String(v);
  });
}

async function getPlantilla(codigo) {
  const r = await db.execute(queries.WA_PLANTILLA_GET, { codigo });
  if (!r.rows || r.rows.length === 0) {
    throw new Error(`Plantilla no encontrada: ${codigo}`);
  }
  const row = r.rows[0];
  // CLOB needs to be read as string
  let texto = row.TEXTO;
  if (texto && typeof texto.getData === 'function') {
    texto = await texto.getData();
  }
  return { codigo: row.CODIGO, texto };
}

async function logNotif({ registroId, participanteId, tipo, exitoso, mensajeId, errorDetalle }) {
  try {
    await db.execute(queries.WA_NOTIF_LOG_INSERT, {
      registroId,
      participanteId,
      tipo,
      exitoso: exitoso ? 'S' : 'N',
      mensajeId: mensajeId || null,
      errorDetalle: errorDetalle ? String(errorDetalle).slice(0, 1900) : null
    }, { autoCommit: true });
  } catch (e) {
    console.error('[NOTIF] log fallo:', e.message);
  }
}

async function sendAndStore({ participante, registroId, tipo, plantillaCodigo, vars }) {
  const { texto: plantillaTexto } = await getPlantilla(plantillaCodigo);
  const mensaje = applyTemplate(plantillaTexto, vars);

  // `participante` puede ser una fila de ALLWAYS_REGISTROS (que trae PARTICIPANTE_ID
  // junto a su propio ID de registro) o una fila de ALLWAYS_PARTICIPANTES (cuyo ID
  // ya es el del participante). Preferimos PARTICIPANTE_ID para no confundir el ID
  // del registro con el del participante (rompía la FK de ALLWAYS_WA_LOG_NOTIF).
  const participanteId = participante.PARTICIPANTE_ID || participante.participante_id
    || participante.ID || participante.id;

  let chat;
  try {
    chat = await wa.findOrCreateChat({
      phoneRaw: participante.TELEFONO || participante.telefono,
      participanteId,
      nombreContacto: participante.NOMBRE || participante.nombre
    });
  } catch (e) {
    await logNotif({
      registroId, participanteId,
      tipo, exitoso: false, errorDetalle: `chat: ${e.message}`
    });
    throw e;
  }

  let evolutionId = null;
  try {
    const sent = await wa.sendText(chat.TELEFONO || chat.telefono, mensaje);
    evolutionId = sent.id;
  } catch (e) {
    const detalle = e.response?.data ? JSON.stringify(e.response.data).slice(0, 800) : e.message;
    await logNotif({
      registroId, participanteId,
      tipo, exitoso: false, errorDetalle: `evolution: ${detalle}`
    });
    throw e;
  }

  const mensajeId = await wa.recordMessage({
    chatId: chat.ID,
    direccion: 'OUT',
    texto: mensaje,
    evolutionMessageId: evolutionId,
    plantillaCodigo,
    registroId,
    estado: 'enviado'
  });

  await logNotif({
    registroId, participanteId,
    tipo, exitoso: true, mensajeId
  });

  return { mensajeId, evolutionId };
}

async function notifyRecibido({ participante, registro }) {
  return sendAndStore({
    participante,
    registroId: registro.ID || registro.id,
    tipo: 'RECIBIDO',
    plantillaCodigo: 'RECIBIDO',
    vars: {
      nombre: (participante.NOMBRE || participante.nombre || '').split(' ')[0] || 'Hola',
      numeroFactura: registro.NUMERO_FACTURA || registro.numeroFactura,
      cantidadProductos: registro.CANTIDAD_PRODUCTOS || registro.cantidadProductos
    }
  });
}

async function notifyAceptado({ participante, registro, cupones }) {
  const cuponesLista = (cupones || [])
    .map((c) => `• ${typeof c === 'string' ? c : (c.numeroCupon || c.NUMERO_CUPON || c.numero_cupon)}`)
    .join('\n');

  const mes = currentMesId();
  const premiosResult = await db.execute(`
    SELECT DESCRIPCION FROM ALLWAYS_PREMIOS
    WHERE LOWER(MES) = :mes AND ACTIVO = 'S' AND CUPON_GANADOR_ID IS NULL
    ORDER BY ID
  `, { mes: mes.nombre });
  const premiosMes = (premiosResult.rows || [])
    .map((p) => `• ${p.DESCRIPCION}`)
    .join('\n') || '• Premios sorpresa del mes 🎁';

  return sendAndStore({
    participante,
    registroId: registro.ID || registro.id,
    tipo: 'ACEPTADO',
    plantillaCodigo: 'ACEPTADO',
    vars: {
      nombre: (participante.NOMBRE || participante.nombre || '').split(' ')[0] || 'Hola',
      cuponesLista,
      mesActual: mes.nombre,
      premiosMes
    }
  });
}

async function notifyRechazado({ participante, registro, motivo }) {
  return sendAndStore({
    participante,
    registroId: registro.ID || registro.id,
    tipo: 'RECHAZADO',
    plantillaCodigo: 'RECHAZADO',
    vars: {
      nombre: (participante.NOMBRE || participante.nombre || '').split(' ')[0] || 'Hola',
      motivo: motivo || 'datos incompletos o no verificables'
    }
  });
}

function describeMinutes(minutos) {
  if (!minutos) return '';
  if (minutos % 60 === 0) {
    const h = minutos / 60;
    return `${h} ${h === 1 ? 'hora' : 'horas'}`;
  }
  return `${minutos} minutos`;
}

async function notifySetupPassword({ participante, link, expiraMinutos }) {
  return sendAndStore({
    participante,
    registroId: null,
    tipo: 'SETUP_PASSWORD',
    plantillaCodigo: 'SETUP_PASSWORD',
    vars: {
      nombre: (participante.NOMBRE || participante.nombre || '').split(' ')[0] || 'Hola',
      link,
      expira: describeMinutes(expiraMinutos)
    }
  });
}

async function notifyRecuperarPassword({ participante, link, expiraMinutos }) {
  return sendAndStore({
    participante,
    registroId: null,
    tipo: 'RECUPERAR_PASSWORD',
    plantillaCodigo: 'RECUPERAR_PASSWORD',
    vars: {
      nombre: (participante.NOMBRE || participante.nombre || '').split(' ')[0] || 'Hola',
      link,
      expira: describeMinutes(expiraMinutos)
    }
  });
}

async function notifyPasswordCambiada({ participanteId }) {
  // Lookup participante details first since callers usually only have the id.
  const r = await db.execute(
    'SELECT ID, NOMBRE, TELEFONO FROM ALLWAYS_PARTICIPANTES WHERE ID = :id',
    { id: participanteId }
  );
  const p = r.rows?.[0];
  if (!p) return;
  return sendAndStore({
    participante: p,
    registroId: null,
    tipo: 'PASSWORD_CAMBIADA',
    plantillaCodigo: 'PASSWORD_CAMBIADA',
    vars: {
      nombre: (p.NOMBRE || '').split(' ')[0] || 'Hola',
      fecha: new Date().toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' })
    }
  });
}

module.exports = {
  notifyRecibido,
  notifyAceptado,
  notifyRechazado,
  notifySetupPassword,
  notifyRecuperarPassword,
  notifyPasswordCambiada,
  applyTemplate,
  getPlantilla
};
