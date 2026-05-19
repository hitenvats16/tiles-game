import { RoomStatus } from '@prisma/client';
import { prisma } from '../prisma.js';
import { SOCKET_EVENTS, SOCKET_ROOM } from '../constants/events.js';
import { toRoomCard } from '../transformers/index.js';
import { getIo } from './emitter.js';

const OWNER_SELECT = { id: true, username: true, avatarUrl: true, color: true };

function lobbyEmit(event, payload) {
  const io = getIo();
  if (!io) return;
  io.to(SOCKET_ROOM.lobby()).emit(event, payload);
}

// Re-reads the room and broadcasts an upsert or removal so every lobby client
// stays in sync. A room "belongs" in the lobby when it's public, not ended,
// and has at least one member.
export async function broadcastRoomChange(roomId) {
  const room = await prisma.room
    .findUnique({
      where: { id: roomId },
      include: {
        owner: { select: OWNER_SELECT },
        _count: { select: { members: true } },
      },
    })
    .catch(() => null);

  const visible =
    room &&
    room.isPublic &&
    room.status !== RoomStatus.ENDED &&
    (room._count?.members ?? 0) > 0;

  if (!visible) {
    lobbyEmit(SOCKET_EVENTS.LOBBY_ROOM_REMOVE, { roomId });
    return;
  }

  lobbyEmit(SOCKET_EVENTS.LOBBY_ROOM_UPSERT, { room: toRoomCard(room) });
}

export function broadcastRoomRemoved(roomId) {
  lobbyEmit(SOCKET_EVENTS.LOBBY_ROOM_REMOVE, { roomId });
}
