import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth.js';
import { useMuted, toggleMute } from '../lib/sounds.js';

export default function ScribbleHeader({ title, back, showLogo }) {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const muted = useMuted();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className="w-full px-4 md:px-8 py-3 flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        {back && (
          <button
            onClick={() => navigate(back)}
            className="scribble-btn !px-3 !py-1 text-base"
          >
            ← back
          </button>
        )}
        {showLogo ? (
          <img
            src="/logo.png"
            alt="tiles"
            className="h-12 md:h-14 w-auto select-none"
            draggable={false}
          />
        ) : (
          <h1 className="scribble-title text-3xl md:text-4xl doodle-underline">
            {title}
          </h1>
        )}
      </div>
      {user && (
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            title={muted ? 'unmute' : 'mute'}
            aria-label={muted ? 'unmute' : 'mute'}
            className="scribble-btn !px-3 !py-1 text-base"
          >
            {muted ? 'sound off' : 'sound on'}
          </button>
          <div className="flex items-center gap-2 scribble-card px-3 py-1">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-8 h-8 rounded-full border-2 border-ink"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full border-2 border-ink"
                style={{ backgroundColor: user.color }}
              />
            )}
            <span className="font-sketch text-lg">{user.username}</span>
            <div
              className="w-3 h-3 rounded-full border border-ink"
              style={{ backgroundColor: user.color }}
            />
          </div>
          <button onClick={signOut} className="scribble-btn !px-3 !py-1 text-base">
            sign out
          </button>
        </div>
      )}
    </motion.header>
  );
}
