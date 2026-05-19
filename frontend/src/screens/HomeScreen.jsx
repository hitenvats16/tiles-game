import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ScribbleHeader from '../components/ScribbleHeader.jsx';
import RoomList from '../components/RoomList.jsx';
import CreateRoom from '../components/CreateRoom.jsx';
import { api } from '../lib/api.js';
import { useLobby } from '../hooks/useLobby.js';
import { startHomeMusic, stopHomeMusic } from '../lib/sounds.js';

const TABS = [
  { id: 'browse', label: 'ongoing' },
  { id: 'create', label: 'new room' },
];

export default function HomeScreen() {
  const [tab, setTab] = useState('browse');
  const { rooms, loading, refresh } = useLobby();
  const navigate = useNavigate();

  useEffect(() => {
    startHomeMusic();
    return () => stopHomeMusic();
  }, []);

  async function handleJoin(room) {
    await api.joinRoom(room.id);
    navigate(`/rooms/${room.id}`);
  }

  async function handleCreate(payload) {
    const { room } = await api.createRoom(payload);
    navigate(`/rooms/${room.id}`);
  }

  return (
    <div className="h-full flex flex-col">
      <ScribbleHeader showLogo />

      <div className="relative mt-2 mb-4 px-4">
        <div className="flex justify-center">
          <div className="scribble-card p-1 flex relative">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative font-sketch text-lg md:text-xl px-5 py-2 rounded-xl"
              >
                {tab === t.id && (
                  <motion.span
                    layoutId="tab-bg"
                    className="absolute inset-0 bg-ink rounded-xl"
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  />
                )}
                <span
                  className={`relative z-10 ${tab === t.id ? 'text-paper' : 'text-ink'}`}
                >
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setTab('create')}
          className="scribble-btn-primary absolute right-4 top-1/2 -translate-y-1/2 text-lg"
        >
          <span aria-hidden className="text-2xl leading-none">+</span>
          create room
        </button>
      </div>

      <div className="flex-1 px-4 pb-8">
        <AnimatePresence mode="wait">
          {tab === 'browse' ? (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="max-w-6xl mx-auto"
            >
              <RoomList rooms={rooms} loading={loading} onJoin={handleJoin} onRefresh={refresh} />
            </motion.div>
          ) : (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="max-w-xl mx-auto"
            >
              <CreateRoom onCreate={handleCreate} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
