/**
 * Centralized error-handling middleware.
 * Place last in the middleware stack (after all routes).
 *
 * Provides consistent JSON error responses and avoids leaking
 * internal stack traces in production.
 */
const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Internal server error';

  // Mongoose duplicate-key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with that ${field} already exists`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  // Mongoose cast error (bad ObjectId etc.)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // express-validator formatted errors
  if (Array.isArray(err.errors) && err.errors.length && err.errors[0].param !== undefined) {
    statusCode = 400;
    message = err.errors.map(e => e.msg).join(', ');
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', statusCode, message, err.stack ? '\n' + err.stack : '');
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = { notFound, errorHandler };
