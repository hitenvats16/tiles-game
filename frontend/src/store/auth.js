import { create } from 'zustand';
import { api } from '../lib/api.js';
import { disconnectSocket } from '../lib/socket.js';
import { STORAGE_KEYS } from '../constants/api.js';

export const useAuth = create((set) => ({
  user: null,
  loading: true,

  hydrate: async () => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (!token) {
      set({ user: null, loading: false });
      return;
    }
    try {
      const { user } = await api.me();
      set({ user, loading: false });
    } catch {
      localStorage.removeItem(STORAGE_KEYS.token);
      set({ user: null, loading: false });
    }
  },

  signInWithGoogle: async (credential) => {
    const { token, user } = await api.loginWithGoogle(credential);
    localStorage.setItem(STORAGE_KEYS.token, token);
    set({ user });
    return user;
  },

  signOut: () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    disconnectSocket();
    set({ user: null });
  },
}));
