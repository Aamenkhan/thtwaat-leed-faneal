import { UnauthorizedError } from '../utils/errors.js';
import { env } from '../config/env.js';

export function requireAdminKey(req, _res, next) {
  if (!env.adminApiKey) {
    return next(new UnauthorizedError('Admin API key is not configured'));
  }

  const provided = req.get('x-api-key') || req.query.apiKey;

  if (!provided || provided !== env.adminApiKey) {
    return next(new UnauthorizedError('Invalid or missing admin API key'));
  }

  return next();
}
