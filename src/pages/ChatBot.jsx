import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Send, Bot, Wifi, WifiOff, X, MessageSquare,
} from 'lucide-react';
import useChatSocket from '../hooks/useChatSocket';
import { getChatSummary, getChatMessages } from '../service/api';

const FALLBACK_TRAINER_PHOTO = '/trainers/1.jpeg';

export default function ChatBot() {
  const params = new URLSearchParams(window.location.search);

  const rawRole = params.get('role') || 'commandCenter';
  const rawId   = params.get('id')   || '1';
  const role    = rawRole.replace(/^"|"$/g, '');
  const id      = rawId.replace(/^"|"$/g, '');
  const embed   = params.get('embed') === '1';

  const isCommandCenter = role.toLowerCase() === 'commandcenter';
  const isTrainer       = role.toLowerCase() === 'trainer';

  const socketRole = isTrainer ? 'trainer' : 'panel';
  const botName    = isTrainer ? `Trainer ${id}` : 'Command Center';

  const mySenderType    = isTrainer ? 'trainer' : 'command';
  const mySenderId      = isTrainer ? Number(id) : 1;
  const theirSenderType = isTrainer ? 'command' : 'trainer';

  // Active thread
  const [activeTrainerId, setActiveTrainerId] = useState(
    isTrainer ? Number(id) : (Number(id) || 1)
  );

  // UI state
  const [isOpen, setIsOpen]       = useState(false);
  const [messages, setMessages]   = useState([]);
  const [draft, setDraft]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [trainers, setTrainers]   = useState([]);
  const [onlineIds, setOnlineIds] = useState(new Set());
  const [search, setSearch]       = useState('');
  const listRef = useRef(null);

  const { socket, connected } = useChatSocket({
    role: socketRole,
    trainerId: isTrainer ? activeTrainerId : null,
    name: botName,
  });

  // =====================================================================
  // Load trainers for sidebar (command center only)
  // =====================================================================
  useEffect(() => {
    if (!isCommandCenter) return;

    (async () => {
      try {
        const res = await getChatSummary();
        if (res.data?.success) {
          setTrainers(
            (res.data.summary || []).map((s) => ({
              id: s.trainerId,
              name: s.trainerName,
              photoUrl: s.trainerPhoto,
              lastMessage: s.lastMessage,
              unread: s.unread || 0,
            }))
          );
        }
      } catch (err) {
        console.error('Trainers fetch failed:', err);
      }
    })();
  }, [isCommandCenter]);

  // =====================================================================
  // Load messages for active thread
  // =====================================================================
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await getChatMessages(activeTrainerId);
        if (!cancelled && res.data?.success) {
          setMessages(res.data.messages || []);
        }

        if (socket) {
          socket.emit('message:read', {
            trainerId: activeTrainerId,
            readerType: isTrainer ? 'trainer' : 'panel',
          });
        }

        if (isCommandCenter) {
          setTrainers((prev) =>
            prev.map((t) =>
              t.id === activeTrainerId ? { ...t, unread: 0 } : t
            )
          );
        }
      } catch (err) {
        console.error('Chat history fetch failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeTrainerId, isTrainer, isCommandCenter, socket]);

  // =====================================================================
  // Live socket listeners
  // =====================================================================
  useEffect(() => {
    if (!socket) return;

    const onNew = (m) => {
      const threadId = m.senderType === 'trainer' ? m.senderId : m.receiverId;

      // Append if it belongs to the currently open thread (dedupe by id)
      if (threadId === activeTrainerId) {
        setMessages((prev) => {
          if (prev.some((x) => x.id === m.id)) return prev;
          return [...prev, m];
        });

        if (m.senderType === theirSenderType) {
          socket.emit('message:read', {
            trainerId: activeTrainerId,
            readerType: isTrainer ? 'trainer' : 'panel',
          });
        }
      }

      // Sidebar (command center)
      if (isCommandCenter) {
        setTrainers((prev) => {
          const exists = prev.find((t) => t.id === threadId);
          if (!exists) {
            getChatSummary()
              .then((r) => {
                if (r.data?.success) {
                  setTrainers(
                    r.data.summary.map((s) => ({
                      id: s.trainerId,
                      name: s.trainerName,
                      photoUrl: s.trainerPhoto,
                      lastMessage: s.lastMessage,
                      unread: s.unread || 0,
                    }))
                  );
                }
              })
              .catch(() => {});
            return prev;
          }
          const isActive = threadId === activeTrainerId;
          return prev
            .map((t) =>
              t.id === threadId
                ? {
                    ...t,
                    lastMessage: m.message,
                    unread:
                      m.senderType === 'trainer' && !isActive
                        ? (t.unread || 0) + 1
                        : t.unread,
                  }
                : t
            )
            .sort((a, b) => (b.unread || 0) - (a.unread || 0));
        });
      }
    };

    const onOnline = ({ trainerId, online }) => {
      setOnlineIds((prev) => {
        const next = new Set(prev);
        online ? next.add(trainerId) : next.delete(trainerId);
        return next;
      });
    };

    const onOnlineList = (ids) => setOnlineIds(new Set(ids));

    socket.on('message:new', onNew);
    socket.on('trainer:online', onOnline);
    socket.on('trainer:onlineList', onOnlineList);

    return () => {
      socket.off('message:new', onNew);
      socket.off('trainer:online', onOnline);
      socket.off('trainer:onlineList', onOnlineList);
    };
  }, [socket, activeTrainerId, isCommandCenter, isTrainer, theirSenderType]);

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // =====================================================================
  // Send — optimistic UI (append on ack so it shows even when receiver is offline)
  // =====================================================================
  const handleSend = () => {
    const text = draft.trim();
    if (!text || !socket) return;

    const receiverType = isTrainer ? 'command' : 'trainer';
    const receiverId   = isTrainer ? 1          : activeTrainerId;

    socket.emit(
      'message:send',
      {
        senderType:   mySenderType,
        senderId:     mySenderId,
        senderName:   botName,
        receiverType,
        receiverId,
        message:      text,
      },
      (ack) => {
        if (ack?.ok && ack.payload) {
          // Append immediately from the ack — guarantees the sender
          // sees their message regardless of receiver's online status
          setMessages((prev) => {
            if (prev.some((m) => m.id === ack.payload.id)) return prev;
            return [...prev, ack.payload];
          });
          setDraft('');
        } else {
          console.warn('send failed:', ack?.error);
        }
      }
    );
  };

  // Derived
  const filteredTrainers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trainers;
    return trainers.filter(
      (t) => t.name?.toLowerCase().includes(q) || String(t.id).includes(q)
    );
  }, [trainers, search]);

  const totalUnread = useMemo(
    () => trainers.reduce((sum, t) => sum + (t.unread || 0), 0),
    [trainers]
  );

  // =====================================================================
  // EMBED MODE
  // =====================================================================
  if (embed) {
    return (
      <div className="h-screen flex flex-col bg-white font-sans">
        <div className="flex-1 flex min-h-0">
          {isCommandCenter && (
            <aside className="w-72 border-r border-gray-200 flex flex-col bg-gray-50 shrink-0">
              <div className="p-2 border-b border-gray-200 bg-white">
                <input
                  type="text"
                  placeholder="Search trainer…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredTrainers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTrainerId(t.id)}
                    className={`w-full text-left px-3 py-2 border-b border-gray-100 ${
                      t.id === activeTrainerId ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={t.photoUrl || FALLBACK_TRAINER_PHOTO}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover"
                        onError={(e) => { e.target.src = FALLBACK_TRAINER_PHOTO; }}
                      />
                      <span className="text-xs font-bold truncate flex-1">{t.name}</span>
                      {t.unread > 0 && (
                        <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 rounded-full">
                          {t.unread}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          )}
          <section className="flex-1 flex flex-col min-w-0">
            <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
              {messages.map((m) => {
                const mine = m.senderType === mySenderType && m.senderId === mySenderId;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                      mine ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200'
                    }`}>
                      {m.message}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-gray-200 p-2 flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-full"
              />
              <button
                onClick={handleSend}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-purple-600 text-white"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // =====================================================================
  // NORMAL MODE — floating bubble + popup
  // =====================================================================
  return (
    <div className="h-screen w-screen bg-transparent pointer-events-none">
      {isOpen && (
        <div
          className="pointer-events-auto fixed z-[70] bg-white shadow-2xl border border-gray-200 rounded-2xl overflow-hidden flex flex-col
                     right-6 bottom-24
                     w-[420px] h-[560px]
                     max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)]"
        >
          {/* Header */}
          <div className="shrink-0 bg-gradient-to-r from-purple-700 to-indigo-800 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-white uppercase tracking-wide">
                  {isCommandCenter ? 'Command Center Chat' : `Chat · ${botName}`}
                </p>
                <p className="text-[11px] text-purple-200 font-medium">
                  {isCommandCenter ? `Talking to trainer ${activeTrainerId}` : `role=${role}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 text-[11px] font-bold ${
                connected ? 'text-emerald-300' : 'text-rose-300'
              }`}>
                {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 flex min-h-0">
            {isCommandCenter && (
              <aside className="w-32 border-r border-gray-200 flex flex-col bg-gray-50 shrink-0">
                <div className="p-1.5 border-b border-gray-200 bg-white">
                  <input
                    type="text"
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded"
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredTrainers.length === 0 && (
                    <p className="text-[10px] text-gray-400 text-center py-3">No trainers</p>
                  )}
                  {filteredTrainers.map((t) => {
                    const isActive = t.id === activeTrainerId;
                    const isOnline = onlineIds.has(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveTrainerId(t.id)}
                        className={`w-full text-left px-2 py-1.5 border-b border-gray-100 transition ${
                          isActive ? 'bg-purple-50' : 'hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="relative shrink-0">
                            <img
                              src={t.photoUrl || FALLBACK_TRAINER_PHOTO}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-white"
                              onError={(e) => { e.target.src = FALLBACK_TRAINER_PHOTO; }}
                            />
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                              isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-[11px] font-bold truncate">{t.name}</p>
                              {t.unread > 0 && (
                                <span className="shrink-0 bg-purple-600 text-white text-[9px] font-bold px-1 rounded-full">
                                  {t.unread}
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] text-gray-500 truncate">ID {t.id}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>
            )}

            <section className="flex-1 flex flex-col min-w-0">
              {isCommandCenter && (
                <div className="shrink-0 px-3 py-1.5 border-b border-gray-200 flex items-center gap-2">
                  <img
                    src={trainers.find((t) => t.id === activeTrainerId)?.photoUrl || FALLBACK_TRAINER_PHOTO}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-100"
                    onError={(e) => { e.target.src = FALLBACK_TRAINER_PHOTO; }}
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-900 truncate">
                      {trainers.find((t) => t.id === activeTrainerId)?.name || `Trainer ${activeTrainerId}`}
                    </p>
                    <p className="text-[9px] text-gray-500">
                      {onlineIds.has(activeTrainerId) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              )}

              <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 bg-gray-50">
                {loading && <p className="text-center text-[11px] text-gray-400">Loading…</p>}
                {!loading && messages.length === 0 && (
                  <p className="text-center text-[11px] text-gray-400 py-6">
                    No messages yet. Say hi 👋
                  </p>
                )}
                {messages.map((m) => {
                  const mine = m.senderType === mySenderType && m.senderId === mySenderId;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-2.5 py-1.5 rounded-2xl text-xs leading-snug shadow-sm ${
                        mine
                          ? 'bg-purple-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                      }`}>
                        {!mine && (
                          <p className="text-[9px] font-bold uppercase tracking-wider text-purple-500 mb-0.5">
                            {m.senderName || (m.senderType === 'command' ? 'Command Center' : 'Trainer')}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{m.message}</p>
                        <p className={`text-[9px] mt-0.5 ${mine ? 'text-purple-100' : 'text-gray-400'}`}>
                          {new Date(m.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="shrink-0 bg-white border-t border-gray-200 px-2 py-1.5 flex items-center gap-1.5">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isCommandCenter ? `Message trainer ${activeTrainerId}…` : 'Type a message…'}
                  className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || !connected}
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-purple-600 text-white disabled:opacity-40 hover:bg-purple-700 transition"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        title={isOpen ? 'Close chat' : 'Open chat'}
        className="pointer-events-auto fixed z-[80] right-6 bottom-6
                   h-14 w-14 rounded-full shadow-2xl
                   bg-gradient-to-br from-purple-600 to-indigo-700
                   hover:from-purple-700 hover:to-indigo-800
                   flex items-center justify-center text-white
                   transition-all hover:scale-110 active:scale-95"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageSquare className="h-6 w-6" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 flex items-center justify-center rounded-full bg-red-500 text-[11px] font-bold ring-2 ring-white animate-pulse">
                {totalUnread}
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
}