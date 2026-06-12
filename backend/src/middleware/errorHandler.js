import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(_req, _res, next) {
  next(new AppError('Route not found', 404, 'NOT_FOUND'));
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  if (statusCode >= 500) {
    logger.error(err.message, {
      code,
      stack: err.stack,
      details: err.details || null,
    });
  } else {
    logger.warn(err.message, { code, details: err.details || null });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message,
      code,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}
