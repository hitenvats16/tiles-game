import { verifyToken } from '../auth/jwt.js';
import { prisma } from '../prisma.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../constants/errors.js';

export async function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error(ERROR_MESSAGES[ERROR_CODES.MISSING_TOKEN]));
  const decoded = verifyToken(token);
  if (!decoded?.uid) return next(new Error(ERROR_MESSAGES[ERROR_CODES.INVALID_TOKEN]));
  const user = await prisma.user.findUnique({ where: { id: decoded.uid } });
  if (!user) return next(new Error(ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND]));
  socket.data.user = user;
  next();
}
