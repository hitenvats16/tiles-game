import { SOCKET_EVENTS, SOCKET_ROOM } from '../../constants/events.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../../constants/errors.js';
import { attemptClaim, GameError } from '../../game/engine.js';
import { tileClaimSchema } from '../../schemas/socket.js';

export function makeTileClaimHandler(io, socket) {
  const user = socket.data.user;

  return async (payload) => {
    const { x, y } = tileClaimSchema.parse(payload);
    const roomId = socket.data.roomId;
    if (!roomId) throw new GameError(ERROR_CODES.NOT_IN_ROOM, ERROR_MESSAGES[ERROR_CODES.NOT_IN_ROOM]);

    const result = await attemptClaim({ roomId, userId: user.id, x, y });

    io.to(SOCKET_ROOM.forRoom(roomId)).emit(SOCKET_EVENTS.TILE_UPDATE, {
      x: result.x,
      y: result.y,
      owner: result.owner,
    });

    return result;
  };
}
