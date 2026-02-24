'use strict';

const oracledb = require('oracledb');
const config = require('./env');

// Initialize Oracle Thick mode
try {
  oracledb.initOracleClient({
    configDir: '/usr/lib/oracle/19.25/client64/lib/network/admin'
  });
} catch (err) {
  // Already initialized - ignore
  if (!err.message.includes('NJS-077')) {
    console.error('[DB] Error inicializando Oracle Client:', err.message);
  }
}

// Global defaults
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;
oracledb.fetchAsString = [oracledb.CLOB];

/**
 * Initialize the connection pool
 */
async function initialize() {
  try {
    await oracledb.createPool({
      user: config.oracle.user,
      password: config.oracle.password,
      connectString: config.oracle.connectionString,
      poolMin: config.oracle.poolMin,
      poolMax: config.oracle.poolMax,
      poolAlias: 'default',
      poolIncrement: 1,
      poolTimeout: 60,
      queueTimeout: 60000,
      enableStatistics: false
    });
    console.log('[DB] Pool de conexiones Oracle creado exitosamente');
  } catch (err) {
    console.error('[DB] Error creando pool de conexiones:', err.message);
    throw err;
  }
}

/**
 * Close the connection pool gracefully
 */
async function close() {
  try {
    await oracledb.getPool('default').close(10);
    console.log('[DB] Pool de conexiones cerrado');
  } catch (err) {
    console.error('[DB] Error cerrando pool:', err.message);
  }
}

/**
 * Execute a single SQL statement
 * @param {string} sql - SQL statement
 * @param {object|array} binds - Bind parameters
 * @param {object} options - Additional options
 * @returns {object} Result
 */
async function execute(sql, binds = {}, options = {}) {
  let connection;
  try {
    connection = await oracledb.getConnection('default');
    const result = await connection.execute(sql, binds, {
      autoCommit: true,
      ...options
    });
    return result;
  } catch (err) {
    console.error('[DB] Error ejecutando query:', err.message);
    console.error('[DB] SQL:', sql);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('[DB] Error liberando conexion:', err.message);
      }
    }
  }
}

/**
 * Execute many SQL statements (batch)
 * @param {string} sql - SQL statement
 * @param {array} binds - Array of bind parameter arrays/objects
 * @param {object} options - Additional options
 * @returns {object} Result
 */
async function executeMany(sql, binds = [], options = {}) {
  let connection;
  try {
    connection = await oracledb.getConnection('default');
    const result = await connection.executeMany(sql, binds, {
      autoCommit: true,
      ...options
    });
    return result;
  } catch (err) {
    console.error('[DB] Error ejecutando batch:', err.message);
    console.error('[DB] SQL:', sql);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('[DB] Error liberando conexion:', err.message);
      }
    }
  }
}

/**
 * Execute multiple statements in a transaction
 * @param {function} callback - Receives connection, must return result
 * @returns {*} Result from callback
 */
async function executeTransaction(callback) {
  let connection;
  try {
    connection = await oracledb.getConnection('default');
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('[DB] Error en rollback:', rollbackErr.message);
      }
    }
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('[DB] Error liberando conexion:', err.message);
      }
    }
  }
}

module.exports = {
  initialize,
  close,
  execute,
  executeMany,
  executeTransaction,
  oracledb
};
