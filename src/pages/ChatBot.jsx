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

export default function ChatBot() {
  const [me, setMe] = useState(null);
  const [open, setOpen]               = useState(false);
  const [convs, setConvs]             = useState([]);
  const [active, setActive]           = useState(null);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [typing, setTyping]           = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const listRef     = useRef(null);
  const typingTimer = useRef(null);
  const activeRef   = useRef(null);
  
  useEffect(() => { activeRef.current = active; }, [active]);

  // 1. Fetch logged-in user details (No localStorage)
  useEffect(() => {
    const fetchMyDetails = async () => {
      try {
        const { data } = await getMe();
        if (data.success) setMe(data.user);
      } catch (err) {
        console.error('Failed to load my details:', err);
      }
    };
    fetchMyDetails();
  }, []);

  const scrollDown = useCallback(() => {
    setTimeout(() => listRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }), 30);
  }, []);

  // 2. Load Users API (Accepts search term)
  const loadUsers = useCallback(async (search = '') => {
    try {
      const { data } = await getChatUsers({ search });
      if (data.success) {
        const list = data.users.map((u) => ({
          peerId: u.userId, 
          peerName: u.username, 
          peerType: u.type,
          photoUrl: u.photoUrl, 
          lastMessage: u.lastMessage, 
          unread: u.unread || 0,
        }));
        setConvs(list);
        setUnreadTotal(list.reduce((s, c) => s + (c.unread || 0), 0));
      }
    } catch (err) { 
      console.error(err); 
    }
  }, []);

  // 3. Socket Integration
  const socketRef = useChatSocket({
    onMessage: (msg) => {
      if (!me) return;
      const myId = Number(me.userId), myType = me.type;
      const isMine = Number(msg.sender_id) === myId && msg.sender_type === myType;
      const peerId = isMine ? Number(msg.receiver_id) : Number(msg.sender_id);
      const peerType = isMine ? msg.receiver_type : msg.sender_type;
      const isActive = activeRef.current
        && Number(activeRef.current.peerId) === peerId
        && activeRef.current.peerType === peerType;

      // If chat is open with this person, append message and mark read
      if (isActive) {
        setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        scrollDown();
        socketRef.current?.emit('message_read', { peerId });
      }

      // Update sidebar conversation list
      setConvs((prev) => {
        const next = prev.map((c) =>
          Number(c.peerId) === peerId && c.peerType === peerType
            ? { ...c, lastMessage: msg, unread: (isActive || isMine) ? c.unread : c.unread + 1 }
            : c
        );
        next.sort((a, b) => new Date(b.lastMessage?.created_at || 0) - new Date(a.lastMessage?.created_at || 0));
        setUnreadTotal(next.reduce((s, c) => s + (c.unread || 0), 0));
        return next;
      });
    },
    onTyping: (t) => {
      if (activeRef.current && Number(t.fromId) === Number(activeRef.current.peerId)) {
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
          Number(m.receiver_id) === Number(r.byId) && m.receiver_type === r.byType
            && Number(m.sender_id) === Number(me.userId) && m.sender_type === me.type
            ? { ...m, is_read: 1 } : m
        )
      );
    },
  });

  // 4. Debounced Search Effect (Runs on mount and when searchQuery changes)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, loadUsers]);

  // 5. Open Conversation
  const openConversation = useCallback((peer) => {
    setActive({ ...peer, unread: 0 });
    setSearchQuery(''); // Clear search when opening a chat
  }, []);

  // 6. Load Messages when conversation changes
  useEffect(() => {
    if (!active) return;
    
    setMessages([]); // Clear previous messages

    (async () => {
      try {
        const { data } = await getChatMessages(active.peerId, { limit: 100 });
        if (data.success) {
          setMessages(data.messages || []);
          scrollDown();
          socketRef.current?.emit('message_read', { peerId: active.peerId });
          loadUsers(searchQuery); // refresh list to clear unread badge
        }
      } catch (err) { 
        console.error(err); 
      }
    })();
  }, [active, scrollDown, loadUsers, socketRef, searchQuery]);

  // 7. Send Message
  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !active || !me) return;
    
    setInput('');
    const socket = socketRef.current;
    
    if (socket?.connected) {
      socket.emit('send_message', { peerId: active.peerId, message: text });
      socket.emit('typing', { peerId: active.peerId, isTyping: false });
      return;
    }
    
    // Fallback to REST API if socket fails
    try {
      const { data } = await postChatMessage(active.peerId, text);
      if (data.success) setMessages((prev) => [...prev, data.data]);
    } catch (err) { 
      console.error(err); 
    }
  };

  // 8. Handle Typing
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

  const time = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-[60] h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-105 transition"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-[10px] font-black flex items-center justify-center ring-2 ring-white">
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[60] w-[720px] h-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex overflow-hidden">
          
          {/* Sidebar */}
          <aside className="w-64 shrink-0 border-r border-slate-200 flex flex-col bg-white">
            
            {/* User Profile Header */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2.5">
              <Avatar name={me?.username || ''} photoUrl={me?.photoUrl} />
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">
                  {me?.username || 'Loading...'}
                </p>
                <p className="text-[10px] text-slate-500 capitalize">{me?.type || '...'}</p>
              </div>
            </div>

            {/* Search Input */}
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

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {convs.map((c) => {
                const isActive = active?.peerId === c.peerId && active?.peerType === c.peerType;
                return (
                  <button
                    key={`${c.peerType}:${c.peerId}`}
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

          {/* Chat Panel */}
          <section className="flex-1 flex flex-col min-w-0 bg-[#F0F2F5]">
            {active ? (
              <>
                {/* Active Chat Header */}
                <header className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={active.peerName} photoUrl={active.photoUrl} size="lg" />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">{active.peerName}</p>
                      <p className="text-[10px] text-slate-500">
                        {typing ? 'typing…' : active.peerType}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100">
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                </header>

                {/* Messages Area */}
                <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
                  {messages.map((m) => {
                    const mine =
                      me?.userId != null &&
                      Number(m.sender_id) === Number(me.userId) &&
                      m.sender_type === me.type;

                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-3 py-2 text-[12px] shadow-sm ${
                          mine
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl rounded-br-md'
                            : 'bg-white text-slate-800 rounded-2xl rounded-bl-md'
                        }`}>
                          <p className="whitespace-pre-wrap break-words">{m.message}</p>
                          <p className={`text-[9px] mt-0.5 text-right ${mine ? 'text-blue-100' : 'text-slate-400'}`}>
                            {time(m.created_at)} {mine && m.is_read && '✓✓'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input Area */}
                <form onSubmit={send} className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
                  <input
                    value={input}
                    onChange={handleChange}
                    placeholder="Type a message…"
                    className="flex-1 px-4 py-2 text-xs bg-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="submit"
                    className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white flex items-center justify-center shadow-md"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            ) : (
              /* Empty State */
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
      )}
    </>
  );
}