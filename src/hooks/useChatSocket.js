import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api')
    .replace('/api', '');

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
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },             // ← backend decodes this
      transports: ['websocket'],
    });

    socket.on('receive_message', (m) => cbMsg.current?.(m));
    socket.on('typing',          (t) => cbTyping.current?.(t));
    socket.on('message_read',    (r) => cbRead.current?.(r));

    socketRef.current = socket;

    return () => {
      socket.off('receive_message');
      socket.off('typing');
      socket.off('message_read');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socketRef;
}