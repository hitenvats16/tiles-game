import { z } from 'zod';
import { GAME } from '../constants/game.js';

export const roomJoinSchema = z.object({
  roomId: z.string().min(1),
});

export const tileClaimSchema = z.object({
  x: z.number().int().min(0).max(GAME.GRID_MAX - 1),
  y: z.number().int().min(0).max(GAME.GRID_MAX - 1),
});

export const roomSyncSchema = z.object({}).optional().nullable();
