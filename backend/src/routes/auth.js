import { Router } from 'express';
import { prisma } from '../prisma.js';
import { signToken } from '../auth/jwt.js';
import { colorFromEmail } from '../auth/color.js';
import { verifyGoogleCredential } from '../auth/google.js';
import { validate } from '../middleware/validate.js';
import { googleLoginSchema } from '../schemas/auth.js';
import { toAuthSession } from '../transformers/index.js';
import { ERROR_CODES } from '../constants/errors.js';

export const authRouter = Router();

authRouter.post('/google', validate(googleLoginSchema), async (req, res, next) => {
  try {
    const { credential } = req.body;
    const profile = await verifyGoogleCredential(credential);
    if (!profile) {
      return res.status(400).json({ code: ERROR_CODES.INVALID_TOKEN, error: 'Invalid Google credential' });
    }

    const { email, username, avatarUrl } = profile;
    const user = await prisma.user.upsert({
      where: { email },
      update: { username, avatarUrl },
      create: { email, username, avatarUrl, color: colorFromEmail(email) },
    });

    const token = signToken({ uid: user.id });
    res.json(toAuthSession(user, token));
  } catch (e) {
    next(e);
  }
});
