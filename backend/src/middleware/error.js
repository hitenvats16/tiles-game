import { ERROR_CODES, ERROR_MESSAGES } from '../constants/errors.js';
import { GameError } from '../game/engine.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof GameError) {
    return res.status(400).json({ code: err.code, error: err.message });
  }
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    code: ERROR_CODES.INTERNAL,
    error: err.message || ERROR_MESSAGES[ERROR_CODES.INTERNAL],
  });
}
