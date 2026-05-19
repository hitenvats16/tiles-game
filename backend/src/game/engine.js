import { RoomStatus } from '@prisma/client';
import { redis } from '../redis/client.js';
import { REDIS_KEYS } from '../constants/redisKeys.js';
import { GAME } from '../constants/game.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../constants/errors.js';
import { prisma } from '../prisma.js';

export class GameError extends Error {
  constructor(code, message) {
    super(message || ERROR_MESSAGES[code] || code);
    this.code = code;
  }
}

const cellKey = (x, y) => `${x}:${y}`;

export async function loadRoomMeta(roomId) {
  const meta = await redis.hgetall(REDIS_KEYS.meta(roomId));
  if (meta && meta.gridSize) {
    return {
      gridSize: Number(meta.gridSize),
      status: meta.status,
      endsAt: Number(meta.endsAt || 0),
      durationSec: Number(meta.durationSec || 0),
      maxPlayers: Number(meta.maxPlayers || 0),
    };
  }

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new GameError(ERROR_CODES.ROOM_NOT_FOUND);

  const endsAt = room.startedAt
    ? new Date(room.startedAt).getTime() + room.durationSec * 1000
    : 0;
  const payload = {
    gridSize: String(room.gridSize),
    status: room.status,
    endsAt: String(endsAt),
    durationSec: String(room.durationSec),
    maxPlayers: String(room.maxPlayers),
  };
  await redis.hset(REDIS_KEYS.meta(roomId), payload);
  return {
    gridSize: room.gridSize,
    status: room.status,
    endsAt,
    durationSec: room.durationSec,
    maxPlayers: room.maxPlayers,
  };
}

export async function setRoomMeta(roomId, patch) {
  const flat = {};
  for (const [k, v] of Object.entries(patch)) flat[k] = String(v);
  await redis.hset(REDIS_KEYS.meta(roomId), flat);
}

export async function getGridSnapshot(roomId) {
  return (await redis.hgetall(REDIS_KEYS.grid(roomId))) || {};
}

export async function getScores(roomId) {
  const scores = await redis.hgetall(REDIS_KEYS.scores(roomId));
  const out = {};
  for (const [uid, val] of Object.entries(scores)) out[uid] = Number(val);
  return out;
}

async function getOwner(roomId, x, y) {
  return redis.hget(REDIS_KEYS.grid(roomId), cellKey(x, y));
}

async function hasAdjacentOwned(roomId, userId, x, y, size) {
  const neighbors = [
    [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1],
  ].filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < size && ny < size);
  if (neighbors.length === 0) return false;

  const owners = await redis.hmget(
    REDIS_KEYS.grid(roomId),
    ...neighbors.map(([nx, ny]) => cellKey(nx, ny))
  );
  return owners.some((o) => o === userId);
}

export async function attemptClaim({ roomId, userId, x, y }) {
  const meta = await loadRoomMeta(roomId);
  if (meta.status !== RoomStatus.ACTIVE) {
    throw new GameError(ERROR_CODES.NOT_ACTIVE);
  }
  if (meta.endsAt && Date.now() > meta.endsAt) {
    throw new GameError(ERROR_CODES.ENDED);
  }
  const size = meta.gridSize;
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= size || y >= size) {
    throw new GameError(ERROR_CODES.OUT_OF_BOUNDS);
  }

  const cdKey = REDIS_KEYS.cooldown(roomId, userId);
  const cdTtl = await redis.pttl(cdKey);
  if (cdTtl > 0) {
    const err = new GameError(ERROR_CODES.COOLDOWN);
    err.remainingMs = cdTtl;
    throw err;
  }

  const nowMs = Date.now();
  const score = await redis.hget(REDIS_KEYS.scores(roomId), userId);
  const ownsAny = Number(score || 0) > 0;
  const firstMoveDone = (await redis.get(REDIS_KEYS.firstMoveDone(roomId, userId))) === '1';

  if (ownsAny && firstMoveDone) {
    const adjacent = await hasAdjacentOwned(roomId, userId, x, y, size);
    if (!adjacent) throw new GameError(ERROR_CODES.NOT_ADJACENT);
  }

  const prevOwner = await getOwner(roomId, x, y);
  if (prevOwner === userId) {
    throw new GameError(ERROR_CODES.OWNED);
  }

  const cooldownEndsAt = nowMs + GAME.COOLDOWN_SEC * 1000;

  const pipeline = redis.multi();
  pipeline.hset(REDIS_KEYS.grid(roomId), cellKey(x, y), userId);
  pipeline.hincrby(REDIS_KEYS.scores(roomId), userId, 1);
  if (prevOwner) pipeline.hincrby(REDIS_KEYS.scores(roomId), prevOwner, -1);
  pipeline.set(cdKey, '1', 'PX', GAME.COOLDOWN_SEC * 1000);
  if (!firstMoveDone) pipeline.set(REDIS_KEYS.firstMoveDone(roomId, userId), '1');
  await pipeline.exec();

  // Wipeout reset: if prevOwner score == 0, reset their firstMove
  if (prevOwner) {
    const prevScore = Number(await redis.hget(REDIS_KEYS.scores(roomId), prevOwner)) || 0;
    if (prevScore <= 0) {
      await redis.del(REDIS_KEYS.firstMoveDone(roomId, prevOwner));
      await redis.hset(REDIS_KEYS.scores(roomId), prevOwner, 0);
    }
  }

  prisma.claim
    .upsert({
      where: { roomId_x_y: { roomId, x, y } },
      create: { roomId, userId, x, y },
      update: { userId, claimedAt: new Date() },
    })
    .catch((e) => console.error('[claim persist]', e.message));

  return { x, y, owner: userId, prevOwner, cooldownEndsAt };
}

export async function resetRoomCache(roomId) {
  await redis.del(
    REDIS_KEYS.grid(roomId),
    REDIS_KEYS.scores(roomId),
    REDIS_KEYS.meta(roomId),
    REDIS_KEYS.members(roomId),
  );
}
