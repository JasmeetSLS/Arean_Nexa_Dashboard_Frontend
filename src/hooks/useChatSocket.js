import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const API_ORIGIN =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') ||
  'http://localhost:5000';

export function useSocket({ token: tokenOverride = null, autoConnect = true } = {}) {
  const [connected, setConnected] = useState(false);
  const socketRef  = useRef(null);
  const handlersRef = useRef(new Map());

  useEffect(() => {
    if (!autoConnect) return;

    const token = tokenOverride || localStorage.getItem('token');
    if (!token) return;

    const socket = io(API_ORIGIN, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on('connect',       () => setConnected(true));
    socket.on('disconnect',    () => setConnected(false));
    socket.on('connect_error', (err) => {
      console.error('[useSocket] connect_error', err.message);
      setConnected(false);
    });

    // Re-attach stored handlers
    handlersRef.current.forEach((handler, event) => {
      socket.on(event, handler);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [tokenOverride, autoConnect]);

  const emit = (event, payload, ack) => {
    socketRef.current?.emit(event, payload, ack);
  };

  const on = (event, handler) => {
    handlersRef.current.set(event, handler);
    socketRef.current?.on(event, handler);
  };

  const off = (event) => {
    const handler = handlersRef.current.get(event);
    if (handler) {
      socketRef.current?.off(event, handler);
      handlersRef.current.delete(event);
    }
  };

  return {
    socket: socketRef.current,
    connected,
    emit,
    on,
    off,
  };
}