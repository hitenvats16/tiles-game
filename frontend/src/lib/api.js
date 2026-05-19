import { API_BASE, API_PATHS, STORAGE_KEYS } from '../constants/api.js';

function getToken() {
  return localStorage.getItem(STORAGE_KEYS.token) || '';
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = data?.error || res.statusText;
    const err = new Error(typeof message === 'string' ? message : 'Request failed');
    err.code = data?.code;
    err.details = data?.details;
    throw err;
  }
  return data;
}

export const api = {
  loginWithGoogle: (credential) =>
    request(API_PATHS.authGoogle, { method: 'POST', body: { credential }, auth: false }),
  me: () => request(API_PATHS.me),
  listRooms: () => request(API_PATHS.rooms),
  createRoom: (payload) => request(API_PATHS.rooms, { method: 'POST', body: payload }),
  getRoom: (id) => request(API_PATHS.room(id)),
  joinRoom: (id) => request(API_PATHS.joinRoom(id), { method: 'POST' }),
  startRoom: (id) => request(API_PATHS.startRoom(id), { method: 'POST' }),
  getRoomState: (id) => request(API_PATHS.roomState(id)),
};

export { API_BASE };
