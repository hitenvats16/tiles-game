import { useEffect, useState } from 'react';
import { ROOM_STATUS } from '../constants/game.js';

function fmt(ms) {
  if (ms <= 0) return '00:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

// `clock` shape from useGameRoom: { remainingMs, status, receivedAt }
// Server is authoritative; we just interpolate locally between ticks for smoothness.
export default function GameClock({ clock, status }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const effectiveStatus = clock?.status || status;

  if (effectiveStatus === ROOM_STATUS.WAITING) {
    return <span className="font-sketch text-xl">waiting to start</span>;
  }
  if (effectiveStatus === ROOM_STATUS.ENDED) {
    return <span className="font-sketch text-xl">game ended</span>;
  }

  if (!clock?.receivedAt) {
    return <span className="font-sketch text-2xl tabular-nums">--:--</span>;
  }

  const elapsedSinceTick = now - clock.receivedAt;
  const remaining = Math.max(0, clock.remainingMs - elapsedSinceTick);
  return <span className="font-sketch text-2xl tabular-nums">{fmt(remaining)}</span>;
}
