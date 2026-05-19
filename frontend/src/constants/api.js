export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const API_PATHS = {
  authGoogle: '/api/auth/google',
  me: '/api/users/me',
  rooms: '/api/rooms',
  room: (id) => `/api/rooms/${id}`,
  joinRoom: (id) => `/api/rooms/${id}/join`,
  startRoom: (id) => `/api/rooms/${id}/start`,
  roomState: (id) => `/api/rooms/${id}/state`,
};

export const STORAGE_KEYS = {
  token: 'token',
};
