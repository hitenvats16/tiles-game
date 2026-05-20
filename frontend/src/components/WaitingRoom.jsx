import { motion } from 'framer-motion';

export default function WaitingRoom({ room, isOwner, onStart }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 pb-4 min-h-0">
      <motion.div
        initial={{ scale: 0.94, y: 8, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="scribble-card p-6 w-full max-w-md text-center space-y-4"
      >
        <h3 className="scribble-title text-3xl">waiting room</h3>
        <p className="font-sketch text-lg">
          {room.members.length} / {room.maxPlayers} players in lobby
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {room.members.map((m) => (
            <div
              key={m.user.id}
              className="flex items-center gap-1 rounded-full px-2 py-0.5 sketchy"
            >
              <div
                className="w-3 h-3 rounded-full border border-ink"
                style={{ backgroundColor: m.user.color }}
              />
              <span className="font-sketch">{m.user.username}</span>
            </div>
          ))}
        </div>
        {isOwner ? (
          <button onClick={onStart} className="scribble-btn-primary text-lg">
            start game →
          </button>
        ) : (
          <p className="font-sketch text-ink/60">waiting for host to start...</p>
        )}
      </motion.div>
    </div>
  );
}
