import { verifyToken } from '../auth/jwt.js';
import { prisma } from '../prisma.js';
import { AUTH } from '../constants/auth.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../constants/errors.js';

function extractToken(req) {
  const header = req.headers[AUTH.HEADER] || '';
  if (!header.startsWith(AUTH.BEARER_PREFIX)) return null;
  return header.slice(AUTH.BEARER_PREFIX.length);
}

export async function requireUser(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      code: ERROR_CODES.MISSING_TOKEN,
      error: ERROR_MESSAGES[ERROR_CODES.MISSING_TOKEN],
    });
  }
  const decoded = verifyToken(token);
  if (!decoded?.uid) {
    return res.status(401).json({
      code: ERROR_CODES.INVALID_TOKEN,
      error: ERROR_MESSAGES[ERROR_CODES.INVALID_TOKEN],
    });
  }
  const user = await prisma.user.findUnique({ where: { id: decoded.uid } });
  if (!user) {
    return res.status(401).json({
      code: ERROR_CODES.USER_NOT_FOUND,
      error: ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND],
    });
  }
  req.user = user;
  next();
}
