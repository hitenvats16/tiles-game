export const ERROR_CODES = {
  // Auth / generic
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INTERNAL: 'INTERNAL',

  // Rooms
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  NOT_OWNER: 'NOT_OWNER',
  NOT_IN_ROOM: 'NOT_IN_ROOM',

  // Game
  NOT_ACTIVE: 'NOT_ACTIVE',
  ENDED: 'ENDED',
  COOLDOWN: 'COOLDOWN',
  NOT_ADJACENT: 'NOT_ADJACENT',
  OUT_OF_BOUNDS: 'OUT_OF_BOUNDS',
  OWNED: 'OWNED',
};

export const ERROR_MESSAGES = {
  [ERROR_CODES.MISSING_TOKEN]: 'Missing token',
  [ERROR_CODES.INVALID_TOKEN]: 'Invalid token',
  [ERROR_CODES.USER_NOT_FOUND]: 'User not found',
  [ERROR_CODES.VALIDATION_FAILED]: 'Validation failed',
  [ERROR_CODES.INTERNAL]: 'Internal error',
  [ERROR_CODES.ROOM_NOT_FOUND]: 'Room not found',
  [ERROR_CODES.ROOM_FULL]: 'Room is full',
  [ERROR_CODES.NOT_OWNER]: 'Only the room owner can do this',
  [ERROR_CODES.NOT_IN_ROOM]: 'Not in a room',
  [ERROR_CODES.NOT_ACTIVE]: 'Room is not active',
  [ERROR_CODES.ENDED]: 'Game has ended',
  [ERROR_CODES.COOLDOWN]: 'Cooldown active',
  [ERROR_CODES.NOT_ADJACENT]: 'Must be adjacent to an owned tile',
  [ERROR_CODES.OUT_OF_BOUNDS]: 'Coordinates out of bounds',
  [ERROR_CODES.OWNED]: 'You already own this tile',
};
