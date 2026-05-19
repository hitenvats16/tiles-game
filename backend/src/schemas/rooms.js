import { z } from 'zod';
import { GAME } from '../constants/game.js';

const roomIdParam = z.object({
  id: z.string().min(1),
});

export const listRoomsSchema = z.object({}); // no params

export const createRoomSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(GAME.NAME_MAX_LEN),
    maxPlayers: z.number().int().min(GAME.PLAYERS_MIN).max(GAME.PLAYERS_MAX),
    gridSize: z.number().int().min(GAME.GRID_MIN).max(GAME.GRID_MAX),
    durationSec: z.number().int().min(GAME.DURATION_MIN_SEC).max(GAME.DURATION_MAX_SEC),
    isPublic: z.boolean().default(true),
  }),
});

export const getRoomSchema = z.object({
  params: roomIdParam,
});

export const joinRoomSchema = z.object({
  params: roomIdParam,
});

export const startRoomSchema = z.object({
  params: roomIdParam,
});

export const getRoomStateSchema = z.object({
  params: roomIdParam,
});
