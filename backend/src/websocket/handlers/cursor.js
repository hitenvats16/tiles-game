import { SOCKET_EVENTS, SOCKET_ROOM } from '../../constants/events.js';
import { cursorMoveSchema } from '../../schemas/socket.js';

export function makeCursorMoveHandler(socket) {
  const user = socket.data.user;

  return (payload) => {
    try {
      const roomId = socket.data.roomId;
      if (!roomId) {
        console.warn('[cursor] no roomId for', user?.id);
        return;
      }
      const parsed = cursorMoveSchema.safeParse(payload);
      if (!parsed.success) {
        console.warn('[cursor] bad payload', payload, parsed.error.flatten());
        return;
      }
      const { x, y } = parsed.data;
      socket.to(SOCKET_ROOM.forRoom(roomId)).emit(SOCKET_EVENTS.CURSOR_UPDATE, {
        userId: user.id,
        x,
        y,
      });
    } catch (e) {
      console.error('[cursor]', e?.message);
    }
  };
}
