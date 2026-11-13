import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || '');

export default function useChatSocket({ onMessage, onTyping, onRead } = {}) {
  const socketRef = useRef(null);

  const cbMsg    = useRef(onMessage);
  const cbTyping = useRef(onTyping);
  const cbRead   = useRef(onRead);

  useEffect(() => { cbMsg.current    = onMessage; }, [onMessage]);
  useEffect(() => { cbTyping.current = onTyping;  }, [onTyping]);
  useEffect(() => { cbRead.current   = onRead;    }, [onRead]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[useChatSocket] no token in localStorage');
      return;
    }

    const socket = io(SOCKET_URL, { auth: { token } , transports: ["websocket"]});

    socket.on('receive_message', (m) => cbMsg.current?.(m));
    socket.on('typing',          (t) => cbTyping.current?.(t));
    socket.on('message_read',    (r) => cbRead.current?.(r));

    socket.on('connect',       () => console.log('[socket] connected', socket.id));
    socket.on('connect_error', (e) => console.error('[socket] connect_error:', e.message));
    socket.on('disconnect',    (r) => console.warn('[socket] disconnected:', r));

    socketRef.current = socket;

    return () => {
      socket.off('receive_message');
      socket.off('typing');
      socket.off('message_read');
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