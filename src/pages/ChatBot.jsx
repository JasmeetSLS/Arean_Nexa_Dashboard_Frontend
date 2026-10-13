import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import {
  getMe,
  getConversations,
  createConversation,
  getMessages,
} from '../service/api';
import useChatSocket from '../hooks/useChatSocket';

export default function ChatBot() {
  const [open, setOpen]               = useState(false);
  const [me, setMe]                   = useState(null);
  const [convs, setConvs]             = useState([]);
  const [active, setActive]           = useState(null);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [typing, setTyping]           = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const listRef     = useRef(null);
  const typingTimer = useRef(null);

  // ---------- helpers ----------
  const scrollDown = useCallback(() => {
    setTimeout(() => {
      listRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' });
    }, 30);
  }, []);

  const refreshConvs = useCallback(async () => {
    try {
      const { data } = await getConversations();
      const list = data.conversations || [];
      setConvs(list);
      setUnreadTotal(list.reduce((s, c) => s + (c.unread || 0), 0));
    } catch (err) {
      console.error('[ChatBot refreshConvs]', err);
    }
  }, []);

  // ---------- socket ----------
  const socketRef = useChatSocket({
    onMessage: (msg) => {
      if (
        active &&
        ((msg.sender_type === me?.type && msg.receiver_id === active.peerId) ||
         (msg.receiver_type === me?.type && msg.sender_id === active.peerId))
      ) {
        setMessages((prev) => [...prev, msg]);
        scrollDown();
        socketRef.current?.emit('message_read', { peerId: active.peerId });
      }
      refreshConvs();
    },
    onTyping: (t) => {
      if (t.fromId === active?.peerId) {
        setTyping(t.isTyping);
        if (t.isTyping) {
          clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setTyping(false), 3000);
        }
      }
    },
    onRead: () => {},
  });

  // ---------- init ----------
  useEffect(() => {
    (async () => {
      try {
        const { data: meRes } = await getMe();
        setMe(meRes.user);
        await refreshConvs();
      } catch (err) {
        console.error('[ChatBot init]', err);
      }
    })();
  }, [refreshConvs]);

  // ---------- open conversation ----------
  const openConversation = useCallback(async (peer) => {
    try {
      const { data } = await createConversation(peer.peerId ?? peer.id);
      const conv = data.conversation;

      setActive({
        id:          conv.id,
        peerId:      conv.peerId,
        peerType:    conv.peerType,
        peerName:    conv.peerName,
        photoUrl:    peer.photoUrl    || null,
        lastMessage: peer.lastMessage || null,
        unread:      peer.unread      || 0,
      });
    } catch (err) {
      console.error('[ChatBot openConversation]', err);
    }
  }, []);

  // ---------- load messages on active change ----------
  useEffect(() => {
    if (!active || !me) return;
    (async () => {
      try {
        const { data } = await getMessages(active.peerId, { limit: 100 });
        setMessages(data.messages || []);
        scrollDown();
        socketRef.current?.emit('message_read', { peerId: active.peerId });
        refreshConvs();
      } catch (err) {
        console.error('[ChatBot loadMessages]', err);
      }
    })();
  }, [active, me, scrollDown, refreshConvs, socketRef]);

  // ---------- send ----------
  const send = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !active || !me || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      peerId:  active.peerId,
      message: text,
    });
    socketRef.current.emit('typing', { peerId: active.peerId, isTyping: false });
    setInput('');
  };

  const handleChange = (e) => {
    setInput(e.target.value);
    if (!active || !socketRef.current) return;
    socketRef.current.emit('typing', { peerId: active.peerId, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('typing', { peerId: active.peerId, isTyping: false });
    }, 1200);
  };

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

      {/* ---------- Popup panel with sidebar + chat ---------- */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[60] w-[720px] h-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex overflow-hidden">

          {/* ============ LEFT SIDEBAR ============ */}
          <aside className="w-64 shrink-0 border-r border-slate-200 flex flex-col bg-white">
            {/* Sidebar header */}
            <div className="shrink-0 px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-black text-slate-900">
                {me?.type === 'admin' ? 'Trainers' : 'Admins'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {me?.username} · {me?.type}
              </p>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {convs.map((c) => (
                <button
                  key={c.peerId}
                  onClick={() => openConversation(c)}
                  className={`w-full text-left px-3 py-2.5 border-b border-slate-50 hover:bg-blue-50/60 transition ${
                    active?.peerId === c.peerId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                      {c.peerName.slice(0, 2).toUpperCase()}
                    </div>
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
                {/* Chat header */}
                <header className="shrink-0 px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">
                      {active.peerName}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {typing ? 'typing…' : active.peerType}
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-md hover:bg-slate-100"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                </header>

                {/* Messages */}
                <div
                  ref={listRef}
                  className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-[#F7F8FC]"
                >
                  {messages.map((m) => {
                    const mine =
                      m.sender_type === me?.type && m.sender_id === me?.userId;
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

                {/* Input */}
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
              /* empty state */
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