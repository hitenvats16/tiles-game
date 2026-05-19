import { ERROR_CODES, ERROR_MESSAGES } from '../constants/errors.js';
import { GameError } from '../game/engine.js';

// Wraps an async handler so callbacks always receive { ok, ... } / { ok: false, code, error, details }.
export function withAck(handler) {
  return async (payload, ack) => {
    try {
      const result = await handler(payload);
      ack?.({ ok: true, ...(result || {}) });
    } catch (e) {
      if (e?.name === 'ZodError') {
        return ack?.({
          ok: false,
          code: ERROR_CODES.VALIDATION_FAILED,
          error: ERROR_MESSAGES[ERROR_CODES.VALIDATION_FAILED],
          details: e.flatten(),
        });
      }
      if (e instanceof GameError) {
        const payload = { ok: false, code: e.code, error: e.message };
        if (typeof e.remainingMs === 'number') payload.remainingMs = e.remainingMs;
        return ack?.(payload);
      }
      console.error('[socket]', e);
      ack?.({
        ok: false,
        code: ERROR_CODES.INTERNAL,
        error: e?.message || ERROR_MESSAGES[ERROR_CODES.INTERNAL],
      });
    }
  };
}
