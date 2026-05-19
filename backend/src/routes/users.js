import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { toMeUser } from '../transformers/index.js';

export const usersRouter = Router();

usersRouter.get('/me', requireUser, (req, res) => {
  res.json({ user: toMeUser(req.user) });
});
