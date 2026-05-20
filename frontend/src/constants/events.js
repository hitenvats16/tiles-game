// Must stay in sync with backend/src/constants/events.js
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',

  // Client → Server
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_SYNC: 'room:sync',
  TILE_CLAIM: 'tile:claim',
  CURSOR_MOVE: 'cursor:move',
  LOBBY_SUBSCRIBE: 'lobby:subscribe',
  LOBBY_UNSUBSCRIBE: 'lobby:unsubscribe',

  // Server → Client
  TILE_UPDATE: 'tile:update',
  LEADERBOARD_UPDATE: 'leaderboard:update',
  CLOCK_TICK: 'clock:tick',
  GAME_STARTED: 'game:started',
  GAME_ENDED: 'game:ended',
  MEMBER_JOINED: 'member:joined',
  MEMBER_LEFT: 'member:left',
  CURSOR_UPDATE: 'cursor:update',
  LOBBY_ROOM_UPSERT: 'lobby:room_upsert',
  LOBBY_ROOM_REMOVE: 'lobby:room_remove',
};
