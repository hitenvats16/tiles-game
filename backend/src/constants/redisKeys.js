// All Redis key shapes live here so we never have key-collisions or typos.
export const REDIS_KEYS = {
  grid: (roomId) => `room:${roomId}:grid`,                       // hash: field "x:y" -> userId
  cooldown: (roomId, userId) => `room:${roomId}:cd:${userId}`,   // string with PX ttl
  scores: (roomId) => `room:${roomId}:scores`,                   // hash userId -> count
  meta: (roomId) => `room:${roomId}:meta`,                       // hash room meta
  members: (roomId) => `room:${roomId}:members`,                 // set of userIds currently connected
  firstMoveDone: (roomId, userId) => `room:${roomId}:firstMove:${userId}`,
};
