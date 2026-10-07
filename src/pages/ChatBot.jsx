import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, MessageSquare, X, Loader2, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../hooks/useChatSocket';
import {
  getChatbotMe,
  getChatSummary,
  getAllAdmins,
  getAllTrainers,
  getChatMessages,
  markChatRead,
} from '../service/api';

const FALLBACK = '/trainers/1.jpeg';

export default function ChatBot({ embedded = false }) {
  const [params] = useSearchParams();

  const token =
    params.get('token') ||
    (typeof window !== 'undefined' ? localStorage.getItem('token') : '');

  const [open, setOpen]     = useState(false);
  const [me, setMe]         = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError]   = useState('');

  const [trainers, setTrainers]           = useState([]);
  const [searchTrainer, setSearchTrainer] = useState('');
  const [activeTrainer, setActiveTrainer] = useState(null);
  const [admins, setAdmins]               = useState([]);

  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [typing, setTyping]     = useState(false);

  const bottomRef        = useRef(null);
  const activeTrainerRef = useRef(null);

  const { connected, emit, on, off } = useSocket({ token, autoConnect: !!token });

  useEffect(() => { activeTrainerRef.current = activeTrainer; }, [activeTrainer]);

  // 1. Lazy init
  useEffect(() => {
    if (!open || status !== 'idle') return;
    if (!token) {
      setStatus('error');
      setError('Missing token');
      return;
    }
    setStatus('loading');
    (async () => {
      try {
        const { data } = await getChatbotMe();
        if (!data.success) throw new Error(data.error || 'Auth failed');
        setMe(data.user);
        setStatus('ready');
      } catch (err) {
        setStatus('error');
        setError(err.response?.data?.error || err.message || 'Unauthorized');
      }
    })();
  }, [open, status, token]);

  // 2. Load list + active thread
  useEffect(() => {
    if (status !== 'ready' || !me) return;

    if (me.type === 'trainer') {
      setActiveTrainer({ id: me.id, name: me.name, photoUrl: me.photoUrl });
      getAllAdmins()
        .then((r) => setAdmins(r.data.admins || []))
        .catch(() => {});
      return;
    }

    (async () => {
      try {
        const { data } = await getChatSummary();
        let list = data.trainers || [];
        if (!list.length) {
          const alt = await getAllTrainers();
          list = alt.data.trainers || [];
        }
        setTrainers(list);

        const preId = params.get('trainerId');
        const picked = preId
          ? list.find((t) => String(t.id) === String(preId))
          : list[0];
        if (picked) setActiveTrainer(picked);
      } catch {
        try {
          const alt = await getAllTrainers();
          setTrainers(alt.data.trainers || []);
        } catch { /* ignore */ }
      }
    })();
  }, [status, me, params]);

  // 3. Join/leave room
  useEffect(() => {
    if (!connected || !activeTrainer) return;
    emit('chat:join', { trainerId: activeTrainer.id });
    emit('chat:read', { trainerId: activeTrainer.id });
    return () => {
      emit('chat:leave', { trainerId: activeTrainer.id });
    };
  }, [connected, activeTrainer?.id, emit]);

  // 4. Load history
  useEffect(() => {
    if (!activeTrainer) return;
    let alive = true;
    getChatMessages(activeTrainer.id)
      .then(({ data }) => {
        if (alive) setMessages(data.messages || []);
      })
      .catch(() => {});
    markChatRead(activeTrainer.id).catch(() => {});
    return () => { alive = false; };
  }, [activeTrainer?.id]);

  // 5. Live events
  useEffect(() => {
    if (!connected || !me) return;

    const onNew = (msg) => {
      const tid = msg.senderType === 'trainer' ? msg.senderId : msg.receiverId;

      if (me.type === 'admin') {
        setTrainers((prev) =>
          prev.map((t) =>
            t.id === tid
              ? {
                  ...t,
                  preview: msg.message,
                  lastAt:  msg.createdAt,
                  lastFrom: msg.senderType,
                  unread:
                    t.id === activeTrainerRef.current?.id || msg.senderType === 'admin'
                      ? 0
                      : (t.unread || 0) + 1,
                }
              : t
          )
        );
      }

      if (activeTrainerRef.current?.id === tid) {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
        );
        if (me.type === 'admin' && msg.senderType === 'trainer') {
          emit('chat:read', { trainerId: tid });
        }
      }
    };

    const onTyping = ({ trainerId, from, isTyping }) => {
      if (activeTrainerRef.current?.id !== trainerId) return;
      if (from === me.type) return;
      setTyping(isTyping);
    };

    const onUnread = ({ trainerId, unread }) => {
      setTrainers((prev) =>
        prev.map((t) => (t.id === trainerId ? { ...t, unread } : t))
      );
    };

    on('chat:new', onNew);
    on('chat:typing', onTyping);
    on('chat:unread', onUnread);

    return () => {
      off('chat:new');
      off('chat:typing');
      off('chat:unread');
    };
  }, [connected, me, emit, on, off]);

  // 6. Auto-scroll
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, open, activeTrainer?.id]);

  const send = () => {
    const text = input.trim();
    if (!text || !activeTrainer) return;
    emit('chat:send', { trainerId: activeTrainer.id, message: text }, (resp) => {
      if (!resp?.ok) console.error(resp?.error);
    });
    setInput('');
    emit('chat:typing', { trainerId: activeTrainer.id, isTyping: false });
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const onInputChange = (e) => {
    setInput(e.target.value);
    if (!activeTrainer) return;
    emit('chat:typing', { trainerId: activeTrainer.id, isTyping: true });
    clearTimeout(onInputChange._t);
    onInputChange._t = setTimeout(
      () => emit('chat:typing', { trainerId: activeTrainer.id, isTyping: false }),
      1200
    );
  };

  const filteredTrainers = useMemo(() => {
    const q = searchTrainer.trim().toLowerCase();
    if (!q) return trainers;
    return trainers.filter((t) => t.name.toLowerCase().includes(q));
  }, [trainers, searchTrainer]);

  const totalUnread = useMemo(
    () => trainers.reduce((n, t) => n + (t.unread || 0), 0),
    [trainers]
  );

  const sidebar = me?.type === 'admin' ? (
    <div className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col">
      <div className="px-3 py-2 border-b border-gray-100">
        <p className="text-[10px] font-black text-indigo-900 uppercase tracking-wider mb-1.5">
          Trainers ({trainers.length})
        </p>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
          <input
            value={searchTrainer}
            onChange={(e) => setSearchTrainer(e.target.value)}
            placeholder="Search…"
            className="w-full pl-7 pr-2 py-1 text-[11px] border border-gray-200 rounded
                       focus:outline-none focus:ring-1 focus:ring-purple-400"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredTrainers.map((t) => {
          const isActive = activeTrainer?.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTrainer(t)}
              className={`w-full flex items-center gap-2 px-3 py-2 border-b border-gray-50 text-left transition ${
                isActive ? 'bg-purple-50' : 'hover:bg-gray-50'
              }`}
            >
              <img
                src={t.photoUrl || FALLBACK}
                onError={(e) => (e.target.src = FALLBACK)}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100 shrink-0"
                alt=""
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-gray-800 truncate">
                    {t.name}
                  </span>
                  {t.unread > 0 && (
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {t.unread}
                    </span>
                  )}
                </div>
                {t.preview && (
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">
                    {t.lastFrom === 'admin' ? 'You: ' : ''}
                    {t.preview}
                  </p>
                )}
              </div>
            </button>
          );
        })}
        {filteredTrainers.length === 0 && (
          <div className="p-4 text-center text-[11px] text-gray-400">
            No trainers found
          </div>
        )}
      </div>
    </div>
  ) : null;

  const header = (
    <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-700 to-indigo-800 text-white">
      <MessageSquare className="h-4 w-4" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate">
          {me?.type === 'admin'
            ? `Chat · ${activeTrainer?.name || 'Select a trainer'}`
            : `Support${admins.length ? ` · ${admins.length} admin${admins.length > 1 ? 's' : ''}` : ''}`}
        </p>
        <p className="text-[10px] text-purple-200 font-medium">
          {typing ? 'typing…' : connected ? 'Live chat' : 'Connecting…'}
        </p>
      </div>
      {me?.type === 'admin' && activeTrainer?.photoUrl && (
        <img
          src={activeTrainer.photoUrl}
          onError={(e) => (e.target.src = FALLBACK)}
          className="w-7 h-7 rounded-full object-cover ring-2 ring-white/30"
          alt=""
        />
      )}
      <button
        onClick={() => setOpen(false)}
        className="text-white/70 hover:text-white transition"
        title="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  const renderBody = () => {
    if (status === 'loading') {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
        </div>
      );
    }
    if (status === 'error') {
      return (
        <div className="flex-1 flex items-center justify-center px-4 text-center">
          <p className="text-xs font-bold text-red-600">{error}</p>
        </div>
      );
    }
    if (me?.type === 'admin' && !activeTrainer) {
      return (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
          Select a trainer to start chatting
        </div>
      );
    }
    return (
      <>
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50">
          {messages.map((m) => {
            const mine = m.senderType === me?.type;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-lg text-xs shadow-sm ${
                    mine
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.message}</p>
                  <p className={`text-[10px] mt-1 ${mine ? 'text-purple-200' : 'text-gray-400'}`}>
                    {new Date(m.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 px-3 py-1.5 rounded-lg text-[11px] text-gray-400 italic">
                typing…
              </div>
            </div>
          )}
          {messages.length === 0 && !typing && (
            <div className="text-center text-[11px] text-gray-400 py-6">
              No messages yet. Say hi 👋
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 flex items-end gap-2 px-3 py-2 bg-white border-t border-gray-200">
          <textarea
            rows={1}
            value={input}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            placeholder="Type a message… (Enter to send)"
            className="flex-1 resize-none px-3 py-2 text-xs border border-gray-300 rounded-md
                       focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400
                       max-h-24"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="flex items-center gap-1 px-3 py-2 rounded-md bg-purple-600 text-white text-xs font-bold
                       hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </>
    );
  };

  // FULL PAGE MODE
  if (!embedded) {
    return (
      <div className="h-screen w-screen flex bg-white">
        {sidebar}
        <div className="flex-1 flex flex-col min-w-0">
          {header}
          {renderBody()}
        </div>
      </div>
    );
  }

  // EMBEDDED WIDGET MODE
  const popupWidth = me?.type === 'admin' ? 'w-[820px]' : 'w-96';

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center
                     h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700
                     text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          title="Open live chat"
        >
          <MessageSquare className="h-6 w-6" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center
                             rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
              {totalUnread}
            </span>
          )}
        </button>
      )}

      {open && (
        <div
          className={`fixed bottom-6 right-6 z-50 ${popupWidth} max-w-[calc(100vw-2rem)]
                      h-[600px] max-h-[calc(100vh-3rem)] bg-white rounded-xl
                      shadow-2xl border border-gray-200 overflow-hidden flex`}
        >
          {sidebar}
          <div className="flex-1 flex flex-col min-w-0">
            {header}
            {renderBody()}
          </div>
        </div>
      )}
    </>
  );
}