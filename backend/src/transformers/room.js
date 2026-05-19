import { toPublicUser } from './user.js';

function iso(date) {
  if (!date) return null;
  return date instanceof Date ? date.toISOString() : date;
}

// Listing card — owner included, members count only.
export function toRoomCard(room) {
  if (!room) return null;
  return {
    id: room.id,
    name: room.name,
    status: room.status,
    gridSize: room.gridSize,
    maxPlayers: room.maxPlayers,
    durationSec: room.durationSec,
    isPublic: room.isPublic,
    memberCount: room._count?.members ?? room.members?.length ?? 0,
    owner: toPublicUser(room.owner),
    createdAt: iso(room.createdAt),
    startedAt: iso(room.startedAt),
    endedAt: iso(room.endedAt),
  };
}

// Detailed room — includes full member list (public shape).
export function toRoomDetail(room) {
  if (!room) return null;
  return {
    ...toRoomCard(room),
    ownerId: room.ownerId,
    members: (room.members || []).map((m) => ({
      user: toPublicUser(m.user),
      joinedAt: iso(m.joinedAt),
    })),
  };
}

// Cached room meta returned by the engine — already a plain object.
export function toRoomMeta(meta) {
  if (!meta) return null;
  return {
    gridSize: Number(meta.gridSize) || 0,
    status: meta.status,
    endsAt: Number(meta.endsAt) || 0,
    durationSec: Number(meta.durationSec) || 0,
    maxPlayers: Number(meta.maxPlayers) || 0,
  };
}

export function toRoomList(rooms) {
  return (rooms || []).map(toRoomCard);
}
