import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ScribbleHeader from '../components/ScribbleHeader.jsx';
import GameCanvas from '../components/GameCanvas.jsx';
import Leaderboard from '../components/Leaderboard.jsx';
import CooldownBar from '../components/CooldownBar.jsx';
import GameClock from '../components/GameClock.jsx';
import EndScreen from '../components/EndScreen.jsx';
import WaitingRoom from '../components/WaitingRoom.jsx';
import SquareSlot from '../components/SquareSlot.jsx';
import { useAuth } from '../store/auth.js';
import { useGameRoom } from '../hooks/useGameRoom.js';
import { ERROR_LABELS } from '../constants/errors.js';
import { ROOM_STATUS } from '../constants/game.js';

export default function GameScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const {
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
  } = useGameRoom(id);

  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!lastClaimError) return;
    const label = ERROR_LABELS[lastClaimError.code] || lastClaimError.message || 'something went wrong';
    setToast({ id: lastClaimError.at, label });
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [lastClaimError]);

  const colors = useMemo(() => {
    const map = {};
    for (const m of room?.members || []) map[m.user.id] = m.user.color;
    return map;
  }, [room]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <motion.div
          initial={{ y: 12, opacity: 0, rotate: -1 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="scribble-card p-6 w-full max-w-sm text-center space-y-4"
        >
          <h3 className="scribble-title text-3xl text-red-600">{error}</h3>
          <p className="font-sketch text-ink/60">can't join this room.</p>
          <button onClick={() => navigate('/')} className="scribble-btn-primary w-full text-lg">
            ← back to lobby
          </button>
        </motion.div>
      </div>
    );
  }
  if (!room || !meta) {
    return (
      <div className="h-full flex items-center justify-center font-sketch text-2xl animate-wobble">
        loading room...
      </div>
    );
  }

  const isOwner = room.ownerId === user?.id;
  const isWaiting = meta.status === ROOM_STATUS.WAITING;
  const isActive = meta.status === ROOM_STATUS.ACTIVE;
  const isEnded = meta.status === ROOM_STATUS.ENDED;

  return (
    <div className="h-full flex flex-col">
      <ScribbleHeader title={room.name} back="/" />

      <div className="px-4 pb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              connected ? 'bg-emerald-500' : 'bg-red-500'
            }`}
            title={connected ? 'connected' : 'reconnecting...'}
          />
          <span className="font-sketch text-sm text-ink/70">
            {connected ? 'live' : 'reconnecting...'}
          </span>
        </div>
        <GameClock clock={clock} status={meta.status} />
      </div>

      {isWaiting ? (
        <WaitingRoom room={room} isOwner={isOwner} onStart={startGame} />
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_18rem] gap-3 px-4 pb-4 min-h-0">
          <div className="relative min-h-0 min-w-0 flex items-center justify-center">
            <SquareSlot>
              <GameCanvas
                gridSize={meta.gridSize}
                grid={grid}
                colors={colors}
                selfId={user.id}
                selfColor={user.color}
                disabled={!isActive}
                onClaim={(x, y) => claim(x, y)}
              />
            </SquareSlot>

            <AnimatePresence>
              {toast && (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-paper border-2 border-ink rounded-xl px-3 py-1 font-sketch text-base shadow-scribbleSm"
                >
                  {toast.label}
                </motion.div>
              )}
            </AnimatePresence>

            {(isEnded || endedAt) && (
              <EndScreen scores={scores} members={room.members} selfId={user.id} />
            )}
          </div>

          <aside className="w-full flex flex-col gap-3 min-w-0">
            <CooldownBar cooldownEndsAt={cooldownEndsAt} />
            <Leaderboard scores={scores} members={room.members} selfId={user.id} />
            <div className="scribble-card p-3 font-sketch text-sm text-ink/70 space-y-1">
              <p>• click a tile to claim it</p>
              <p>• 5s cooldown between claims</p>
              <p>• last claim wins — any tile can be taken</p>
              <p>• you must place adjacent to your own tiles</p>
              <p>• drag with shift / middle-click to pan, scroll to zoom</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
