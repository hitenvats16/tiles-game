import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '../lib/socket.js';
import { api } from '../lib/api.js';
import { SOCKET_EVENTS } from '../constants/events.js';

export function useLobby() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const { rooms } = await api.listRooms();
      setRooms(rooms);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const socket = getSocket();

    const subscribe = () => socket.emit(SOCKET_EVENTS.LOBBY_SUBSCRIBE);

    const onUpsert = ({ room }) => {
      setRooms((rs) => {
        const idx = rs.findIndex((r) => r.id === room.id);
        if (idx === -1) return [room, ...rs];
        const next = rs.slice();
        next[idx] = room;
        return next;
      });
    };

    const onRemove = ({ roomId }) => {
      setRooms((rs) => rs.filter((r) => r.id !== roomId));
    };

    socket.on(SOCKET_EVENTS.LOBBY_ROOM_UPSERT, onUpsert);
    socket.on(SOCKET_EVENTS.LOBBY_ROOM_REMOVE, onRemove);
    socket.on(SOCKET_EVENTS.CONNECT, subscribe);
    socket.io.on(SOCKET_EVENTS.RECONNECT, () => {
      subscribe();
      refresh(); // resync any events that fired while disconnected
    });

    if (socket.connected) subscribe();

    return () => {
      socket.off(SOCKET_EVENTS.LOBBY_ROOM_UPSERT, onUpsert);
      socket.off(SOCKET_EVENTS.LOBBY_ROOM_REMOVE, onRemove);
      socket.off(SOCKET_EVENTS.CONNECT, subscribe);
      socket.emit(SOCKET_EVENTS.LOBBY_UNSUBSCRIBE);
    };
  }, [refresh]);

  return { rooms, loading, error, refresh };
}
