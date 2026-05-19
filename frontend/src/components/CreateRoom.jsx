import { useState } from 'react';
import { motion } from 'framer-motion';
import { GAME } from '../constants/game.js';

const DEFAULTS = {
  name: '',
  maxPlayers: 6,
  gridSize: 30,
  durationMin: 5,
  isPublic: true,
};

export default function CreateRoom({ onCreate }) {
  const [form, setForm] = useState(DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError('give your room a name');
    if (form.gridSize < GAME.GRID_MIN || form.gridSize > GAME.GRID_MAX)
      return setError(`grid size ${GAME.GRID_MIN}–${GAME.GRID_MAX}`);
    if (form.maxPlayers < GAME.PLAYERS_MIN || form.maxPlayers > GAME.PLAYERS_MAX)
      return setError(`max players ${GAME.PLAYERS_MIN}–${GAME.PLAYERS_MAX}`);
    if (form.durationMin < GAME.DURATION_MIN_MIN || form.durationMin > GAME.DURATION_MAX_MIN)
      return setError(`duration ${GAME.DURATION_MIN_MIN}–${GAME.DURATION_MAX_MIN} min`);
    setBusy(true);
    try {
      await onCreate({
        name: form.name.trim(),
        maxPlayers: Number(form.maxPlayers),
        gridSize: Number(form.gridSize),
        durationSec: Math.round(Number(form.durationMin) * 60),
        isPublic: !!form.isPublic,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="scribble-card p-6 space-y-4"
    >
      <h2 className="scribble-title text-3xl doodle-underline inline-block">new room</h2>

      <Field label="name">
        <input
          className="scribble-input"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="my territory game"
          maxLength={60}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={`max players: ${form.maxPlayers}`}>
          <input
            type="range"
            min={GAME.PLAYERS_MIN}
            max={GAME.PLAYERS_MAX}
            value={form.maxPlayers}
            onChange={(e) => set('maxPlayers', Number(e.target.value))}
            className="w-full accent-ink"
          />
        </Field>

        <Field label={`grid: ${form.gridSize} × ${form.gridSize}`}>
          <input
            type="range"
            min={GAME.GRID_MIN}
            max={GAME.GRID_MAX}
            step={1}
            value={form.gridSize}
            onChange={(e) => set('gridSize', Number(e.target.value))}
            className="w-full accent-ink"
          />
        </Field>
      </div>

      <Field label="duration (minutes)">
        <input
          type="number"
          min={GAME.DURATION_MIN_MIN}
          max={GAME.DURATION_MAX_MIN}
          value={form.durationMin}
          onChange={(e) => set('durationMin', Number(e.target.value))}
          className="scribble-input"
        />
      </Field>

      <label className="flex items-center gap-2 font-sketch text-lg cursor-pointer">
        <input
          type="checkbox"
          checked={form.isPublic}
          onChange={(e) => set('isPublic', e.target.checked)}
          className="w-5 h-5 accent-ink"
        />
        public — anyone can find & join
      </label>

      {error && (
        <motion.p
          initial={{ x: -8 }}
          animate={{ x: [0, -4, 4, -2, 2, 0] }}
          className="text-red-600 font-sketch"
        >
          {error}
        </motion.p>
      )}

      <button type="submit" disabled={busy} className="scribble-btn-primary w-full text-xl">
        {busy ? 'creating...' : 'create room →'}
      </button>
    </motion.form>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1">
      <span className="font-sketch text-lg text-ink/80">{label}</span>
      {children}
    </label>
  );
}
