'use strict';

/**
 * Admin user management CLI.
 *
 *   node scripts/usuarios.js listar
 *   node scripts/usuarios.js crear <username> <password> "<Nombre>" [ROL]
 *   node scripts/usuarios.js rol <username> <ROL>
 *
 * ROL is ADMIN (default) or VISUALIZADOR (read-only panel access).
 * Run from the backend/ directory so .env is picked up.
 */

const bcrypt = require('bcryptjs');
const db = require('../src/config/database');
const queries = require('../src/models/queries');
const { ROL_ADMIN, ROL_VISUALIZADOR } = require('../src/middleware/roles');

const ROLES_VALIDOS = [ROL_ADMIN, ROL_VISUALIZADOR];

function uso(mensaje) {
  if (mensaje) console.error(`\nError: ${mensaje}`);
  console.error(`
Uso:
  node scripts/usuarios.js listar
  node scripts/usuarios.js crear <username> <password> "<Nombre>" [${ROLES_VALIDOS.join('|')}]
  node scripts/usuarios.js rol <username> <${ROLES_VALIDOS.join('|')}>
`);
  process.exit(1);
}

async function listar() {
  const result = await db.execute(queries.ADMIN_LIST);
  const rows = result.rows || [];
  if (rows.length === 0) {
    console.log('No hay usuarios administradores.');
    return;
  }
  console.log('\nID  ROL           ACTIVO  USERNAME');
  console.log('-'.repeat(70));
  for (const r of rows) {
    console.log(
      `${String(r.ID).padEnd(4)}${String(r.ROL || '').padEnd(14)}${r.ACTIVO.padEnd(8)}${r.USERNAME}  (${r.NOMBRE || '-'})`
    );
  }
  console.log('');
}

async function crear(username, password, nombre, rol) {
  if (!username || !password) uso('username y password son requeridos.');
  if (password.length < 8) uso('La contrasena debe tener al menos 8 caracteres.');
  if (!ROLES_VALIDOS.includes(rol)) uso(`ROL invalido. Use: ${ROLES_VALIDOS.join(' o ')}`);

  const existing = await db.execute(queries.ADMIN_FIND_BY_USERNAME, { username });
  if (existing.rows && existing.rows.length > 0) {
    uso(`El usuario "${username}" ya existe. Use "rol" para cambiar su permiso.`);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await db.execute(queries.ADMIN_INSERT, {
      username,
      passwordHash,
      nombre: nombre || username,
      rol
    });
  } catch (err) {
    // ORA-00001: the username exists but is marked ACTIVO = 'N', so the
    // lookup above (which filters on ACTIVO) did not see it.
    if (err.message.includes('ORA-00001')) {
      uso(`El usuario "${username}" ya existe pero esta inactivo. Reactivelo en la base de datos.`);
    }
    throw err;
  }
  console.log(`\nUsuario "${username}" creado con rol ${rol}.\n`);
}

async function cambiarRol(username, rol) {
  if (!username) uso('username es requerido.');
  if (!ROLES_VALIDOS.includes(rol)) uso(`ROL invalido. Use: ${ROLES_VALIDOS.join(' o ')}`);

  const result = await db.execute(queries.ADMIN_UPDATE_ROL, { rol, username });
  if (result.rowsAffected === 0) {
    uso(`No existe el usuario "${username}".`);
  }
  console.log(`\nUsuario "${username}" ahora es ${rol}. Sus sesiones activas fueron revocadas.\n`);
}

async function main() {
  const [comando, ...args] = process.argv.slice(2);
  if (!comando) uso();

  await db.initialize();
  try {
    switch (comando) {
      case 'listar':
        await listar();
        break;
      case 'crear':
        await crear(args[0], args[1], args[2], (args[3] || ROL_ADMIN).toUpperCase());
        break;
      case 'rol':
        await cambiarRol(args[0], (args[1] || '').toUpperCase());
        break;
      default:
        uso(`Comando desconocido: ${comando}`);
    }
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error('\nError:', err.message, '\n');
  process.exit(1);
});
