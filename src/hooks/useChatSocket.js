import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export default function useChatSocket({ role, trainerId, name }) {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const s = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },                  // 👈 send JWT to server
    });

    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      setConnected(true);
      s.emit('register', { role, trainerId, name });
    });

    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', (err) => {
      console.warn('[socket] connect_error:', err.message);
      setConnected(false);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [role, trainerId, name]);

  return { socket, connected };
}