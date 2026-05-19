import { useSyncExternalStore } from 'react';

const SOUND_FILES = {
  claim: '/sounds/claim.mp3',
  error: '/sounds/error.mp3',
  start: '/sounds/start.mp3',
  end: '/sounds/end.mp3',
};

const VOLUMES = { claim: 0.5, error: 0.5, start: 0.6, end: 0.7 };

const MUSIC_SRC = '/sounds/music.mp3';
const MUSIC_VOLUME = 0.25;

const LOBBY_SRC = '/sounds/lobby.mp3';
const LOBBY_VOLUME = 0.2;

const HOME_SRC = '/sounds/home.mp3';
const HOME_VOLUME = 0.22;

const MUTE_KEY = 'tiles:mute';

const pool = {};
for (const [name, src] of Object.entries(SOUND_FILES)) {
  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.volume = VOLUMES[name] ?? 0.5;
  pool[name] = audio;
}

const music = new Audio(MUSIC_SRC);
music.preload = 'auto';
music.loop = true;
music.volume = MUSIC_VOLUME;
let musicEnabled = false;

const lobby = new Audio(LOBBY_SRC);
lobby.preload = 'auto';
lobby.loop = true;
lobby.volume = LOBBY_VOLUME;
let lobbyEnabled = false;

const home = new Audio(HOME_SRC);
home.preload = 'auto';
home.loop = true;
home.volume = HOME_VOLUME;
let homeEnabled = false;

const listeners = new Set();
let muted = (() => {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
})();

function notify() {
  for (const fn of listeners) fn();
}

function syncMusic() {
  if (musicEnabled && !muted) {
    music.play().catch(() => {});
  } else {
    music.pause();
  }
  if (lobbyEnabled && !musicEnabled && !muted) {
    lobby.play().catch(() => {});
  } else {
    lobby.pause();
  }
  if (homeEnabled && !musicEnabled && !lobbyEnabled && !muted) {
    home.play().catch(() => {});
  } else {
    home.pause();
  }
}

// Browsers block audio.play() until the user has interacted with the page.
// On first pointerdown/keydown, retry whatever music we wanted playing.
let unlocked = false;
function unlock() {
  if (unlocked) return;
  unlocked = true;
  document.removeEventListener('pointerdown', unlock);
  document.removeEventListener('keydown', unlock);
  document.removeEventListener('touchstart', unlock);
  syncMusic();
}
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);
  document.addEventListener('touchstart', unlock);
}

export function isMuted() {
  return muted;
}

export function setMuted(next) {
  muted = !!next;
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch {}
  syncMusic();
  notify();
}

export function toggleMute() {
  setMuted(!muted);
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useMuted() {
  return useSyncExternalStore(subscribe, isMuted, isMuted);
}

export function playSound(name) {
  if (muted) return;
  const src = pool[name];
  if (!src) return;
  const node = src.cloneNode();
  node.volume = src.volume;
  node.play().catch(() => {});
}

export function startMusic() {
  if (musicEnabled) return;
  musicEnabled = true;
  syncMusic();
}

export function stopMusic() {
  if (!musicEnabled) return;
  musicEnabled = false;
  music.pause();
  music.currentTime = 0;
  syncMusic();
}

export function startLobbyMusic() {
  if (lobbyEnabled) return;
  lobbyEnabled = true;
  syncMusic();
}

export function stopLobbyMusic() {
  if (!lobbyEnabled) return;
  lobbyEnabled = false;
  lobby.pause();
  lobby.currentTime = 0;
  syncMusic();
}

export function startHomeMusic() {
  if (homeEnabled) return;
  homeEnabled = true;
  syncMusic();
}

export function stopHomeMusic() {
  if (!homeEnabled) return;
  homeEnabled = false;
  home.pause();
  home.currentTime = 0;
}
