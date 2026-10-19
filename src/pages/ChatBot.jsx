import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import {
  getChatUsers,
  getChatMessages,
  postChatMessage,
} from '../service/api';
import useChatSocket from '../hooks/useChatSocket';
import { useAuth } from '../service/auth';

export default function ChatBot() {
  const { user: me } = useAuth();

  const [open, setOpen]               = useState(false);
  const [convs, setConvs]             = useState([]);
  const [active, setActive]           = useState(null);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [typing, setTyping]           = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const listRef     = useRef(null);
  const typingTimer = useRef(null);
  const activeRef   = useRef(null);

  useEffect(() => { activeRef.current = active; }, [active]);

  // ---------- helpers ----------
  const scrollDown = useCallback(() => {
    setTimeout(() => {
      listRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' });
    }, 30);
  }, []);

  const loadUsers = useCallback(async () => {
    // 1. instant paint from cache
    try {
      const cached = JSON.parse(localStorage.getItem('chat:users') || '[]');
      const list = cached.map((u) => ({
        peerId:      u.userId,
        peerName:    u.username,
        peerType:    u.type,
        photoUrl:    u.photoUrl,
        lastMessage: u.lastMessage,
        unread:      u.unread || 0,
      }));
      setConvs(list);
      setUnreadTotal(list.reduce((s, c) => s + (c.unread || 0), 0));
    } catch { /* ignore */ }

    // 2. sync from API
    try {
      const { data } = await getChatUsers();
      if (data.success) {
        localStorage.setItem('chat:users', JSON.stringify(data.users));
        const list = data.users.map((u) => ({
          peerId:      u.userId,
          peerName:    u.username,
          peerType:    u.type,
          photoUrl:    u.photoUrl,
          lastMessage: u.lastMessage,
          unread:      u.unread || 0,
        }));
        setConvs(list);
        setUnreadTotal(list.reduce((s, c) => s + (c.unread || 0), 0));
      }
    } catch (err) {
      console.error('[ChatBot loadUsers]', err);
    }
  }, []);

  // ---------- socket ----------
  const socketRef = useChatSocket({
    onMessage: (msg) => {
      const myId     = Number(me?.userId);
      const myType   = me?.type;
      const isMine   =
        Number(msg.sender_id) === myId && msg.sender_type === myType;

      const peerId   = isMine ? Number(msg.receiver_id) : Number(msg.sender_id);
      const peerType = isMine ? msg.receiver_type         : msg.sender_type;

      const isActive =
        activeRef.current &&
        Number(activeRef.current.peerId) === peerId &&
        activeRef.current.peerType      === peerType;

      if (isActive) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const next = [...prev, msg];
          localStorage.setItem(`chat:msgs:${peerId}`, JSON.stringify(next));
          return next;
        });
        scrollDown();
        socketRef.current?.emit('message_read', { peerId });
      }

      setConvs((prev) => {
        const next = prev.map((c) => {
          const sameConv =
            Number(c.peerId) === peerId && c.peerType === peerType;
          if (!sameConv) return c;
          return {
            ...c,
            lastMessage: msg,
            unread: c.unread + (isActive ? 0 : 1),
          };
        });
        next.sort(
          (a, b) =>
            new Date(b.lastMessage?.created_at || 0) -
            new Date(a.lastMessage?.created_at || 0)
        );
        setUnreadTotal(next.reduce((s, c) => s + (c.unread || 0), 0));

        const cache = next.map((c) => ({
          userId:      c.peerId,
          username:    c.peerName,
          type:        c.peerType,
          photoUrl:    c.photoUrl,
          lastMessage: c.lastMessage,
          unread:      c.unread,
        }));
        localStorage.setItem('chat:users', JSON.stringify(cache));
        return next;
      });
    },

    onTyping: (t) => {
      if (
        activeRef.current &&
        Number(t.fromId) === Number(activeRef.current.peerId)
      ) {
        setTyping(t.isTyping);
        if (t.isTyping) {
          clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setTyping(false), 3000);
        }
      }
    },

    onRead: (r) => {
      setMessages((prev) =>
        prev.map((m) =>
          Number(m.receiver_id) === Number(r.byId) &&
          m.receiver_type === r.byType &&
          Number(m.sender_id) === Number(me?.userId) &&
          m.sender_type === me?.type
            ? { ...m, is_read: 1 }
            : m
        )
      );
    },
  });

  // ---------- init ----------
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ---------- open conversation ----------
  const openConversation = useCallback((peer) => {
    setActive({
      peerId:      peer.peerId,
      peerType:    peer.peerType,
      peerName:    peer.peerName,
      photoUrl:    peer.photoUrl    || null,
      lastMessage: peer.lastMessage || null,
      unread:      0,
    });
  }, []);

  // ---------- load messages on active change ----------
  useEffect(() => {
    if (!active) return;

    // instant paint from cache
    try {
      const cached = JSON.parse(localStorage.getItem(`chat:msgs:${active.peerId}`) || '[]');
      setMessages(cached);
      scrollDown();
    } catch { setMessages([]); }

    // sync from API
    (async () => {
      try {
        const { data } = await getChatMessages(active.peerId, { limit: 100 });
        if (data.success) {
          setMessages(data.messages || []);
          localStorage.setItem(
            `chat:msgs:${active.peerId}`,
            JSON.stringify(data.messages || [])
          );
          scrollDown();
          socketRef.current?.emit('message_read', { peerId: active.peerId });
          loadUsers();
        }
      } catch (err) {
        console.error('[ChatBot loadMessages]', err);
      }
    })();
  }, [active, scrollDown, loadUsers, socketRef]);

  // ---------- send ----------
  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !active || !me) return;
    setInput('');

    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('send_message', { peerId: active.peerId, message: text }, (ack) => {
        if (!ack?.ok) console.error('[send_message]', ack?.error);
      });
      socket.emit('typing', { peerId: active.peerId, isTyping: false });
      return;
    }

    // HTTP fallback
    try {
      const { data } = await postChatMessage(active.peerId, text);
      if (data.success) {
        const msg = data.data;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const next = [...prev, msg];
          localStorage.setItem(`chat:msgs:${active.peerId}`, JSON.stringify(next));
          return next;
        });
      }
    } catch (err) {
      console.error('[ChatBot send fallback]', err);
    }
  };

  const handleChange = (e) => {
    setInput(e.target.value);
    const socket = socketRef.current;
    if (!active || !socket) return;
    socket.emit('typing', { peerId: active.peerId, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typing', { peerId: active.peerId, isTyping: false });
    }, 1200);
  };

  // ====================================================================
  // UI
  // ====================================================================
  return (
    <>
      {/* ---------- Floating button ---------- */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-[60] h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center justify-center transition"
        aria-label="Chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}

        {!open && unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-[10px] font-black flex items-center justify-center">
            {unreadTotal}
          </span>
        )}
      </button>

      {/* ---------- Popup panel ---------- */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[60] w-[720px] h-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex overflow-hidden">

          {/* ============ LEFT SIDEBAR ============ */}
          <aside className="w-64 shrink-0 border-r border-slate-200 flex flex-col bg-white">
            <div className="shrink-0 px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-black text-slate-900">
                {me?.username}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {convs.map((c) => (
                <button
                  key={`${c.peerType}:${c.peerId}`}
                  onClick={() => openConversation(c)}
                  className={`w-full text-left px-3 py-2.5 border-b border-slate-50 hover:bg-blue-50/60 transition ${
                    active?.peerId === c.peerId && active?.peerType === c.peerType
                      ? 'bg-blue-50'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* === Avatar with photo from API === */}
                    {c.photoUrl ? (
                      <img
                        src={`${import.meta.env.VITE_IMAGE_BASE_URL}${c.photoUrl}`}
                        alt={c.peerName}
                        className="h-8 w-8 rounded-full object-cover shrink-0 bg-slate-100"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        {c.peerName.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {c.peerName}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {c.lastMessage?.message || 'No messages yet'}
                      </p>
                    </div>

                    {c.unread > 0 && (
                      <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </button>
              ))}

              {convs.length === 0 && (
                <p className="px-3 py-6 text-[11px] italic text-slate-400 text-center">
                  No conversations
                </p>
              )}
            </div>
          </aside>

          {/* ============ RIGHT CHAT PANEL ============ */}
          <section className="flex-1 flex flex-col min-w-0">
            {active ? (
              <>
                <header className="shrink-0 px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
                  <div className="min-w-0 flex items-center gap-2.5">
                    {/* === Header avatar with photo === */}
                    {active.photoUrl ? (
                      <img
                        src={`${import.meta.env.VITE_API_BASE_URL}${active.photoUrl}`}
                        alt={active.peerName}
                        className="h-9 w-9 rounded-full object-cover shrink-0 bg-slate-100"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                        {active.peerName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">
                        {active.peerName}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {typing ? 'typing…' : active.peerType}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-md hover:bg-slate-100"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                </header>

                <div
                  ref={listRef}
                  className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-[#F7F8FC]"
                >
                  {messages.map((m) => {
                    // ✅ FIX: message is "mine" only if BOTH id AND type match
                    const mine =
                      me?.userId != null &&
                      Number(m.sender_id) === Number(me.userId) &&
                      m.sender_type === me.type;

                    return (
                      <div
                        key={m.id}
                        className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-3 py-2 rounded-2xl text-[11px] font-medium shadow-sm ${
                            mine
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                          }`}
                        >
                          {m.message}
                          <div
                            className={`text-[9px] mt-1 ${
                              mine ? 'text-blue-100' : 'text-slate-400'
                            }`}
                          >
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {mine && m.is_read && <span className="ml-1">✓✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form
                  onSubmit={send}
                  className="shrink-0 flex items-center gap-2 px-3 py-2 border-t border-slate-200 bg-white"
                >
                  <input
                    value={input}
                    onChange={handleChange}
                    placeholder="Type a message…"
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="submit"
                    className="h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center px-6">
                <div>
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    Select a conversation
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {me?.type === 'admin'
                      ? 'Pick a trainer to start chatting'
                      : 'Pick an admin to start chatting'}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}