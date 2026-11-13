import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MessageCircle, X, Send, Search } from 'lucide-react';
import { getChatUsers, getChatMessages, postChatMessage, getMe } from '../service/api';
import useChatSocket from '../hooks/useChatSocket';

function Avatar({ name = '', photoUrl, size = 'sm' }) {
  const dim = size === 'lg' ? 'h-10 w-10 text-[12px]' : 'h-8 w-8 text-[10px]';
  if (photoUrl) {
    return (
      <img
        src={`${import.meta.env.VITE_IMAGE_BASE_URL || ''}${photoUrl}`}
        alt={name}
        className={`${dim} rounded-full object-cover shrink-0 bg-slate-200`}
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black flex items-center justify-center shrink-0`}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function ChatBot({ fullScreen = false }) {
  const [me, setMe]                   = useState(null);
  const [open, setOpen]               = useState(false);
  const [convs, setConvs]             = useState([]);
  const [active, setActive]           = useState(null);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [typing, setTyping]           = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const listRef     = useRef(null);
  const typingTimer = useRef(null);
  const activeRef   = useRef(null);

  useEffect(() => { activeRef.current = active; }, [active]);

  /* 1. Automatically calculate total unread */
  useEffect(() => {
    setUnreadTotal(convs.reduce((sum, c) => sum + (c.unread || 0), 0));
  }, [convs]);

  /* 2. Fetch my details */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMe();
        if (data.success) setMe(data.user);
      } catch (err) { console.error('Failed to load my details:', err); }
    })();
  }, []);

  const scrollDown = useCallback(() => {
    setTimeout(() => listRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }), 30);
  }, []);

  /* 3. Fetch users */
  const loadUsers = useCallback(async (search = '') => {
    try {
      const { data } = await getChatUsers({ search });
      if (data.success) {
        const list = data.users.map((u) => ({
          peerUsername: u.peerUsername,
          peerName:     u.peerName,
          peerType:     u.type,
          photoUrl:     u.photoUrl,
          lastMessage:  u.lastMessage,
          unread:       u.unread || 0,
        }));
        setConvs(list);
      }
    } catch (err) { console.error(err); }
  }, []);

  /* 4. Socket Integration */
  const socketRef = useChatSocket({
    onMessage: (msg) => {
      if (!me) return;
      const isMine = msg.sender_username === me.username && msg.sender_type === me.type;

      const peerUsername = isMine ? msg.receiver_username : msg.sender_username;
      const peerType     = isMine ? msg.receiver_type    : msg.sender_type;

      const isChatOpen = fullScreen || open;
      const isActive = isChatOpen
        && activeRef.current
        && activeRef.current.peerUsername === peerUsername
        && activeRef.current.peerType     === peerType;

      if (isActive) {
        setMessages((prev) => {
          if (isMine) {
            const tempIndex = prev.findIndex(
              m => typeof m.id === 'string' && m.id.startsWith('temp-') && m.message === msg.message
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
        const exists = prev.some(c => c.peerUsername === peerUsername && c.peerType === peerType);
        
        if (!exists && !isMine) {
          loadUsers(searchQuery);
          return prev; 
        }

        const next = prev.map((c) =>
          c.peerUsername === peerUsername && c.peerType === peerType
            ? { ...c, lastMessage: msg, unread: (isActive || isMine) ? c.unread : c.unread + 1 }
            : c
        );
        next.sort((a, b) =>
          new Date(b.lastMessage?.created_at || 0) - new Date(a.lastMessage?.created_at || 0)
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

    // ✅ NEW: Sync unread badges across multiple tabs/windows
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

  /* 5. Debounce search */
  useEffect(() => {
    const t = setTimeout(() => loadUsers(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, loadUsers]);

  /* 6. Open conversation */
  const openConversation = useCallback((peer) => {
    setActive({ ...peer, unread: 0 });
    setSearchQuery('');
    setOpen(true);
    
    setConvs(prev => prev.map(c => 
      c.peerUsername === peer.peerUsername && c.peerType === peer.peerType
        ? { ...c, unread: 0 }
        : c
    ));
  }, []);

  /* 7. Clear typing state when closing window */
  useEffect(() => {
    if (!open && !fullScreen) {
      setTyping(false);
    }
  }, [open, fullScreen]);

  /* 8. Load messages when active changes OR chat window opens */
  useEffect(() => {
    const isChatOpen = fullScreen || open;
    if (!active || !isChatOpen) return;

    setMessages([]);
    (async () => {
      try {
        const { data } = await getChatMessages(active.peerUsername, { limit: 100 });
        if (data.success) {
          setMessages(data.messages || []);
          scrollDown();
          socketRef.current?.emit('message_read', { peerUsername: active.peerUsername });
          loadUsers(searchQuery); 
        }
      } catch (err) { console.error(err); }
    })();
  }, [active, open, fullScreen, scrollDown, loadUsers, socketRef, searchQuery]);

  /* 9. Send Message (Optimistic UI) */
  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !active || !me) return;

    setInput('');
    const tempId = `temp-${Date.now()}`;
    
    const optimisticMsg = {
      id: tempId,
      sender_username: me.username,
      sender_type: me.type,
      receiver_username: active.peerUsername,
      receiver_type: active.peerType,
      message: text,
      is_read: 0,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    scrollDown();

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('send_message', { peerUsername: active.peerUsername, message: text });
      socket.emit('typing',       { peerUsername: active.peerUsername, isTyping: false });
      return;
    }
    
    try {
      const { data } = await postChatMessage(active.peerUsername, text);
      if (data.success) {
        setMessages((prev) => prev.map(m => m.id === tempId ? data.data : m));
      }
    } catch (err) { 
      console.error(err); 
      setMessages((prev) => prev.filter(m => m.id !== tempId));
    }
  };

  /* 10. Typing Indicator */
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

  const time = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  /* ───────────── UI ───────────── */
  const innerContent = (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">
      <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col bg-white max-h-[40vh] md:max-h-full">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2.5">
          <Avatar name={me?.displayName || me?.username || ''} photoUrl={me?.photoUrl} />
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900 truncate">
              {me?.displayName || me?.username || 'Loading...'}
            </p>
            <p className="text-[10px] text-slate-500 capitalize">{me?.type || '...'}</p>
          </div>
        </div>

        <div className="px-3 py-2 border-b border-slate-100">
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-500 transition pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search person..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convs.map((c) => {
            const isActive =
              active?.peerUsername === c.peerUsername && active?.peerType === c.peerType;
            return (
              <button
                key={`${c.peerType}:${c.peerUsername}`}
                onClick={() => openConversation(c)}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 transition border-l-2 ${
                  isActive ? 'bg-blue-50 border-blue-500' : 'border-transparent'
                }`}
              >
                <Avatar name={c.peerName} photoUrl={c.photoUrl} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{c.peerName}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {c.lastMessage?.message || 'No messages yet'}
                  </p>
                </div>
                {c.unread > 0 && (
                  <span className="text-[9px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                    {c.unread}
                  </span>
                )}
              </button>
            );
          })}
          {convs.length === 0 && (
            <p className="px-3 py-6 text-[11px] italic text-slate-400 text-center">
              {searchQuery ? 'No person found' : 'No conversations'}
            </p>
          )}
        </div>
      </aside>

      <section className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#F0F2F5]">
        {active ? (
          <>
            <header className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={active.peerName} photoUrl={active.photoUrl} size="lg" />
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">{active.peerName}</p>
                  <p className="text-[10px] text-slate-500">
                    {typing ? 'typing…' : active.peerType}
                  </p>
                </div>
              </div>
              {!fullScreen && (
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              )}
            </header>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
              {messages.map((m) => {
                const mine =
                  me?.username != null &&
                  m.sender_username === me.username &&
                  m.sender_type     === me.type;

                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-3 py-2 text-[12px] shadow-sm ${
                      mine
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl rounded-br-md'
                        : 'bg-white text-slate-800 rounded-2xl rounded-bl-md'
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{m.message}</p>
                      <p className={`text-[9px] mt-0.5 text-right ${mine ? 'text-blue-100' : 'text-slate-400'}`}>
                        {time(m.created_at)} {mine && (m.is_read ? '✓✓' : '✓')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={send} className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
              <input
                value={input}
                onChange={handleChange}
                placeholder="Type a message…"
                className="flex-1 px-4 py-2 text-xs bg-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 text-white flex items-center justify-center shadow-md transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center px-6">
            <div>
              <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-xs font-bold text-slate-700">Select a conversation</p>
              <p className="text-[10px] text-slate-500 mt-1">
                {me?.type === 'admin' ? 'Pick a trainer to start chatting' : 'Pick an admin to start chatting'}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
        {innerContent}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`chat-toggle-btn fixed bottom-6 right-6 z-[60] h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-105 transition ${open ? 'current' : ''}`}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-[10px] font-black flex items-center justify-center ring-2 ring-white">
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-[60] w-[720px] h-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex overflow-hidden">
          {innerContent}
        </div>
      )}
    </>
  );
}