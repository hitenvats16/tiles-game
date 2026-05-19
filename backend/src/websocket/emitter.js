import { SOCKET_ROOM } from '../constants/events.js';

let io = null;

export function setIo(instance) {
  io = instance;
}

export function getIo() {
  return io;
}

export function emitToRoom(roomId, event, payload) {
  if (!io) return;
  io.to(SOCKET_ROOM.forRoom(roomId)).emit(event, payload);
}

export async function getRoomSocketsCount(roomId) {
  if (!io) return 0;
  const sockets = await io.in(SOCKET_ROOM.forRoom(roomId)).fetchSockets();
  return sockets.length;
}
