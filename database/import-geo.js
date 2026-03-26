'use strict';

const path = require('path');
const XLSX = require(path.join(__dirname, '..', 'backend', 'node_modules', 'xlsx'));
const db = require(path.join(__dirname, '..', 'backend', 'src', 'config', 'database'));

const XLSX_FILE = path.join(__dirname, '..', 'docs', 'CÓDIGO DE REFERENCIA GEOGRAFICA_NOVIEMBRE_2025__.xlsx');
const PREFIX = '[GEO-IMPORT]';

function log(...args) {
  console.log(PREFIX, ...args);
}

function logError(...args) {
  console.error(PREFIX, ...args);
}

async function dropTableIfExists(tableName) {
  try {
    await db.execute(`DROP TABLE ${tableName} CASCADE CONSTRAINTS`);
    log(`Tabla ${tableName} eliminada`);
  } catch (err) {
    if (err.errorNum === 942) {
      log(`Tabla ${tableName} no existía, continuando...`);
    } else {
      throw err;
    }
  }
}

async function addGeoColumnsToParticipantes() {
  const columns = [
    { name: 'DEPARTAMENTO_ID', type: 'NUMBER' },
    { name: 'DISTRITO_ID', type: 'NUMBER' },
    { name: 'CIUDAD_ID', type: 'NUMBER' },
    { name: 'BARRIO_ID', type: 'NUMBER' }
  ];

  for (const col of columns) {
    try {
      await db.execute(`ALTER TABLE ALLWAYS_PARTICIPANTES ADD (${col.name} ${col.type})`);
      log(`Columna ${col.name} agregada a ALLWAYS_PARTICIPANTES`);
    } catch (err) {
      if (err.errorNum === 1430) {
        log(`Columna ${col.name} ya existe en ALLWAYS_PARTICIPANTES, omitiendo...`);
      } else {
        throw err;
      }
    }
  }
}

async function main() {
  try {
    log('Iniciando importación de datos geográficos...');
    log(`Leyendo archivo: ${XLSX_FILE}`);

    // Read xlsx
    const workbook = XLSX.readFile(XLSX_FILE);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    log(`Hoja: "${sheetName}", filas totales: ${rawData.length}`);

    // Data starts at row 7 (0-indexed), row 6 is headers
    const dataRows = rawData.slice(7).filter(row => row && row.length >= 6);
    log(`Filas de datos: ${dataRows.length}`);

    // Collect unique entities
    const departamentos = new Map(); // id -> nombre
    const distritos = new Map();     // id -> { departamento_id, nombre }
    const ciudades = new Map();      // id -> { departamento_id, distrito_id, nombre }
    const barrios = [];              // { id, departamento_id, distrito_id, ciudad_id, nombre }

    for (const row of dataRows) {
      const depId = Number(row[0]);
      const depNombre = String(row[1]).trim();
      const distId = Number(row[2]);
      const distNombre = String(row[3]).trim();
      const ciudId = Number(row[4]);
      const ciudNombre = String(row[5]).trim();

      if (!isNaN(depId) && depNombre) {
        departamentos.set(depId, depNombre);
      }

      if (!isNaN(distId) && distNombre) {
        distritos.set(distId, { departamento_id: depId, nombre: distNombre });
      }

      if (!isNaN(ciudId) && ciudNombre) {
        ciudades.set(ciudId, { departamento_id: depId, distrito_id: distId, nombre: ciudNombre });
      }

      // Barrios only exist in 8-column rows
      if (row.length >= 8 && row[6] !== undefined && row[6] !== null && row[6] !== '') {
        const barrId = Number(row[6]);
        const barrNombre = String(row[7]).trim();
        if (!isNaN(barrId) && barrNombre) {
          barrios.push({
            id: barrId,
            departamento_id: depId,
            distrito_id: distId,
            ciudad_id: ciudId,
            nombre: barrNombre
          });
        }
      }
    }

    log(`Departamentos únicos: ${departamentos.size}`);
    log(`Distritos únicos: ${distritos.size}`);
    log(`Ciudades únicas: ${ciudades.size}`);
    log(`Barrios: ${barrios.length}`);

    // Initialize DB pool
    log('Conectando a Oracle...');
    await db.initialize();

    // Drop tables in reverse order (children first)
    log('Eliminando tablas existentes...');
    await dropTableIfExists('ALLWAYS_GEO_BARRIOS');
    await dropTableIfExists('ALLWAYS_GEO_CIUDADES');
    await dropTableIfExists('ALLWAYS_GEO_DISTRITOS');
    await dropTableIfExists('ALLWAYS_GEO_DEPARTAMENTOS');

    // Create tables
    log('Creando tablas...');

    await db.execute(`
      CREATE TABLE ALLWAYS_GEO_DEPARTAMENTOS (
        ID NUMBER PRIMARY KEY,
        NOMBRE VARCHAR2(100) NOT NULL,
        CONSTRAINT UK_GEO_DEP_NOMBRE UNIQUE (NOMBRE)
      )
    `);
    log('Tabla ALLWAYS_GEO_DEPARTAMENTOS creada');

    await db.execute(`
      CREATE TABLE ALLWAYS_GEO_DISTRITOS (
        ID NUMBER PRIMARY KEY,
        DEPARTAMENTO_ID NUMBER NOT NULL,
        NOMBRE VARCHAR2(200) NOT NULL,
        CONSTRAINT FK_DIST_DEP FOREIGN KEY (DEPARTAMENTO_ID) REFERENCES ALLWAYS_GEO_DEPARTAMENTOS(ID),
        CONSTRAINT UK_GEO_DIST UNIQUE (DEPARTAMENTO_ID, ID)
      )
    `);
    log('Tabla ALLWAYS_GEO_DISTRITOS creada');

    await db.execute(`
      CREATE TABLE ALLWAYS_GEO_CIUDADES (
        ID NUMBER PRIMARY KEY,
        DEPARTAMENTO_ID NUMBER NOT NULL,
        DISTRITO_ID NUMBER NOT NULL,
        NOMBRE VARCHAR2(200) NOT NULL,
        CONSTRAINT FK_CIUD_DEP FOREIGN KEY (DEPARTAMENTO_ID) REFERENCES ALLWAYS_GEO_DEPARTAMENTOS(ID),
        CONSTRAINT UK_GEO_CIUD UNIQUE (DEPARTAMENTO_ID, DISTRITO_ID, ID)
      )
    `);
    log('Tabla ALLWAYS_GEO_CIUDADES creada');

    await db.execute(`
      CREATE TABLE ALLWAYS_GEO_BARRIOS (
        ID NUMBER NOT NULL,
        DEPARTAMENTO_ID NUMBER NOT NULL,
        DISTRITO_ID NUMBER NOT NULL,
        CIUDAD_ID NUMBER NOT NULL,
        NOMBRE VARCHAR2(200) NOT NULL,
        CONSTRAINT PK_GEO_BARR PRIMARY KEY (DEPARTAMENTO_ID, DISTRITO_ID, CIUDAD_ID, ID),
        CONSTRAINT FK_BARR_DEP FOREIGN KEY (DEPARTAMENTO_ID) REFERENCES ALLWAYS_GEO_DEPARTAMENTOS(ID)
      )
    `);
    log('Tabla ALLWAYS_GEO_BARRIOS creada');

    // Insert departamentos
    log('Insertando departamentos...');
    const depBinds = [];
    for (const [id, nombre] of departamentos) {
      depBinds.push({ id, nombre });
    }
    await db.executeMany(
      'INSERT INTO ALLWAYS_GEO_DEPARTAMENTOS (ID, NOMBRE) VALUES (:id, :nombre)',
      depBinds,
      {
        bindDefs: {
          id: { type: db.oracledb.NUMBER },
          nombre: { type: db.oracledb.STRING, maxSize: 100 }
        }
      }
    );
    log(`${depBinds.length} departamentos insertados`);

    // Insert distritos
    log('Insertando distritos...');
    const distBinds = [];
    for (const [id, data] of distritos) {
      distBinds.push({ id, departamento_id: data.departamento_id, nombre: data.nombre });
    }
    await db.executeMany(
      'INSERT INTO ALLWAYS_GEO_DISTRITOS (ID, DEPARTAMENTO_ID, NOMBRE) VALUES (:id, :departamento_id, :nombre)',
      distBinds,
      {
        bindDefs: {
          id: { type: db.oracledb.NUMBER },
          departamento_id: { type: db.oracledb.NUMBER },
          nombre: { type: db.oracledb.STRING, maxSize: 200 }
        }
      }
    );
    log(`${distBinds.length} distritos insertados`);

    // Insert ciudades
    log('Insertando ciudades...');
    const ciudBinds = [];
    for (const [id, data] of ciudades) {
      ciudBinds.push({ id, departamento_id: data.departamento_id, distrito_id: data.distrito_id, nombre: data.nombre });
    }
    await db.executeMany(
      'INSERT INTO ALLWAYS_GEO_CIUDADES (ID, DEPARTAMENTO_ID, DISTRITO_ID, NOMBRE) VALUES (:id, :departamento_id, :distrito_id, :nombre)',
      ciudBinds,
      {
        bindDefs: {
          id: { type: db.oracledb.NUMBER },
          departamento_id: { type: db.oracledb.NUMBER },
          distrito_id: { type: db.oracledb.NUMBER },
          nombre: { type: db.oracledb.STRING, maxSize: 200 }
        }
      }
    );
    log(`${ciudBinds.length} ciudades insertadas`);

    // Insert barrios
    log('Insertando barrios...');
    const barrBinds = barrios.map(b => ({
      id: b.id,
      departamento_id: b.departamento_id,
      distrito_id: b.distrito_id,
      ciudad_id: b.ciudad_id,
      nombre: b.nombre
    }));
    if (barrBinds.length > 0) {
      await db.executeMany(
        'INSERT INTO ALLWAYS_GEO_BARRIOS (ID, DEPARTAMENTO_ID, DISTRITO_ID, CIUDAD_ID, NOMBRE) VALUES (:id, :departamento_id, :distrito_id, :ciudad_id, :nombre)',
        barrBinds,
        {
          bindDefs: {
            id: { type: db.oracledb.NUMBER },
            departamento_id: { type: db.oracledb.NUMBER },
            distrito_id: { type: db.oracledb.NUMBER },
            ciudad_id: { type: db.oracledb.NUMBER },
            nombre: { type: db.oracledb.STRING, maxSize: 200 }
          }
        }
      );
    }
    log(`${barrBinds.length} barrios insertados`);

    // Add geo columns to ALLWAYS_PARTICIPANTES
    log('Agregando columnas geográficas a ALLWAYS_PARTICIPANTES...');
    await addGeoColumnsToParticipantes();

    log('Importación completada exitosamente');
    await db.close();
    process.exit(0);
  } catch (err) {
    logError('Error fatal:', err.message);
    logError(err.stack);
    try {
      await db.close();
    } catch (_) {
      // ignore
    }
    process.exit(1);
  }
}

main();
