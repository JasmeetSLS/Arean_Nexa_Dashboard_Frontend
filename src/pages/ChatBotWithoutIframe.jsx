// src/pages/ChatBotWithoutIframe.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Search } from 'lucide-react';
import { getChatUsers, getChatMessages, postChatMessage, getMe } from '../service/api';
import useChatSocket from '../hooks/useChatSocket';

/* ────────────────────────── Avatar ────────────────────────── */
function Avatar({ name = '', photoUrl, size = 'sm' }) {
  const dim = size === 'lg' ? 'h-10 w-10 text-[12px]' : 'h-8 w-8 text-[10px]';
  if (photoUrl) {
    return (
      <img
        src={`${import.meta.env.VITE_IMAGE_BASE_URL || ''}${photoUrl}`}
        alt={name}
        className={`${dim} rounded-full object-cover shrink-0 bg-slate-200`}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black flex items-center justify-center shrink-0`}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

/* ── Inline chat bubble icon (replaces lucide MessageCircle) ── */
function BubbleIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

/* ─────────────────────── Main Page ─────────────────────── */
export default function ChatBotWithoutIframe() {
  const [me, setMe]                   = useState(null);
  const [convs, setConvs]             = useState([]);
  const [active, setActive]           = useState(null);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [typing, setTyping]           = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const listRef     = useRef(null);
  const typingTimer = useRef(null);
  const activeRef   = useRef(null);
  const searchRef   = useRef('');

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { searchRef.current = searchQuery; }, [searchQuery]);

  /* 1. My profile */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMe();
        if (data.success) setMe(data.user);
      } catch (err) {
        console.error('Failed to load my details:', err);
      }
    })();
  }, []);

  const scrollDown = useCallback(() => {
    setTimeout(() => listRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }), 30);
  }, []);

  /* 2. Conversation list */
  const loadUsers = useCallback(async (search = '') => {
    try {
      const { data } = await getChatUsers({ search });
      if (data.success) {
        setConvs(
          data.users.map((u) => ({
            peerUsername: u.peerUsername,
            peerName:     u.peerName,
            peerType:     u.type,
            photoUrl:     u.photoUrl,
            lastMessage:  u.lastMessage,
            unread:       u.unread || 0,
          }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  /* 3. Socket */
  const socketRef = useChatSocket({
    onMessage: (msg) => {
      if (!me) return;

      const isMine = msg.sender_username === me.username && msg.sender_type === me.type;
      const peerUsername = isMine ? msg.receiver_username : msg.sender_username;
      const peerType     = isMine ? msg.receiver_type     : msg.sender_type;

      const isActive =
        activeRef.current &&
        activeRef.current.peerUsername === peerUsername &&
        activeRef.current.peerType     === peerType;

      if (isActive) {
        setMessages((prev) => {
          if (isMine) {
            const tempIndex = prev.findIndex(
              (m) =>
                typeof m.id === 'string' &&
                m.id.startsWith('temp-') &&
                m.message === msg.message
            );
            if (tempIndex !== -1) {
              const next = [...prev];
              next[tempIndex] = msg;
              return next;
            }
          }
          return prev.some((m) => m.id === msg.id) ? prev : [...prev, msg];
        });
        scrollDown();
        socketRef.current?.emit('message_read', { peerUsername });
      }

      setConvs((prev) => {
        const exists = prev.some(
          (c) => c.peerUsername === peerUsername && c.peerType === peerType
        );

        if (!exists && !isMine) {
          loadUsers(searchRef.current);
          return prev;
        }

        const next = prev.map((c) =>
          c.peerUsername === peerUsername && c.peerType === peerType
            ? {
                ...c,
                lastMessage: msg,
                unread: isActive || isMine ? c.unread : c.unread + 1,
              }
            : c
        );
        next.sort(
          (a, b) =>
            new Date(b.lastMessage?.created_at || 0) -
            new Date(a.lastMessage?.created_at || 0)
        );
        return next;
      });
    },

    onTyping: (t) => {
      if (activeRef.current && t.fromUsername === activeRef.current.peerUsername) {
        setTyping(t.isTyping);
        if (t.isTyping) {
          clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setTyping(false), 3000);
        }
      }
    },

    onRead: (r) => {
      if (!me) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.receiver_username === r.byUsername &&
          m.receiver_type     === r.byType &&
          m.sender_username   === me.username &&
          m.sender_type       === me.type
            ? { ...m, is_read: 1 }
            : m
        )
      );
    },

    // ✅ ADDED: Sync unread badges across multiple tabs/windows
    onReadSync: (data) => {
      setConvs((prev) =>
        prev.map((c) =>
          c.peerUsername === data.peerUsername
            ? { ...c, unread: 0 }
            : c
        )
      );
    },
  });

  /* 4. Debounced search */
  useEffect(() => {
    const t = setTimeout(() => loadUsers(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, loadUsers]);

  /* 5. Open a conversation */
  const openConversation = useCallback((peer) => {
    setActive({ ...peer, unread: 0 });
    setTyping(false);
    setConvs((prev) =>
      prev.map((c) =>
        c.peerUsername === peer.peerUsername && c.peerType === peer.peerType
          ? { ...c, unread: 0 }
          : c
      )
    );
  }, []);

  /* 6. Load messages when the active peer changes */
  useEffect(() => {
    if (!active) return;

    setMessages([]);
    (async () => {
      try {
        const { data } = await getChatMessages(active.peerUsername, { limit: 100 });
        if (data.success) {
          setMessages(data.messages || []);
          scrollDown();
          socketRef.current?.emit('message_read', { peerUsername: active.peerUsername });
          loadUsers(searchRef.current);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [active, scrollDown, loadUsers, socketRef]);

  /* 7. Send (optimistic UI) */
  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !active || !me) return;

    setInput('');
    const tempId = `temp-${Date.now()}`;

    const optimisticMsg = {
      id: tempId,
      sender_username:   me.username,
      sender_type:       me.type,
      receiver_username: active.peerUsername,
      receiver_type:     active.peerType,
      message:           text,
      is_read:           0,
      created_at:        new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    scrollDown();

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('send_message', { peerUsername: active.peerUsername, message: text });
      socket.emit('typing', { peerUsername: active.peerUsername, isTyping: false });
      return;
    }

    try {
      const { data } = await postChatMessage(active.peerUsername, text);
      if (data.success) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? data.data : m)));
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  /* 8. Typing indicator out */
  const handleChange = (e) => {
    setInput(e.target.value);
    const socket = socketRef.current;
    if (!active || !socket) return;
    socket.emit('typing', { peerUsername: active.peerUsername, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typing', { peerUsername: active.peerUsername, isTyping: false });
    }, 1200);
  };

  const time = (d) =>
    new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  /* ─────────────────────────── UI ─────────────────────────── */
  return (
    <div className="h-[calc(100dvh-64px)] w-full overflow-hidden bg-white">
      <div className="flex h-full w-full flex-col overflow-hidden md:flex-row">
        {/* ── Left: conversation list ── */}
        <aside className="flex max-h-[40vh] w-full shrink-0 flex-col border-b border-slate-200 bg-white md:max-h-full md:w-72 md:border-b-0 md:border-r">
          {/* my profile */}
          <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <Avatar name={me?.displayName || me?.username || ''} photoUrl={me?.photoUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-900">
                {me?.displayName || me?.username || 'Loading...'}
              </p>
              <p className="text-[10px] capitalize text-slate-500">{me?.type || '...'}</p>
            </div>
          </div>

          {/* search */}
          <div className="border-b border-slate-100 px-3 py-2">
            <div className="group relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search person..."
                className="w-full rounded-lg border border-transparent bg-slate-100 py-1.5 pl-8 pr-3 text-xs transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* list */}
          <div className="flex-1 overflow-y-auto">
            {convs.map((c) => {
              const isActive =
                active?.peerUsername === c.peerUsername && active?.peerType === c.peerType;
              return (
                <button
                  key={`${c.peerType}:${c.peerUsername}`}
                  onClick={() => openConversation(c)}
                  className={`flex w-full items-center gap-2.5 border-l-2 px-3 py-2.5 text-left transition hover:bg-slate-50 ${
                    isActive ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                  }`}
                >
                  <Avatar name={c.peerName} photoUrl={c.photoUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-900">{c.peerName}</p>
                    <p className="truncate text-[10px] text-slate-500">
                      {c.lastMessage?.message || 'No messages yet'}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                      {c.unread}
                    </span>
                  )}
                </button>
              );
            })}
            {convs.length === 0 && (
              <p className="px-3 py-6 text-center text-[11px] italic text-slate-400">
                {searchQuery ? 'No person found' : 'No conversations'}
              </p>
            )}
          </div>
        </aside>

        {/* ── Right: chat panel ── */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#F0F2F5]">
          {active ? (
            <>
              <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={active.peerName} photoUrl={active.photoUrl} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">
                      {active.peerName}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {typing ? 'typing…' : active.peerType}
                    </p>
                  </div>
                </div>
              </header>

              <div ref={listRef} className="flex-1 space-y-1.5 overflow-y-auto px-4 py-3">
                {messages.map((m) => {
                  const mine =
                    me?.username != null &&
                    m.sender_username === me.username &&
                    m.sender_type === me.type;

                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] px-3 py-2 text-[12px] shadow-sm ${
                          mine
                            ? 'rounded-2xl rounded-br-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                            : 'rounded-2xl rounded-bl-md bg-white text-slate-800'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.message}</p>
                        <p
                          className={`mt-0.5 text-right text-[9px] ${
                            mine ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {time(m.created_at)} {mine && (m.is_read ? '✓✓' : '✓')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={send}
                className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white p-2.5"
              >
                <input
                  value={input}
                  onChange={handleChange}
                  placeholder="Type a message…"
                  className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md transition hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <div>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <BubbleIcon className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-xs font-bold text-slate-700">Select a conversation</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {me?.type === 'admin'
                    ? 'Pick a trainer to start chatting'
                    : 'Pick an admin to start chatting'}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}