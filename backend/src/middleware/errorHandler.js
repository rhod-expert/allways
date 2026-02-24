'use strict';

/**
 * Global error handler middleware.
 * Catches all unhandled errors and returns a consistent JSON response.
 */
function errorHandler(err, req, res, _next) {
  console.error('[ERROR]', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Build response
  const response = {
    success: false,
    message: statusCode === 500
      ? 'Error interno del servidor. Intente nuevamente mas tarde.'
      : err.message || 'Error desconocido.'
  };

  // In development, include error details
  if (process.env.NODE_ENV !== 'production') {
    response.error = err.message;
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * 404 handler for unknown routes.
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
}

module.exports = { errorHandler, notFoundHandler };
