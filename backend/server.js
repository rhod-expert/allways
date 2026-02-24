'use strict';

const config = require('./src/config/env');
const db = require('./src/config/database');
const app = require('./src/app');
const { seedAdmin } = require('./src/controllers/authController');

const PORT = config.port;

/**
 * Start the server:
 * 1. Initialize Oracle connection pool
 * 2. Seed admin user if none exists
 * 3. Start listening on configured port
 */
async function start() {
  try {
    // Initialize database connection pool
    console.log('[SERVER] Inicializando pool de conexiones Oracle...');
    await db.initialize();

    // Seed admin user on first boot
    console.log('[SERVER] Verificando usuario administrador...');
    await seedAdmin();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`[SERVER] Allways Show de Premios API iniciada en puerto ${PORT}`);
      console.log(`[SERVER] Entorno: ${config.nodeEnv}`);
      console.log(`[SERVER] Health check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n[SERVER] Senal ${signal} recibida. Cerrando servidor...`);
      server.close(async () => {
        console.log('[SERVER] Servidor HTTP cerrado.');
        await db.close();
        console.log('[SERVER] Conexiones de base de datos cerradas.');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('[SERVER] Cierre forzado despues de timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('[SERVER] Unhandled Rejection:', reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('[SERVER] Uncaught Exception:', err);
      shutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (err) {
    console.error('[SERVER] Error al iniciar el servidor:', err.message);
    process.exit(1);
  }
}

start();
