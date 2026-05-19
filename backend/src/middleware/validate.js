import { ERROR_CODES, ERROR_MESSAGES } from '../constants/errors.js';

// Reusable zod request validator. Schema shape: z.object({ body?, params?, query? })
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    if (!result.success) {
      return res.status(400).json({
        code: ERROR_CODES.VALIDATION_FAILED,
        error: ERROR_MESSAGES[ERROR_CODES.VALIDATION_FAILED],
        details: result.error.flatten(),
      });
    }
    if (result.data.body) req.body = result.data.body;
    if (result.data.params) req.params = result.data.params;
    if (result.data.query) req.query = result.data.query;
    next();
  };
}
