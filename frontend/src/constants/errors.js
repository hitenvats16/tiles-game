// Must stay in sync with backend/src/constants/errors.js
export const ERROR_CODES = {
  COOLDOWN: 'COOLDOWN',
  NOT_ADJACENT: 'NOT_ADJACENT',
  OUT_OF_BOUNDS: 'OUT_OF_BOUNDS',
  OWNED: 'OWNED',
  NOT_ACTIVE: 'NOT_ACTIVE',
  ENDED: 'ENDED',
  ROOM_FULL: 'ROOM_FULL',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  NOT_IN_ROOM: 'NOT_IN_ROOM',
  NOT_OWNER: 'NOT_OWNER',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INTERNAL: 'INTERNAL',
};

export const ERROR_LABELS = {
  [ERROR_CODES.COOLDOWN]: 'wait for cooldown',
  [ERROR_CODES.NOT_ADJACENT]: 'must touch your territory',
  [ERROR_CODES.OUT_OF_BOUNDS]: 'out of bounds',
  [ERROR_CODES.OWNED]: 'already yours',
  [ERROR_CODES.NOT_ACTIVE]: 'game not active',
  [ERROR_CODES.ENDED]: 'game ended',
  [ERROR_CODES.ROOM_FULL]: 'room full',
  [ERROR_CODES.ROOM_NOT_FOUND]: 'room not found',
  [ERROR_CODES.NOT_IN_ROOM]: 'not in a room',
  [ERROR_CODES.NOT_OWNER]: 'only the host can do that',
  [ERROR_CODES.VALIDATION_FAILED]: 'invalid input',
  [ERROR_CODES.INTERNAL]: 'something went wrong',
};
