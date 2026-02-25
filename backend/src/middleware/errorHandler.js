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

  // Handle JSON parse errors with generic message
  const isParseError = err.type === 'entity.parse.failed';

  // Build response
  const response = {
    success: false,
    message: statusCode === 500
      ? 'Error interno del servidor. Intente nuevamente mas tarde.'
      : isParseError
        ? 'El cuerpo de la solicitud no es JSON valido.'
        : err.message || 'Error desconocido.'
  };

  // Only include details when explicitly in development mode
  if (process.env.NODE_ENV === 'development') {
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
