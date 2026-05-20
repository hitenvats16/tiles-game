import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GAME } from '../constants/game.js';

const COOLDOWN_MS = GAME.COOLDOWN_MS;

export default function CooldownBar({ cooldownEndsAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, []);

  const remaining = Math.max(0, cooldownEndsAt - now);
  const pct = cooldownEndsAt ? Math.min(1, remaining / COOLDOWN_MS) : 0;
  const active = remaining > 0;

  return (
    <div className="scribble-card p-3 w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="font-sketch text-lg">cooldown</span>
        <motion.span
          key={Math.ceil(remaining / 100)}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="font-sketch text-lg tabular-nums"
        >
          {active ? `${(remaining / 1000).toFixed(1)}s` : 'ready ✓'}
        </motion.span>
      </div>
      <div className="h-3 rounded-full bg-paper overflow-hidden sketchy">
        <motion.div
          animate={{ width: `${pct * 100}%` }}
          transition={{ ease: 'linear', duration: 0.1 }}
          className="h-full bg-ink"
        />
      </div>
    </div>
  );
}
