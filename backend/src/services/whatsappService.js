'use strict';

const axios = require('axios');
const oracledb = require('oracledb');
const config = require('../config/env');
const db = require('../config/database');
const queries = require('../models/queries');
const { normalizePhone, toRemoteJid, fromRemoteJid } = require('../utils/phone');

const evo = axios.create({
  baseURL: config.evolution.url,
  timeout: 20000,
  headers: { apikey: config.evolution.apiKey }
});

const INSTANCE = config.evolution.instanceName;

async function fetchInstanceStatus() {
  try {
    const { data } = await evo.get(`/instance/connectionState/${INSTANCE}`);
    const state = data?.instance?.state || data?.state || 'unknown';
    const map = { open: 'CONECTADA', connecting: 'CONECTANDO', close: 'DESCONECTADA' };
    return { state, estado: map[state] || 'DESCONECTADA', raw: data };
  } catch (err) {
    if (err.response?.status === 404) return { state: 'not_found', estado: 'DESCONECTADA' };
    throw err;
  }
}

async function ensureInstance() {
  const status = await fetchInstanceStatus();
  if (status.state === 'not_found') {
    const { data } = await evo.post('/instance/create', {
      instanceName: INSTANCE,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    });
    return { created: true, data };
  }
  return { created: false, data: status };
}

async function connectInstance() {
  const { data } = await evo.get(`/instance/connect/${INSTANCE}`);
  return data;
}

async function logoutInstance() {
  const { data } = await evo.delete(`/instance/logout/${INSTANCE}`);
  return data;
}

async function sendText(phoneRaw, text) {
  const number = normalizePhone(phoneRaw);
  if (!number) throw new Error('Telefono invalido');
  const { data } = await evo.post(`/message/sendText/${INSTANCE}`, {
    number,
    text
  });
  return {
    id: data?.key?.id || data?.messageTimestamp || null,
    raw: data,
    number,
    remoteJid: toRemoteJid(phoneRaw)
  };
}

async function persistInstanceState(estado, evento, numero = null) {
  await db.execute(queries.WA_INSTANCIA_UPSERT, {
    nombre: INSTANCE,
    estado,
    evento: (evento || '').slice(0, 80),
    numero
  }, { autoCommit: true });
}

async function persistQrCode(qrBase64) {
  if (!qrBase64) return;
  await db.execute(queries.WA_INSTANCIA_SET_QR, {
    nombre: INSTANCE,
    qrCode: qrBase64
  }, { autoCommit: true });
}

async function findOrCreateChat({ phoneRaw, participanteId = null, nombreContacto = null }) {
  const telefono = normalizePhone(phoneRaw);
  const remoteJid = toRemoteJid(phoneRaw);
  if (!telefono || !remoteJid) throw new Error('Telefono invalido para chat');

  const found = await db.execute(queries.WA_CHAT_FIND_BY_JID, { remoteJid });
  if (found.rows && found.rows.length > 0) return found.rows[0];

  const ins = await db.execute(queries.WA_CHAT_INSERT, {
    participanteId,
    telefono,
    remoteJid,
    nombreContacto,
    id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
  }, { autoCommit: true });
  return {
    ID: ins.outBinds.id[0],
    PARTICIPANTE_ID: participanteId,
    TELEFONO: telefono,
    REMOTE_JID: remoteJid,
    NOMBRE_CONTACTO: nombreContacto,
    NO_LEIDOS: 0
  };
}

async function recordMessage({
  chatId, direccion, texto, evolutionMessageId = null,
  tipo = 'texto', estado = 'enviado',
  plantillaCodigo = null, registroId = null, enviadoPorAdmin = null,
  incNoLeidos = 0, nombreContacto = null, participanteId = null
}) {
  return db.executeTransaction(async (conn) => {
    const result = await conn.execute(queries.WA_MENSAJE_INSERT, {
      chatId, direccion, texto, tipo, evolutionMessageId,
      estado, plantillaCodigo, registroId, enviadoPorAdmin,
      id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    });
    await conn.execute(queries.WA_CHAT_UPDATE_ACTIVIDAD, {
      id: chatId,
      incNoLeidos,
      nombreContacto,
      participanteId
    });
    return result.outBinds.id[0];
  });
}

module.exports = {
  evo,
  INSTANCE,
  fetchInstanceStatus,
  ensureInstance,
  connectInstance,
  logoutInstance,
  sendText,
  persistInstanceState,
  persistQrCode,
  findOrCreateChat,
  recordMessage,
  toRemoteJid,
  fromRemoteJid,
  normalizePhone
};
