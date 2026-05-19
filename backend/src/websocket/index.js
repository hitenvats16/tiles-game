import { SOCKET_EVENTS } from '../constants/events.js';
import { authenticateSocket } from './middleware.js';
import { withAck } from './ack.js';
import { setIo } from './emitter.js';
import { makeRoomJoinHandler, makeRoomSyncHandler } from './handlers/room.js';
import { makeTileClaimHandler } from './handlers/tile.js';
import { makeDisconnectHandler } from './handlers/disconnect.js';
import { makeLobbySubscribeHandler, makeLobbyUnsubscribeHandler } from './handlers/lobby.js';

export function registerSocket(io) {
  setIo(io);
  io.use(authenticateSocket);

  io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    socket.on(SOCKET_EVENTS.ROOM_JOIN, withAck(makeRoomJoinHandler(io, socket)));
    socket.on(SOCKET_EVENTS.ROOM_SYNC, withAck(makeRoomSyncHandler(socket)));
    socket.on(SOCKET_EVENTS.TILE_CLAIM, withAck(makeTileClaimHandler(io, socket)));
    socket.on(SOCKET_EVENTS.LOBBY_SUBSCRIBE, withAck(makeLobbySubscribeHandler(socket)));
    socket.on(SOCKET_EVENTS.LOBBY_UNSUBSCRIBE, withAck(makeLobbyUnsubscribeHandler(socket)));
    socket.on(SOCKET_EVENTS.DISCONNECT, makeDisconnectHandler(io, socket));
  });
}
