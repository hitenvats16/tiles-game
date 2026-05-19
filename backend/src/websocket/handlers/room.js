import { RoomStatus } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { redis } from '../../redis/client.js';
import { REDIS_KEYS } from '../../constants/redisKeys.js';
import { SOCKET_EVENTS, SOCKET_ROOM } from '../../constants/events.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../../constants/errors.js';
import { loadRoomMeta, getGridSnapshot, getScores, GameError } from '../../game/engine.js';
import { roomJoinSchema } from '../../schemas/socket.js';
import {
  toPublicUser,
  toRoomMeta,
  toGridSnapshot,
  toScoresSnapshot,
  toClockPayload,
} from '../../transformers/index.js';
import {
  startLeaderboardTick,
  startClockTick,
  scheduleRoomEnd,
  stopRoomTimers,
} from '../lifecycle.js';
import { broadcastRoomChange } from '../lobby.js';

function snapshotResponse(meta, grid, scores) {
  return {
    meta: toRoomMeta(meta),
    grid: toGridSnapshot(grid),
    scores: toScoresSnapshot(scores),
    clock: toClockPayload(meta),
  };
}

export function makeRoomJoinHandler(io, socket) {
  const user = socket.data.user;

  return async (payload) => {
    const { roomId } = roomJoinSchema.parse(payload);

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { _count: { select: { members: true } } },
    });
    if (!room) throw new GameError(ERROR_CODES.ROOM_NOT_FOUND);
    if (room.status === RoomStatus.ENDED) throw new GameError(ERROR_CODES.ENDED);

    const existingMembership = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: user.id } },
    });
    if (!existingMembership && room._count.members >= room.maxPlayers) {
      throw new GameError(ERROR_CODES.ROOM_FULL, ERROR_MESSAGES[ERROR_CODES.ROOM_FULL]);
    }

    const prevRoom = socket.data.roomId;
    if (prevRoom && prevRoom !== roomId) {
      socket.leave(SOCKET_ROOM.forRoom(prevRoom));
      await redis.srem(REDIS_KEYS.members(prevRoom), user.id);
    }

    const isNewMember = !existingMembership;
    if (isNewMember) {
      await prisma.roomMember
        .create({ data: { roomId, userId: user.id } })
        .catch(() => {});
    }

    socket.join(SOCKET_ROOM.forRoom(roomId));
    await redis.sadd(REDIS_KEYS.members(roomId), user.id);
    await redis.hsetnx(REDIS_KEYS.scores(roomId), user.id, 0);
    socket.data.roomId = roomId;

    const [meta, grid, scores] = await Promise.all([
      loadRoomMeta(roomId),
      getGridSnapshot(roomId),
      getScores(roomId),
    ]);

    socket.to(SOCKET_ROOM.forRoom(roomId)).emit(SOCKET_EVENTS.MEMBER_JOINED, {
      user: toPublicUser(user),
    });

    startLeaderboardTick(roomId);
    if (meta.status === RoomStatus.ACTIVE) {
      startClockTick(roomId);
      scheduleRoomEnd(roomId, meta);
    }

    if (isNewMember) broadcastRoomChange(roomId).catch(() => {});

    return snapshotResponse(meta, grid, scores);
  };
}

export function makeRoomLeaveHandler(io, socket) {
  const user = socket.data.user;

  return async () => {
    const roomId = socket.data.roomId;
    if (!roomId) return { left: false };

    socket.leave(SOCKET_ROOM.forRoom(roomId));
    socket.data.roomId = null;

    const remaining = await io.in(SOCKET_ROOM.forRoom(roomId)).fetchSockets();
    const stillHere = remaining.some((s) => s.data.user?.id === user.id);
    if (stillHere) return { left: true };

    await redis.srem(REDIS_KEYS.members(roomId), user.id);

    const room = await prisma.room
      .findUnique({ where: { id: roomId }, select: { status: true } })
      .catch(() => null);

    let membershipChanged = false;
    if (room?.status === RoomStatus.WAITING) {
      const deleted = await prisma.roomMember
        .delete({ where: { roomId_userId: { roomId, userId: user.id } } })
        .catch(() => null);
      membershipChanged = !!deleted;
    }

    socket.to(SOCKET_ROOM.forRoom(roomId)).emit(SOCKET_EVENTS.MEMBER_LEFT, {
      userId: user.id,
    });

    if (membershipChanged) broadcastRoomChange(roomId).catch(() => {});
    if (remaining.length === 0) stopRoomTimers(roomId);

    return { left: true };
  };
}

export function makeRoomSyncHandler(socket) {
  return async () => {
    const roomId = socket.data.roomId;
    if (!roomId) throw new GameError(ERROR_CODES.NOT_IN_ROOM);
    const [meta, grid, scores] = await Promise.all([
      loadRoomMeta(roomId),
      getGridSnapshot(roomId),
      getScores(roomId),
    ]);
    return snapshotResponse(meta, grid, scores);
  };
}
