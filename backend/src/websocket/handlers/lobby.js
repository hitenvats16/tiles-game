import { SOCKET_ROOM } from '../../constants/events.js';

export function makeLobbySubscribeHandler(socket) {
  return async () => {
    socket.join(SOCKET_ROOM.lobby());
    return { subscribed: true };
  };
}

export function makeLobbyUnsubscribeHandler(socket) {
  return async () => {
    socket.leave(SOCKET_ROOM.lobby());
    return { subscribed: false };
  };
}
