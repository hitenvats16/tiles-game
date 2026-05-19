import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../lib/socket.js';
import { api } from '../lib/api.js';
import { playSound, startMusic, stopMusic, startLobbyMusic, stopLobbyMusic } from '../lib/sounds.js';
import { useAuth } from '../store/auth.js';
import { SOCKET_EVENTS } from '../constants/events.js';
import { ROOM_STATUS } from '../constants/game.js';
import { ERROR_CODES } from '../constants/errors.js';

function hasAdjacentOwn(grid, selfId, x, y, size) {
  const neighbors = [
    [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1],
  ];
  for (const [nx, ny] of neighbors) {
    if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
    if (grid[`${nx}:${ny}`] === selfId) return true;
  }
  return false;
}

// `clock` shape: { remainingMs, status, receivedAt } — receivedAt is local time
// the tick landed, used to smoothly interpolate between server ticks.
const emptyClock = { remainingMs: 0, status: null, receivedAt: 0 };

export function useGameRoom(roomId) {
  const selfId = useAuth((s) => s.user?.id);
  const [room, setRoom] = useState(null);
  const [meta, setMeta] = useState(null);
  const [grid, setGrid] = useState({});
  const [scores, setScores] = useState({});
  const [clock, setClock] = useState(emptyClock);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastClaimError, setLastClaimError] = useState(null);
  const [cooldownEndsAt, setCooldownEndsAt] = useState(0);
  const [endedAt, setEndedAt] = useState(null);
  const socketRef = useRef(null);
  const statusRef = useRef(null);
  const gridRef = useRef({});
  const scoresRef = useRef({});
  const metaRef = useRef(null);
  const cooldownEndsAtRef = useRef(0);

  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { scoresRef.current = scores; }, [scores]);
  useEffect(() => { metaRef.current = meta; }, [meta]);
  useEffect(() => { cooldownEndsAtRef.current = cooldownEndsAt; }, [cooldownEndsAt]);

  function ingestClock(payload) {
    if (!payload) return;
    setClock({
      remainingMs: payload.remainingMs ?? 0,
      status: payload.status,
      receivedAt: Date.now(),
    });
  }

  function applySnapshot(resp) {
    setMeta(resp.meta);
    statusRef.current = resp.meta?.status || null;
    setGrid(resp.grid || {});
    setScores(resp.scores || {});
    ingestClock(resp.clock);
    if (resp.meta?.status === ROOM_STATUS.ENDED) setEndedAt(Date.now());
    if (resp.meta?.status === ROOM_STATUS.ACTIVE) {
      stopLobbyMusic();
      startMusic();
    } else {
      stopMusic();
      startLobbyMusic();
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { room } = await api.getRoom(roomId);
        if (!cancelled) setRoom(room);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const join = () => {
      socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId }, (resp) => {
        if (!resp?.ok) {
          setError(resp?.error || 'Failed to join');
          return;
        }
        applySnapshot(resp);
      });
    };

    const handlers = {
      [SOCKET_EVENTS.CONNECT]: () => {
        setConnected(true);
        join();
      },
      [SOCKET_EVENTS.DISCONNECT]: () => setConnected(false),
      [SOCKET_EVENTS.TILE_UPDATE]: (u) => {
        setGrid((g) => ({ ...g, [`${u.x}:${u.y}`]: u.owner }));
      },
      [SOCKET_EVENTS.LEADERBOARD_UPDATE]: ({ scores: next }) => setScores(next || {}),
      [SOCKET_EVENTS.CLOCK_TICK]: ingestClock,
      [SOCKET_EVENTS.GAME_STARTED]: (payload) => {
        if (payload?.meta) {
          setMeta(payload.meta);
          statusRef.current = payload.meta.status;
        }
        ingestClock(payload?.clock);
        playSound('start');
        stopLobbyMusic();
        startMusic();
      },
      [SOCKET_EVENTS.GAME_ENDED]: ({ scores: next, endedAt }) => {
        setScores(next || {});
        setEndedAt(endedAt);
        statusRef.current = ROOM_STATUS.ENDED;
        setMeta((m) => (m ? { ...m, status: ROOM_STATUS.ENDED } : m));
        setClock((c) => ({ ...c, remainingMs: 0, status: ROOM_STATUS.ENDED, receivedAt: Date.now() }));
        playSound('end');
        stopMusic();
        startLobbyMusic();
      },
      [SOCKET_EVENTS.MEMBER_JOINED]: ({ user: joined }) => {
        setRoom((r) => {
          if (!r) return r;
          if (r.members.some((m) => m.user.id === joined.id)) return r;
          return { ...r, members: [...r.members, { user: joined }] };
        });
      },
      [SOCKET_EVENTS.MEMBER_LEFT]: ({ userId }) => {
        // Only prune lobby-state leavers; once the game is ACTIVE/ENDED, keep
        // them in the leaderboard so historical scores still render.
        if (statusRef.current && statusRef.current !== ROOM_STATUS.WAITING) return;
        setRoom((r) => {
          if (!r) return r;
          return { ...r, members: r.members.filter((m) => m.user.id !== userId) };
        });
      },
    };

    for (const [evt, fn] of Object.entries(handlers)) socket.on(evt, fn);
    socket.io.on(SOCKET_EVENTS.RECONNECT, join);

    if (socket.connected) handlers[SOCKET_EVENTS.CONNECT]();

    return () => {
      for (const [evt, fn] of Object.entries(handlers)) socket.off(evt, fn);
      socket.io.off(SOCKET_EVENTS.RECONNECT, join);
      if (socket.connected) socket.emit(SOCKET_EVENTS.ROOM_LEAVE);
      stopMusic();
      stopLobbyMusic();
    };
  }, [roomId]);

  const claim = useCallback((x, y) => {
    return new Promise((resolve) => {
      const socket = socketRef.current;
      if (!socket || !selfId) return resolve({ ok: false, error: 'No socket' });

      const key = `${x}:${y}`;

      const now = Date.now();
      const cdRemaining = cooldownEndsAtRef.current - now;
      if (cdRemaining > 0) {
        setLastClaimError({ at: now, code: ERROR_CODES.COOLDOWN });
        playSound('error');
        return resolve({ ok: false, code: ERROR_CODES.COOLDOWN, remainingMs: cdRemaining });
      }

      const ownsAny = (scoresRef.current?.[selfId] || 0) > 0;
      const gridSize = metaRef.current?.gridSize;
      if (ownsAny && gridSize && !hasAdjacentOwn(gridRef.current, selfId, x, y, gridSize)) {
        setLastClaimError({ at: now, code: ERROR_CODES.NOT_ADJACENT });
        playSound('error');
        return resolve({ ok: false, code: ERROR_CODES.NOT_ADJACENT });
      }

      let prevOwner;
      setGrid((g) => {
        prevOwner = g[key];
        if (prevOwner === selfId) return g;
        return { ...g, [key]: selfId };
      });
      if (prevOwner !== selfId) playSound('claim');

      socket.emit(SOCKET_EVENTS.TILE_CLAIM, { x, y }, (resp) => {
        if (!resp?.ok) {
          setGrid((g) => {
            if (g[key] !== selfId) return g;
            if (prevOwner === undefined) {
              const { [key]: _, ...rest } = g;
              return rest;
            }
            return { ...g, [key]: prevOwner };
          });
          setLastClaimError({ at: Date.now(), code: resp?.code, message: resp?.error });
          if (resp?.code === ERROR_CODES.COOLDOWN && typeof resp.remainingMs === 'number') {
            setCooldownEndsAt(Date.now() + resp.remainingMs);
          }
          playSound('error');
        } else {
          setLastClaimError(null);
          if (typeof resp.cooldownMs === 'number') {
            setCooldownEndsAt(Date.now() + resp.cooldownMs);
          }
        }
        resolve(resp);
      });
    });
  }, [selfId]);

  const startGame = useCallback(async () => {
    try {
      const { room } = await api.startRoom(roomId);
      setRoom(room);
      // Authoritative state will arrive via GAME_STARTED broadcast.
    } catch (e) {
      setError(e.message);
    }
  }, [roomId]);

  return {
    room,
    meta,
    grid,
    scores,
    clock,
    connected,
    error,
    lastClaimError,
    cooldownEndsAt,
    endedAt,
    claim,
    startGame,
  };
}
