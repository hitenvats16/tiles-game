import { RoomStatus } from '@prisma/client';
import { prisma } from '../../prisma.js';
import { redis } from '../../redis/client.js';
import { REDIS_KEYS } from '../../constants/redisKeys.js';
import { SOCKET_EVENTS, SOCKET_ROOM } from '../../constants/events.js';
import { stopRoomTimers } from '../lifecycle.js';
import { broadcastRoomChange } from '../lobby.js';

export function makeDisconnectHandler(io, socket) {
  const user = socket.data.user;

  return async () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const remaining = await io.in(SOCKET_ROOM.forRoom(roomId)).fetchSockets();
    const stillHere = remaining.some((s) => s.data.user?.id === user.id);

    if (!stillHere) {
      await redis.srem(REDIS_KEYS.members(roomId), user.id);

      // While the room is still in the lobby, leaving is fully reversible —
      // drop the RoomMember row so the lobby card / public list reflect reality.
      // Once the game is ACTIVE, keep them so they can rejoin and keep their
      // score / firstMove state.
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
    }

    if (remaining.length === 0) {
      stopRoomTimers(roomId);
    }
  };
}
