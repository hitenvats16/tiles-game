import { motion, AnimatePresence } from 'framer-motion';

export default function Leaderboard({ scores, members, selfId }) {
  const items = members
    .map((m) => ({
      id: m.user.id,
      name: m.user.username,
      avatar: m.user.avatarUrl,
      color: m.user.color,
      score: scores[m.user.id] || 0,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="scribble-card p-3 w-full">
      <h3 className="scribble-title text-xl mb-2 doodle-underline inline-block">leaderboard</h3>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {items.map((it, idx) => (
            <motion.li
              key={it.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg border-2 ${
                it.id === selfId ? 'border-ink bg-ink/5' : 'border-transparent'
              }`}
            >
              <span className="font-sketch text-lg w-5 text-right text-ink/60">{idx + 1}</span>
              {it.avatar ? (
                <img src={it.avatar} alt="" className="w-7 h-7 rounded-full border-2 border-ink" />
              ) : (
                <div
                  className="w-7 h-7 rounded-full border-2 border-ink"
                  style={{ backgroundColor: it.color }}
                />
              )}
              <span className="font-sketch text-base truncate flex-1">{it.name}</span>
              <span
                className="w-3 h-3 rounded-full border border-ink"
                style={{ backgroundColor: it.color }}
              />
              <motion.span
                key={it.score}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className="font-sketch text-lg tabular-nums w-12 text-right"
              >
                {it.score}
              </motion.span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
