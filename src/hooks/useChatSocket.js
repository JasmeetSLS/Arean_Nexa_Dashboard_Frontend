import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || '');

export default function useChatSocket({ onMessage, onTyping, onRead, onReadSync } = {}) {
  const socketRef = useRef(null);

  const cbMsg      = useRef(onMessage);
  const cbTyping   = useRef(onTyping);
  const cbRead     = useRef(onRead);
  const cbReadSync = useRef(onReadSync); // ✅ NEW

  useEffect(() => { cbMsg.current      = onMessage; }, [onMessage]);
  useEffect(() => { cbTyping.current   = onTyping;  }, [onTyping]);
  useEffect(() => { cbRead.current     = onRead;    }, [onRead]);
  useEffect(() => { cbReadSync.current = onReadSync; }, [onReadSync]); // ✅ NEW

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[useChatSocket] no token in localStorage');
      return;
    }

    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
    });

    socket.on('receive_message',    (m) => cbMsg.current?.(m));
    socket.on('typing',             (t) => cbTyping.current?.(t));
    socket.on('message_read',       (r) => cbRead.current?.(r));
    socket.on('messages_read_sync', (s) => cbReadSync.current?.(s)); // ✅ NEW

    socket.on('connect',       () => console.log('[socket] connected', socket.id));
    socket.on('connect_error', (e) => console.error('[socket] connect_error:', e.message));
    socket.on('disconnect',    (r) => console.warn('[socket] disconnected:', r));

    socketRef.current = socket;

    return () => {
      socket.off('receive_message');
      socket.off('typing');
      socket.off('message_read');
      socket.off('messages_read_sync'); // ✅ NEW
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');

      if (socket.connected) {
        socket.disconnect();
      } else {
        socket.on('connect', () => socket.disconnect());
      }
      socketRef.current = null;
    };
  }, []);

  return socketRef;
}