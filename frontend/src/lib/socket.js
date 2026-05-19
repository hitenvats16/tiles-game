import { io as createSocket } from 'socket.io-client';
import { API_BASE, STORAGE_KEYS } from '../constants/api.js';

let socket = null;

export function getSocket() {
  const token = localStorage.getItem(STORAGE_KEYS.token) || '';
  if (socket && socket.auth?.token === token) return socket;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socket = createSocket(API_BASE, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
