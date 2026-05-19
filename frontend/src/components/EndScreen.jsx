import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function EndScreen({ scores, members, selfId }) {
  const navigate = useNavigate();
  const ranked = members
    .map((m) => ({
      id: m.user.id,
      name: m.user.username,
      avatar: m.user.avatarUrl,
      color: m.user.color,
      score: scores[m.user.id] || 0,
    }))
    .sort((a, b) => b.score - a.score);
  const winner = ranked[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-paper/90 backdrop-blur p-4"
    >
      <motion.div
        initial={{ scale: 0.9, rotate: -1, y: 20 }}
        animate={{ scale: 1, rotate: 0, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className="scribble-card p-6 w-full max-w-md space-y-4"
      >
        <div className="text-center space-y-2">
          <h2 className="scribble-title text-4xl">game over</h2>
          {winner && (
            <p className="font-sketch text-xl">
              👑 <span className="doodle-underline">{winner.name}</span> wins with{' '}
              <span className="font-bold">{winner.score}</span> tiles!
            </p>
          )}
        </div>

        <ul className="space-y-2">
          {ranked.map((it, idx) => (
            <motion.li
              key={it.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl border-2 ${
                it.id === selfId ? 'border-ink bg-ink/5' : 'border-ink/40'
              }`}
            >
              <span className="font-sketch text-2xl w-8 text-right">{idx + 1}</span>
              {it.avatar ? (
                <img src={it.avatar} alt="" className="w-9 h-9 rounded-full border-2 border-ink" />
              ) : (
                <div
                  className="w-9 h-9 rounded-full border-2 border-ink"
                  style={{ backgroundColor: it.color }}
                />
              )}
              <span className="font-sketch text-lg flex-1">{it.name}</span>
              <span
                className="w-4 h-4 rounded-full border border-ink"
                style={{ backgroundColor: it.color }}
              />
              <span className="font-sketch text-xl tabular-nums w-14 text-right">{it.score}</span>
            </motion.li>
          ))}
        </ul>

        <button onClick={() => navigate('/')} className="scribble-btn-primary w-full text-lg">
          back to lobby
        </button>
      </motion.div>
    </motion.div>
  );
}
