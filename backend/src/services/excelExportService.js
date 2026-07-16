'use strict';

const ExcelJS = require('exceljs');
const { formatRuc } = require('../utils/cedula');

const HEADER_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E3A8A' } // allways-blue
};
const HEADER_FONT = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
const HEADER_ALIGN = { vertical: 'middle', horizontal: 'left' };
const BORDER_THIN = { style: 'thin', color: { argb: 'FFE5E7EB' } };

function formatFecha(v) {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ubicacion(row) {
  const parts = [];
  if (row.GEO_BARRIO) parts.push(row.GEO_BARRIO);
  if (row.GEO_CIUDAD) parts.push(row.GEO_CIUDAD);
  else if (row.CIUDAD) parts.push(row.CIUDAD);
  if (row.GEO_DISTRITO) parts.push(row.GEO_DISTRITO);
  if (row.GEO_DEPARTAMENTO) parts.push(row.GEO_DEPARTAMENTO);
  else if (row.DEPARTAMENTO) parts.push(row.DEPARTAMENTO);
  return parts.join(', ');
}

function direccion(row) {
  const parts = [];
  if (row.CALLE) parts.push(row.CALLE);
  if (row.NUMERO_CASA) parts.push('N° ' + row.NUMERO_CASA);
  if (row.COMPLEMENTO) parts.push('(' + row.COMPLEMENTO + ')');
  return parts.join(' ');
}

function styleHeader(sheet) {
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = HEADER_ALIGN;
    cell.border = {
      top: BORDER_THIN,
      left: BORDER_THIN,
      bottom: BORDER_THIN,
      right: BORDER_THIN
    };
  });
  headerRow.height = 22;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

function applyBodyBorders(sheet) {
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: BORDER_THIN,
        left: BORDER_THIN,
        bottom: BORDER_THIN,
        right: BORDER_THIN
      };
    });
  }
}

async function buildParticipantesXlsx(rows, meta = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Allways Show de Premios';
  wb.created = new Date();

  const sheet = wb.addWorksheet('Clientes', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheet.columns = [
    { header: 'ID',              key: 'id',             width: 8  },
    { header: 'Nombre',          key: 'nombre',         width: 32 },
    { header: 'CI/CE',           key: 'cedula',         width: 14 },
    { header: 'RUC',             key: 'ruc',            width: 14 },
    { header: 'Teléfono',        key: 'telefono',       width: 16 },
    { header: 'Email',           key: 'email',          width: 30 },
    { header: 'Departamento',    key: 'departamento',   width: 18 },
    { header: 'Distrito',        key: 'distrito',       width: 18 },
    { header: 'Ciudad',          key: 'ciudad',         width: 22 },
    { header: 'Barrio',          key: 'barrio',         width: 22 },
    { header: 'Dirección',       key: 'direccion',      width: 32 },
    { header: 'Total registros', key: 'totalRegistros', width: 14 },
    { header: 'Aceptados',       key: 'regAceptados',   width: 12 },
    { header: 'Rechazados',      key: 'regRechazados',  width: 12 },
    { header: 'Pendientes',      key: 'regPendientes',  width: 12 },
    { header: 'Total cupones',   key: 'totalCupones',   width: 14 },
    { header: 'Fecha alta',      key: 'fechaRegistro',  width: 18 },
    { header: 'Activo',          key: 'activo',         width: 8  }
  ];

  for (const r of rows) {
    sheet.addRow({
      id: r.ID,
      nombre: r.NOMBRE || '',
      cedula: r.CEDULA || '',
      ruc: formatRuc(r.CEDULA) || '',
      telefono: r.TELEFONO || '',
      email: r.EMAIL || '',
      departamento: r.GEO_DEPARTAMENTO || r.DEPARTAMENTO || '',
      distrito: r.GEO_DISTRITO || '',
      ciudad: r.GEO_CIUDAD || r.CIUDAD || '',
      barrio: r.GEO_BARRIO || '',
      direccion: direccion(r),
      totalRegistros: Number(r.TOTAL_REGISTROS || 0),
      regAceptados: Number(r.REG_ACEPTADOS || 0),
      regRechazados: Number(r.REG_RECHAZADOS || 0),
      regPendientes: Number(r.REG_PENDIENTES || 0),
      totalCupones: Number(r.TOTAL_CUPONES || 0),
      fechaRegistro: formatFecha(r.FECHA_REGISTRO),
      activo: r.ACTIVO || ''
    });
  }

  styleHeader(sheet);
  applyBodyBorders(sheet);
  sheet.autoFilter = { from: 'A1', to: { row: 1, column: sheet.columnCount } };

  if (meta.filters) {
    const info = wb.addWorksheet('Info');
    info.columns = [
      { header: 'Campo', key: 'k', width: 22 },
      { header: 'Valor', key: 'v', width: 60 }
    ];
    info.addRow({ k: 'Exportado',    v: formatFecha(new Date()) });
    info.addRow({ k: 'Total filas',  v: rows.length });
    info.addRow({ k: 'Admin',        v: meta.adminUsername || meta.adminId || '' });
    Object.entries(meta.filters).forEach(([k, v]) => {
      if (v) info.addRow({ k: 'Filtro: ' + k, v: String(v) });
    });
    styleHeader(info);
  }

  return wb.xlsx.writeBuffer();
}

async function buildRegistrosXlsx(rows, meta = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Allways Show de Premios';
  wb.created = new Date();

  const sheet = wb.addWorksheet('Registros', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheet.columns = [
    { header: 'ID',                key: 'id',            width: 8  },
    { header: 'Estado',            key: 'estado',        width: 12 },
    { header: 'Nombre',            key: 'nombre',        width: 32 },
    { header: 'CI/CE',             key: 'cedula',        width: 14 },
    { header: 'RUC',               key: 'ruc',           width: 14 },
    { header: 'Teléfono',          key: 'telefono',      width: 16 },
    { header: 'Email',             key: 'email',         width: 30 },
    { header: 'N° Factura/Ticket', key: 'factura',       width: 22 },
    { header: 'Cant. productos',   key: 'cantidad',      width: 14 },
    { header: 'Cupones generados', key: 'cupones',       width: 16 },
    { header: 'Tienda',            key: 'tienda',        width: 24 },
    { header: 'Vendedor',          key: 'vendedor',      width: 18 },
    { header: 'Departamento',      key: 'departamento',  width: 18 },
    { header: 'Ciudad',            key: 'ciudad',        width: 22 },
    { header: 'Ubicación',         key: 'ubicacion',     width: 32 },
    { header: 'Fecha registro',    key: 'fechaReg',      width: 18 },
    { header: 'Fecha validación',  key: 'fechaVal',      width: 18 },
    { header: 'Motivo rechazo',    key: 'motivo',        width: 40 },
    { header: 'IP',                key: 'ip',            width: 16 }
  ];

  for (const r of rows) {
    sheet.addRow({
      id: r.ID,
      estado: r.ESTADO || '',
      nombre: r.NOMBRE || '',
      cedula: r.CEDULA || '',
      ruc: formatRuc(r.CEDULA) || '',
      telefono: r.TELEFONO || '',
      email: r.EMAIL || '',
      factura: r.NUMERO_FACTURA || '',
      cantidad: Number(r.CANTIDAD_PRODUCTOS || 0),
      cupones: Number(r.CUPONES_GENERADOS || 0),
      tienda: r.TIENDA || '',
      vendedor: r.VENDEDOR || '',
      departamento: r.GEO_DEPARTAMENTO || r.DEPARTAMENTO || '',
      ciudad: r.GEO_CIUDAD || r.CIUDAD || '',
      ubicacion: ubicacion(r),
      fechaReg: formatFecha(r.FECHA_REGISTRO),
      fechaVal: formatFecha(r.FECHA_VALIDACION),
      motivo: r.MOTIVO_RECHAZO || '',
      ip: r.IP_REGISTRO || ''
    });
  }

  // Colorear columna Estado segun valor
  const colEstado = sheet.getColumn('estado');
  colEstado.eachCell({ includeEmpty: false }, (cell, rowNum) => {
    if (rowNum === 1) return;
    const v = String(cell.value || '').toUpperCase();
    let fg = null;
    if (v === 'ACEPTADO')  fg = 'FFD1FAE5';
    if (v === 'RECHAZADO') fg = 'FFFEE2E2';
    if (v === 'PENDIENTE') fg = 'FFFEF3C7';
    if (fg) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fg } };
      cell.font = { bold: true, size: 10 };
    }
  });

  styleHeader(sheet);
  applyBodyBorders(sheet);
  sheet.autoFilter = { from: 'A1', to: { row: 1, column: sheet.columnCount } };

  if (meta.filters) {
    const info = wb.addWorksheet('Info');
    info.columns = [
      { header: 'Campo', key: 'k', width: 22 },
      { header: 'Valor', key: 'v', width: 60 }
    ];
    info.addRow({ k: 'Exportado',    v: formatFecha(new Date()) });
    info.addRow({ k: 'Total filas',  v: rows.length });
    info.addRow({ k: 'Admin',        v: meta.adminUsername || meta.adminId || '' });
    Object.entries(meta.filters).forEach(([k, v]) => {
      if (v) info.addRow({ k: 'Filtro: ' + k, v: String(v) });
    });
    styleHeader(info);
  }

  return wb.xlsx.writeBuffer();
}

module.exports = {
  buildParticipantesXlsx,
  buildRegistrosXlsx
};
