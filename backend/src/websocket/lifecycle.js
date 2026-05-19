import { RoomStatus } from '@prisma/client';
import { prisma } from '../prisma.js';
import { getScores, loadRoomMeta, setRoomMeta } from '../game/engine.js';
import { GAME } from '../constants/game.js';
import { SOCKET_EVENTS } from '../constants/events.js';
import { emitToRoom } from './emitter.js';
import {
  toClockPayload,
  toRoomMeta,
  toScoresSnapshot,
} from '../transformers/index.js';
import { broadcastRoomRemoved } from './lobby.js';

// Per-room timers (in-memory; reset on server restart).
const leaderboardTimers = new Map();
const clockTimers = new Map();
const endTimers = new Map();

export function startLeaderboardTick(roomId) {
  if (leaderboardTimers.has(roomId)) return;
  const timer = setInterval(async () => {
    try {
      const scores = await getScores(roomId);
      emitToRoom(roomId, SOCKET_EVENTS.LEADERBOARD_UPDATE, {
        scores: toScoresSnapshot(scores),
        at: Date.now(),
      });
    } catch (e) {
      console.error('[leaderboard tick]', e.message);
    }
  }, GAME.LEADERBOARD_INTERVAL_MS);
  leaderboardTimers.set(roomId, timer);
}

export function startClockTick(roomId) {
  if (clockTimers.has(roomId)) return;
  const timer = setInterval(async () => {
    try {
      const meta = await loadRoomMeta(roomId);
      emitToRoom(roomId, SOCKET_EVENTS.CLOCK_TICK, toClockPayload(meta));
      if (meta.status === RoomStatus.ENDED) stopClockTick(roomId);
    } catch (e) {
      console.error('[clock tick]', e.message);
    }
  }, GAME.CLOCK_TICK_INTERVAL_MS);
  clockTimers.set(roomId, timer);
}

export function stopLeaderboardTick(roomId) {
  const t = leaderboardTimers.get(roomId);
  if (t) {
    clearInterval(t);
    leaderboardTimers.delete(roomId);
  }
}

export function stopClockTick(roomId) {
  const t = clockTimers.get(roomId);
  if (t) {
    clearInterval(t);
    clockTimers.delete(roomId);
  }
}

export function stopRoomTimers(roomId) {
  stopLeaderboardTick(roomId);
  stopClockTick(roomId);
}

export function scheduleRoomEnd(roomId, meta) {
  if (!meta?.endsAt || meta.status !== RoomStatus.ACTIVE) return;
  if (endTimers.has(roomId)) return;

  const delay = meta.endsAt - Date.now();
  if (delay <= 0) {
    endRoom(roomId).catch((e) => console.error('[endRoom]', e));
    return;
  }
  const t = setTimeout(() => {
    endRoom(roomId).catch((e) => console.error('[endRoom]', e));
  }, delay);
  endTimers.set(roomId, t);
}

export async function endRoom(roomId) {
  endTimers.delete(roomId);
  await prisma.room
    .update({
      where: { id: roomId },
      data: { status: RoomStatus.ENDED, endedAt: new Date() },
    })
    .catch(() => {});
  await setRoomMeta(roomId, { status: RoomStatus.ENDED });
  const scores = await getScores(roomId);
  emitToRoom(roomId, SOCKET_EVENTS.GAME_ENDED, {
    scores: toScoresSnapshot(scores),
    endedAt: Date.now(),
  });
  stopClockTick(roomId);
  stopLeaderboardTick(roomId);
  broadcastRoomRemoved(roomId);
}

// Called by the REST start endpoint after status flips WAITING → ACTIVE.
export async function onRoomStarted(roomId) {
  const meta = await loadRoomMeta(roomId);
  emitToRoom(roomId, SOCKET_EVENTS.GAME_STARTED, {
    meta: toRoomMeta(meta),
    clock: toClockPayload(meta),
  });
  startClockTick(roomId);
  scheduleRoomEnd(roomId, meta);
}
