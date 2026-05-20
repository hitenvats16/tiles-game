import { motion } from 'framer-motion';
import { ROOM_STATUS } from '../constants/game.js';

const STATUS_LABEL = {
  [ROOM_STATUS.ACTIVE]: 'live',
  [ROOM_STATUS.WAITING]: 'waiting',
  [ROOM_STATUS.ENDED]: 'ended',
};

function badge(status) {
  return STATUS_LABEL[status] || status;
}

export default function RoomList({ rooms, loading, onJoin, onRefresh, onCreate }) {
  if (loading && rooms.length === 0) {
    return (
      <div className="text-center py-20 font-sketch text-2xl animate-wobble">
        looking for games...
      </div>
    );
  }
  if (rooms.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="font-sketch text-2xl">no rooms going right now.</p>
        <p className="font-sketch text-lg text-ink/60">be the first to start one.</p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button onClick={onRefresh} className="scribble-btn">refresh</button>
          {onCreate && (
            <button onClick={onCreate} className="scribble-btn-primary">
              <span aria-hidden className="text-2xl leading-none">+</span>
              create room
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((room, i) => (
        <motion.button
          key={room.id}
          layout
          initial={{ opacity: 0, y: 12, rotate: i % 2 === 0 ? -0.6 : 0.6 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ rotate: 0, y: -4 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22, delay: i * 0.03 }}
          onClick={() => onJoin(room)}
          className="scribble-card p-4 text-left flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="font-sketch text-2xl truncate">{room.name}</span>
            <span className="font-sketch text-xs px-2 py-0.5 rounded-full bg-paper sketchy">
              {badge(room.status)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {room.owner?.avatarUrl ? (
              <img
                src={room.owner.avatarUrl}
                alt=""
                className="w-7 h-7 rounded-full border-2 border-ink"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full border-2 border-ink"
                style={{ backgroundColor: room.owner?.color }}
              />
            )}
            <span className="font-sketch text-lg">{room.owner?.username}</span>
          </div>
          <div className="grid grid-cols-3 text-center font-sketch text-sm">
            <div>
              <div className="text-ink/60">grid</div>
              <div className="text-lg">{room.gridSize}²</div>
            </div>
            <div>
              <div className="text-ink/60">players</div>
              <div className="text-lg">{room.memberCount}/{room.maxPlayers}</div>
            </div>
            <div>
              <div className="text-ink/60">time</div>
              <div className="text-lg">{Math.round(room.durationSec / 60)}m</div>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
