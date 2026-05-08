'use strict';

const oracledb = require('oracledb');
const db = require('../config/database');
const queries = require('../models/queries');
const wa = require('../services/whatsappService');
const notif = require('../services/notificationService');

async function clobToString(v) {
  if (v == null) return v;
  if (typeof v === 'string') return v;
  if (typeof v.getData === 'function') return await v.getData();
  return String(v);
}

// ---- Public webhook (Evolution -> backend) ----
async function webhook(req, res) {
  // Always 200 OK quickly; Evolution retries on non-2xx
  res.status(200).json({ ok: true });

  try {
    const body = req.body || {};
    const event = body.event || body.eventType;
    const instance = body.instance || body.instanceName;
    const data = body.data || body;

    if (!event) return;

    if (event === 'connection.update') {
      const state = data.state || data.connection;
      const map = { open: 'CONECTADA', connecting: 'CONECTANDO', close: 'DESCONECTADA' };
      const estado = map[state] || 'DESCONECTADA';
      const numero = data?.wuid?.split('@')[0] || data?.profileName || null;
      await wa.persistInstanceState(estado, `connection:${state}`, numero);
      return;
    }

    if (event === 'qrcode.updated') {
      const qr =
        data?.qrcode?.base64 ||
        data?.qrcode?.code ||
        data?.base64 ||
        data?.qr ||
        null;
      if (qr) {
        const dataUrl = qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`;
        await wa.persistQrCode(dataUrl);
      } else {
        await wa.persistInstanceState('QR_PENDIENTE', 'qrcode.updated');
      }
      return;
    }

    if (event === 'messages.upsert') {
      const msg = data.message ? data : (data.messages?.[0] || data);
      const fromMe = msg.key?.fromMe;
      if (fromMe) return; // ignore our own outgoing in upsert; we already logged on send
      const remoteJid = msg.key?.remoteJid;
      if (!remoteJid || remoteJid.endsWith('@g.us')) return; // skip groups

      const phone = wa.fromRemoteJid(remoteJid);
      const texto =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        '[mensaje multimedia]';
      const pushName = msg.pushName || null;

      const chat = await wa.findOrCreateChat({
        phoneRaw: phone,
        nombreContacto: pushName
      });

      // Try to link to participante if not already
      if (!chat.PARTICIPANTE_ID) {
        const p = await db.execute(
          'SELECT ID FROM ALLWAYS_PARTICIPANTES WHERE TELEFONO = :t OR REPLACE(REPLACE(REPLACE(TELEFONO, \'+\', \'\'), \' \', \'\'), \'-\', \'\') = :t',
          { t: phone }
        );
        const partId = p.rows?.[0]?.ID || null;
        if (partId) chat.PARTICIPANTE_ID = partId;
      }

      await wa.recordMessage({
        chatId: chat.ID,
        direccion: 'IN',
        texto,
        evolutionMessageId: msg.key?.id || null,
        tipo: msg.message?.imageMessage ? 'imagen' :
              msg.message?.videoMessage ? 'video' :
              msg.message?.audioMessage ? 'audio' :
              msg.message?.documentMessage ? 'documento' : 'texto',
        estado: 'recibido',
        incNoLeidos: 1,
        nombreContacto: pushName,
        participanteId: chat.PARTICIPANTE_ID
      });
    }
  } catch (err) {
    console.error('[WA WEBHOOK] error:', err.message);
  }
}

// ---- Admin: instance management ----
async function getInstancia(req, res, next) {
  try {
    const persisted = await db.execute(queries.WA_INSTANCIA_GET, { nombre: wa.INSTANCE });
    const row = persisted.rows?.[0] || null;
    if (row && row.QR_CODE) {
      row.QR_CODE = await clobToString(row.QR_CODE);
    }
    let live = null;
    try {
      live = await wa.fetchInstanceStatus();
    } catch (e) {
      live = { error: e.message };
    }
    return res.json({
      success: true,
      data: {
        instancia: row,
        evolution: live
      }
    });
  } catch (err) { next(err); }
}

async function connectInstancia(req, res, next) {
  try {
    const ensure = await wa.ensureInstance();
    let data;
    // If we just created it, the create response already contains the QR
    if (ensure.created && ensure.data?.qrcode) {
      data = ensure.data.qrcode;
    } else {
      data = await wa.connectInstance();
    }
    const qr = data?.base64 || data?.code || null;
    if (qr) {
      const dataUrl = qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`;
      await wa.persistQrCode(dataUrl);
    } else {
      await wa.persistInstanceState('QR_PENDIENTE', 'manual.connect');
    }
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'No se pudo conectar la instancia.',
      detail: err.response?.data || err.message
    });
  }
}

async function disconnectInstancia(req, res, next) {
  try {
    const data = await wa.logoutInstance();
    await wa.persistInstanceState('DESCONECTADA', 'manual.logout');
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ---- Admin: chats ----
async function listChats(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const offset = (page - 1) * limit;

    const [countResult, listResult] = await Promise.all([
      db.execute(queries.WA_CHAT_LIST_COUNT, {}),
      db.execute(queries.WA_CHAT_LIST, { offset, limit })
    ]);

    const rows = [];
    for (const r of listResult.rows || []) {
      rows.push({ ...r, ULTIMO_TEXTO: await clobToString(r.ULTIMO_TEXTO) });
    }

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page, limit, total: countResult.rows[0].TOTAL,
        totalPages: Math.ceil(countResult.rows[0].TOTAL / limit)
      }
    });
  } catch (err) { next(err); }
}

async function listMensajes(req, res, next) {
  try {
    const chatId = parseInt(req.params.chatId, 10);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;

    const r = await db.execute(queries.WA_MENSAJE_LIST_BY_CHAT, { chatId, offset, limit });
    const mensajes = [];
    for (const m of r.rows || []) {
      mensajes.push({ ...m, TEXTO: await clobToString(m.TEXTO) });
    }
    return res.json({ success: true, data: mensajes });
  } catch (err) { next(err); }
}

async function sendMensaje(req, res, next) {
  try {
    const chatId = parseInt(req.params.chatId, 10);
    const { texto } = req.body || {};
    if (!texto || !texto.trim()) {
      return res.status(400).json({ success: false, message: 'Texto requerido.' });
    }

    const found = await db.execute(
      'SELECT ID, TELEFONO FROM ALLWAYS_WA_CHATS WHERE ID = :id',
      { id: chatId }
    );
    const chat = found.rows?.[0];
    if (!chat) return res.status(404).json({ success: false, message: 'Chat no encontrado.' });

    const sent = await wa.sendText(chat.TELEFONO, texto);
    const mensajeId = await wa.recordMessage({
      chatId: chat.ID,
      direccion: 'OUT',
      texto,
      evolutionMessageId: sent.id,
      enviadoPorAdmin: req.admin.id,
      estado: 'enviado'
    });

    return res.json({ success: true, data: { mensajeId, evolutionId: sent.id } });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error enviando mensaje.',
      detail: err.response?.data || err.message
    });
  }
}

async function marcarLeido(req, res, next) {
  try {
    const chatId = parseInt(req.params.chatId, 10);
    await db.execute(queries.WA_CHAT_MARK_READ, { id: chatId }, { autoCommit: true });
    return res.json({ success: true });
  } catch (err) { next(err); }
}

// ---- Admin: plantillas ----
async function listPlantillas(req, res, next) {
  try {
    const r = await db.execute(queries.WA_PLANTILLA_LIST, {});
    const rows = [];
    for (const p of r.rows || []) {
      rows.push({ ...p, TEXTO: await clobToString(p.TEXTO) });
    }
    return res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

async function updatePlantilla(req, res, next) {
  try {
    const { codigo } = req.params;
    const { texto, nombre, activo } = req.body || {};
    if (!texto || !nombre) {
      return res.status(400).json({ success: false, message: 'texto y nombre son obligatorios.' });
    }
    await db.execute(queries.WA_PLANTILLA_UPDATE, {
      codigo: codigo.toUpperCase(),
      texto,
      nombre,
      activo: activo === false || activo === 'N' ? 'N' : 'S'
    }, { autoCommit: true });
    return res.json({ success: true });
  } catch (err) { next(err); }
}

async function previewPlantilla(req, res, next) {
  try {
    const { codigo } = req.params;
    const vars = req.body?.vars || {};
    const { texto } = await notif.getPlantilla(codigo.toUpperCase());
    return res.json({ success: true, data: { texto: notif.applyTemplate(texto, vars) } });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
}

module.exports = {
  webhook,
  getInstancia,
  connectInstancia,
  disconnectInstancia,
  listChats,
  listMensajes,
  sendMensaje,
  marcarLeido,
  listPlantillas,
  updatePlantilla,
  previewPlantilla
};
