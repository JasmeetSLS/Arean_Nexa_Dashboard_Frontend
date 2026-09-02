// Dashboard.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock, Users, CheckSquare, Square, MousePointerClick,
  UserCog, LogOut, Bell, Filter,
  AlertCircle, CheckCircle,
  X, MessageCircle, Bot, Send, RefreshCw,
  Play, Award, Target, Hourglass,
  Bike,
} from 'lucide-react';

// ---- Color palette (10 distinct colours) ----
const colorPalette = [
  { from: '#8B5CF6', to: '#7C3AED' },
  { from: '#F43F5E', to: '#E11D48' },
  { from: '#0EA5E9', to: '#0284C7' },
  { from: '#F97316', to: '#EA580C' },
  { from: '#34D399', to: '#10B981' },
  { from: '#FBBF24', to: '#F59E0B' },
  { from: '#EC4899', to: '#DB2777' },
  { from: '#14B8A6', to: '#0D9488' },
  { from: '#6366F1', to: '#4F46E5' },
  { from: '#6B7280', to: '#4B5563' },
];

const borderColors = [
  'border-purple-400', 'border-rose-400', 'border-sky-400',
  'border-orange-400', 'border-emerald-400', 'border-amber-400',
  'border-pink-400', 'border-teal-400', 'border-indigo-400',
  'border-gray-400',
];
const bgClasses = [
  'bg-purple-500', 'bg-rose-500', 'bg-sky-500',
  'bg-orange-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500',
  'bg-gray-500',
];

export default function Dashboard() {
  // ---- State ----
  const [participants, setParticipants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    agency: '',
    region: '',
    dealership: '',
    dealerCode: '',
  });

  // UI state
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showChangeTrainer, setShowChangeTrainer] = useState(false);
  const [selectedTrainerForParticipant, setSelectedTrainerForParticipant] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverRoomId, setDragOverRoomId] = useState(null);
  const dragOccurredRef = useRef(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkTrainer, setShowBulkTrainer] = useState(false);

  // Chat
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'bot', text: '👋 Welcome! How can I help you?' },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Alerts
  const [showAlerts, setShowAlerts] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([
    { id: 1, type: 'warning', message: 'Participant Ramesh is 5 mins overdue for Round 2', time: '2 min ago' },
    { id: 2, type: 'info', message: 'Trainer Priya has 2 participants waiting', time: '5 min ago' },
    { id: 3, type: 'success', message: 'Ananya completed all rounds', time: '8 min ago' },
    { id: 4, type: 'danger', message: 'Slot 3 has no trainer assigned', time: '12 min ago' },
  ]);

  // Resume modal
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeParticipant, setResumeParticipant] = useState(null);

  // ---- Static data generation ----
  const generateMockData = () => {
    const trainerNames = ['Priya Sharma', 'Rahul Verma', 'Anjali Nair', 'Vikram Singh', 'Neha Patel'];
    const trainerLangs = ['English, Hindi', 'English, Tamil', 'English, Malayalam', 'Hindi, English', 'English, Telugu'];
    const trainers = trainerNames.map((name, i) => ({
      id: i + 1,
      name,
      languages: trainerLangs[i],
      availability: i < 3 ? 'available' : 'busy',
      assignedCount: Math.floor(Math.random() * 8) + 2,
    }));

    const roomNames = [
      'Octonorm 1', 'Octonorm 2', 'Octonorm 3', 'Octonorm 4', 'Octonorm 5',
      'Octonorm 6', 'Octonorm 7', 'Octonorm 8', 'Octonorm 9', 'Octonorm 10',
    ];
    const rooms = roomNames.map((name, i) => ({
      id: i + 1,
      name,
      bikeName: `Bike ${String.fromCharCode(65 + i)}`,
      trainerId: (i % trainers.length) + 1,
    }));

    const roles = ['Sales', 'Service', 'Finance', 'CRM', 'Parts'];
    const languages = ['English', 'Hindi', 'Tamil', 'Malayalam', 'Telugu', 'Kannada'];
    const agencies = ['Agency A', 'Agency B', 'Agency C'];
    const regions = ['North', 'South', 'East', 'West'];
    const dealerships = ['Dealer 1', 'Dealer 2', 'Dealer 3', 'Dealer 4'];
    const stages = ['main', 'holding(pre)', 'prep', 'round_1', 'hold_after_round_1', 'round_2', 'completed'];
    const stageLabels = {
      main: 'MAIN',
      'holding(pre)': 'HOLD (PRE)',
      prep: 'PREP',
      round_1: 'Round 1',
      hold_after_round_1: 'Hold (after Round 1)',
      round_2: 'Round 2',
      completed: 'HOLD (POST)',
    };

    const pList = [];
    for (let i = 0; i < 42; i++) {
      const tIdx = i % trainers.length;
      const roomId = rooms[i % rooms.length].id;
      const stageKeys = Object.keys(stageLabels);
      const stageIdx = i % stageKeys.length;
      const stage = stageKeys[stageIdx];
      const timer = stage === 'prep' || stage === 'round_1' || stage === 'round_2' ? Math.floor(Math.random() * 300) + 60 : 0;

      pList.push({
        id: String(i + 1001),
        name: `Participant ${i + 1}`,
        empId: `EMP${String(1000 + i).padStart(4, '0')}`,
        role: roles[i % roles.length],
        language: languages[i % languages.length],
        profileImage: null,
        timer,
        booth: stage === 'prep' ? (i % 5) + 1 : null,
        evaluator: null,
        trainer: trainers[tIdx].name,
        trainerId: trainers[tIdx].id,
        octonormId: roomId,
        stage: stage,
        dbId: i + 1001,
        timeSlotTime: null,
        assignedRoundIds: [1, 2],
        agency: agencies[i % agencies.length],
        region: regions[i % regions.length],
        dealership: dealerships[i % dealerships.length],
        dealerCode: `D${String(100 + i).slice(0, 3)}`,
        status: stage === 'completed' ? 'completed' : timer > 0 ? 'in-progress' : 'pending',
        score: stage === 'completed' ? Math.floor(Math.random() * 40) + 60 : null,
        passFail: stage === 'completed' ? (Math.random() > 0.25 ? 'Pass' : 'Fail') : null,
        resetCount: Math.floor(Math.random() * 2),
        delayed: timer === 0 && stage !== 'completed' && stage !== 'main' ? Math.random() > 0.7 : false,
      });
    }

    // Sort by room then by id
    pList.sort((a, b) => a.octonormId - b.octonormId || parseInt(a.id) - parseInt(b.id));

    // Compute time slots
    const roomMap = {};
    pList.forEach(p => {
      if (!roomMap[p.octonormId]) roomMap[p.octonormId] = [];
      roomMap[p.octonormId].push(p);
    });
    const maxRows = Math.max(0, ...Object.values(roomMap).map(arr => arr.length));
    const timeLabels = [];
    const baseTime = new Date();
    baseTime.setHours(9, 0, 0, 0);
    for (let i = 0; i < maxRows; i++) {
      const next = new Date(baseTime.getTime() + i * 30 * 60000);
      const hours = next.getHours();
      const minutes = next.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      timeLabels.push(`${String(h12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`);
    }
    pList.forEach(p => {
      const roomP = roomMap[p.octonormId] || [];
      const idx = roomP.findIndex(pp => pp.id === p.id);
      p.timeSlotTime = (idx !== -1 && idx < timeLabels.length) ? timeLabels[idx] : null;
    });

    const roundsData = [
      { id: 1, name: 'Round 1', time_minutes: 10, hold_area: 1 },
      { id: 2, name: 'Round 2', time_minutes: 10, hold_area: 0 },
    ];

    return { participants: pList, trainers, rooms, rounds: roundsData, timeSlots: timeLabels.map(t => ({ time: t })) };
  };

  // ---- Load mock data ----
  useEffect(() => {
    setTimeout(() => {
      try {
        const data = generateMockData();
        setParticipants(data.participants);
        setTrainers(data.trainers);
        setRooms(data.rooms);
        setRounds(data.rounds);
        setTimeSlots(data.timeSlots);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }, 600);
  }, []);

  // ---- Timer ----
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setParticipants(prev => prev.map(p => p.timer > 0 ? { ...p, timer: p.timer - 1 } : p));
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  // ---- Helpers ----
  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getStageIndex = (key) => {
    const order = ['main', 'holding(pre)', 'prep', 'round_1', 'hold_after_round_1', 'round_2', 'completed'];
    return order.indexOf(key);
  };

  const getStageLabel = (key) => {
    const map = {
      main: 'MAIN',
      'holding(pre)': 'HOLD (PRE)',
      prep: 'PREP',
      round_1: 'Round 1',
      hold_after_round_1: 'Hold (after R1)',
      round_2: 'Round 2',
      completed: 'HOLD (POST)',
    };
    return map[key] || key;
  };

  const trainerColors = {};
  trainers.forEach((t, i) => {
    const colors = ['red-500', 'green-500', 'purple-500', 'pink-500', 'indigo-500', 'teal-500', 'orange-500',
      'gray-500', 'rose-500', 'sky-500'];
    trainerColors[t.name] = { bg: `bg-${colors[i % colors.length]}` };
  });

  // ---- Computed stats ----
  const stats = useMemo(() => {
    const total = participants.length;
    const completed = participants.filter(p => p.stage === 'completed').length;
    const inProgress = participants.filter(p => p.timer > 0 && p.stage !== 'completed').length;
    const delayed = participants.filter(p => p.delayed).length;
    const resets = participants.reduce((sum, p) => sum + (p.resetCount || 0), 0);
    const passCount = participants.filter(p => p.passFail === 'Pass').length;
    const failCount = participants.filter(p => p.passFail === 'Fail').length;
    const passRate = (passCount + failCount) > 0 ? Math.round((passCount / (passCount + failCount)) * 100) : 0;

    const completedWithTimer = participants.filter(p => p.stage === 'completed' && p.timer !== null);
    const avgTime = completedWithTimer.length > 0 ?
      Math.round(completedWithTimer.reduce((s, p) => s + (p.timer || 0), 0) / completedWithTimer.length) :
      0;

    const trainerStats = trainers.map(t => {
      const assigned = participants.filter(p => p.trainerId === t.id);
      const completedByTrainer = assigned.filter(p => p.stage === 'completed');
      const passed = assigned.filter(p => p.passFail === 'Pass');
      return {
        ...t,
        assigned: assigned.length,
        completed: completedByTrainer.length,
        passRate: assigned.length > 0 ? Math.round((passed.length / assigned.length) * 100) : 0,
      };
    });

    return {
      total,
      completed,
      inProgress,
      delayed,
      resets,
      passCount,
      failCount,
      passRate,
      avgTime,
      trainerStats,
      totalRounds: rounds.length,
    };
  }, [participants, trainers, rounds]);

  // ---- Filtering ----
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      if (filters.agency && !p.agency?.includes(filters.agency)) return false;
      if (filters.region && !p.region?.includes(filters.region)) return false;
      if (filters.dealership && !p.dealership?.includes(filters.dealership)) return false;
      if (filters.dealerCode && !p.dealerCode?.includes(filters.dealerCode)) return false;
      return true;
    });
  }, [participants, filters]);

  // ---- Handlers ----
  const handleSelectTrainer = (participantId, trainerId) => {
    setParticipants(prev => prev.map(p =>
      p.id === participantId ?
      { ...p, trainerId, trainer: trainers.find(t => t.id === trainerId)?.name || p.trainer } :
      p
    ));
    setShowChangeTrainer(false);
    setSelectedTrainerForParticipant(null);
  };

  const openPopup = (participant) => {
    setSelectedParticipant(participant);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedParticipant(null);
  };

  const handleMove = (participant) => {
    const order = ['main', 'holding(pre)', 'prep', 'round_1', 'hold_after_round_1', 'round_2', 'completed'];
    const idx = order.indexOf(participant.stage);
    if (idx === -1 || idx === order.length - 1) return;
    const nextStage = order[idx + 1];
    setParticipants(prev => prev.map(p =>
      p.id === participant.id ? {
        ...p,
        stage: nextStage,
        timer: nextStage === 'prep' || nextStage === 'round_1' || nextStage === 'round_2' ? 300 : 0,
        delayed: false,
      } : p
    ));
    closePopup();
  };

  const handleBulkAdvance = () => {
    const order = ['main', 'holding(pre)', 'prep', 'round_1', 'hold_after_round_1', 'round_2', 'completed'];
    setParticipants(prev => prev.map(p => {
      if (selectedIds.has(p.id)) {
        const idx = order.indexOf(p.stage);
        if (idx !== -1 && idx < order.length - 1) {
          const nextStage = order[idx + 1];
          return {
            ...p,
            stage: nextStage,
            timer: nextStage === 'prep' || nextStage === 'round_1' || nextStage === 'round_2' ? 300 : 0,
            delayed: false,
          };
        }
      }
      return p;
    }));
    setSelectedIds(new Set());
  };

  const toggleSelectMode = () => {
    setSelectMode(m => !m);
    setSelectedIds(new Set());
  };

  const toggleSelectParticipant = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkSelectTrainer = (trainerId) => {
    setParticipants(prev => prev.map(p =>
      selectedIds.has(p.id) ?
      { ...p, trainerId, trainer: trainers.find(t => t.id === trainerId)?.name || p.trainer } :
      p
    ));
    setShowBulkTrainer(false);
    clearSelection();
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg = { id: Date.now(), sender: 'user', text: chatInput.trim() };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
    setTimeout(() => {
      const responses = [
        'Let me check that for you...',
        'I see. Can you provide more details?',
        '✅ Done! I\'ve updated the status.',
        '📊 Here\'s the report you requested.',
        '⏳ Please wait while I fetch that data.',
        '💡 Tip: You can use the "Select Multiple" mode to bulk update.',
        '👤 Trainer Priya is available right now.',
        '📈 Current pass rate is 78%.',
      ];
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: responses[Math.floor(Math.random() * responses.length)],
      };
      setChatMessages(prev => [...prev, botMsg]);
    }, 800);
  };

  const handleResumeTest = (participant) => {
    setResumeParticipant(participant);
    setShowResumeModal(true);
  };

  const confirmResume = () => {
    if (resumeParticipant) {
      setParticipants(prev => prev.map(p =>
        p.id === resumeParticipant.id ? {
          ...p,
          timer: 300,
          stage: 'round_1',
          delayed: false,
        } : p
      ));
      setShowResumeModal(false);
      setResumeParticipant(null);
      setLiveAlerts(prev => [{
        id: Date.now(),
        type: 'success',
        message: `${resumeParticipant.name} has been resumed successfully`,
        time: 'Just now',
      }, ...prev]);
    }
  };

  // ---- Grid data ----
  const getParticipantsByRoom = () => {
    const map = {};
    rooms.forEach(room => { map[room.id] = filteredParticipants.filter(p => p.octonormId === room.id); });
    return map;
  };
  const roomsData = getParticipantsByRoom();
  const maxRows = Math.max(0, ...Object.values(roomsData).map(arr => arr.length));

  const timeLabels = [];
  const baseTime = new Date();
  baseTime.setHours(9, 0, 0, 0);
  for (let i = 0; i < maxRows; i++) {
    const next = new Date(baseTime.getTime() + i * 30 * 60000);
    const hours = next.getHours();
    const minutes = next.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    timeLabels.push(`${String(h12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`);
  }

  // ---- Sub-components ----
  const LegendDot = ({ color, label }) => (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-[10px] font-medium text-gray-700">{label}</span>
    </span>
  );

  const TrainerLegend = () => {
    const unique = [...new Set(participants.map(p => p.trainer))];
    return (
      <div className="flex flex-wrap items-center gap-2">
        {unique.map(t => (
          <div key={t} className="flex items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded-full ${trainerColors[t]?.bg || 'bg-gray-400'}`} />
            <span className="text-[10px] font-medium text-gray-700">{t}</span>
          </div>
        ))}
      </div>
    );
  };

  // ---- Render ----
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-4 font-sans pb-32">

      {/* ===== HEADER ===== */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
              DigitalFlow
            </span>
            <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
              Static Demo
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Live dashboard · Real-time participant tracking</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Alerts Bell */}
          <button
            onClick={() => setShowAlerts(true)}
            className="relative flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <Bell className="h-4 w-4" />
            {liveAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white animate-pulse">
                {liveAlerts.length}
              </span>
            )}
          </button>
          {/* Chat Button */}
          <button
            onClick={() => setShowChat(!showChat)}
            className="relative flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chat</span>
          </button>
          {/* Logout Button */}
          <button
            onClick={() => {/* logout */ }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* ===== STATS ROW ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
        {/* Total */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B0E1F] to-[#171B34] p-3.5 text-white shadow-lg">
          <div className="absolute inset-0 opacity-[0.08] bg-grid-pattern" />
          <div className="relative">
            <p className="text-[9px] font-semibold tracking-wider text-gray-300 uppercase">Total</p>
            <p className="mt-1.5 text-2xl font-extrabold leading-none">{stats.total}</p>
            <div className="mt-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
              <Users className="h-3.5 w-3.5 text-gray-200" />
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="relative overflow-hidden rounded-2xl p-3.5 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #0EA5E9, #0284C7)' }}>
          <div className="flex items-start justify-between">
            <p className="text-[9px] font-bold tracking-wider uppercase">In Progress</p>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <Play className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-1.5 text-2xl font-extrabold leading-none">{stats.inProgress}</p>
          <p className="mt-0.5 text-[9px] font-medium text-white/70">Active</p>
        </div>

        {/* Completed */}
        <div className="relative overflow-hidden rounded-2xl p-3.5 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #34D399, #10B981)' }}>
          <div className="flex items-start justify-between">
            <p className="text-[9px] font-bold tracking-wider uppercase">Completed</p>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <CheckCircle className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-1.5 text-2xl font-extrabold leading-none">{stats.completed}</p>
          <p className="mt-0.5 text-[9px] font-medium text-white/70">{Math.round((stats.completed / stats.total) * 100)}%</p>
        </div>

        {/* Delayed */}
        <div className="relative overflow-hidden rounded-2xl p-3.5 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
          <div className="flex items-start justify-between">
            <p className="text-[9px] font-bold tracking-wider uppercase">Delayed</p>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-1.5 text-2xl font-extrabold leading-none">{stats.delayed}</p>
          <p className="mt-0.5 text-[9px] font-medium text-white/70">Overdue</p>
        </div>

        {/* Resets */}
        <div className="relative overflow-hidden rounded-2xl p-3.5 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #EC4899, #DB2777)' }}>
          <div className="flex items-start justify-between">
            <p className="text-[9px] font-bold tracking-wider uppercase">Resets</p>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <RefreshCw className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-1.5 text-2xl font-extrabold leading-none">{stats.resets}</p>
          <p className="mt-0.5 text-[9px] font-medium text-white/70">Total</p>
        </div>

        {/* Pass Rate */}
        <div className="relative overflow-hidden rounded-2xl p-3.5 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
          <div className="flex items-start justify-between">
            <p className="text-[9px] font-bold tracking-wider uppercase">Pass Rate</p>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <Award className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-1.5 text-2xl font-extrabold leading-none">{stats.passRate}%</p>
          <p className="mt-0.5 text-[9px] font-medium text-white/70">{stats.passCount} Pass / {stats.failCount} Fail</p>
        </div>

        {/* Avg Time */}
        <div className="relative overflow-hidden rounded-2xl p-3.5 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #14B8A6, #0D9488)' }}>
          <div className="flex items-start justify-between">
            <p className="text-[9px] font-bold tracking-wider uppercase">Avg Time</p>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <Hourglass className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-1.5 text-2xl font-extrabold leading-none">{formatTime(stats.avgTime)}</p>
          <p className="mt-0.5 text-[9px] font-medium text-white/70">Per participant</p>
        </div>

        {/* Total Rounds */}
        <div className="relative overflow-hidden rounded-2xl p-3.5 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
          <div className="flex items-start justify-between">
            <p className="text-[9px] font-bold tracking-wider uppercase">Rounds</p>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <Target className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-1.5 text-2xl font-extrabold leading-none">{stats.totalRounds}</p>
          <p className="mt-0.5 text-[9px] font-medium text-white/70">Total configured</p>
        </div>
      </div>

      {/* ===== FILTERS BAR ===== */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm animate-fadeIn">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filters
          </span>
          <select
            className="filter-select text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 transition"
            value={filters.agency}
            onChange={e => setFilters({ ...filters, agency: e.target.value })}
          >
            <option value="">All Agencies</option>
            <option value="Agency A">Agency A</option>
            <option value="Agency B">Agency B</option>
            <option value="Agency C">Agency C</option>
          </select>
          <select
            className="filter-select text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 transition"
            value={filters.region}
            onChange={e => setFilters({ ...filters, region: e.target.value })}
          >
            <option value="">All Regions</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
          </select>
          <select
            className="filter-select text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 transition"
            value={filters.dealership}
            onChange={e => setFilters({ ...filters, dealership: e.target.value })}
          >
            <option value="">All Dealerships</option>
            <option value="Dealer 1">Dealer 1</option>
            <option value="Dealer 2">Dealer 2</option>
            <option value="Dealer 3">Dealer 3</option>
            <option value="Dealer 4">Dealer 4</option>
          </select>
          <input
            type="text"
            placeholder="Dealer Code..."
            value={filters.dealerCode}
            onChange={e => setFilters({ ...filters, dealerCode: e.target.value })}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 transition w-32"
          />
          <button
            onClick={() => setFilters({ agency: '', region: '', dealership: '', dealerCode: '' })}
            className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 transition"
          >
            <X className="h-3 w-3 inline mr-1" /> Clear
          </button>
          <div className="ml-auto flex items-center gap-2 text-[10px] text-gray-400">
            <span><Users className="h-3 w-3 inline mr-1" /> {filteredParticipants.length} participants</span>
          </div>
        </div>
      </div>

      {/* ===== TRAINER WISE COMPLETED + AVAILABILITY ===== */}
      <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Trainer-wise completed */}
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm card-hover lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5">
              <UserCog className="h-4 w-4 text-indigo-500" /> Trainer-wise Completed
            </span>
            <span className="text-[9px] text-gray-400">{stats.trainerStats.length} trainers</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {stats.trainerStats.map(t => (
              <div key={t.id} className="flex-1 min-w-[80px] bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-700 truncate">{t.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-extrabold text-indigo-600">{t.completed}</span>
                  <span className="text-[9px] text-gray-400">/ {t.assigned}</span>
                  <span className={`ml-auto text-[9px] font-semibold ${t.passRate >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                    {t.passRate}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (t.completed / Math.max(1, t.assigned)) * 100)}%`,
                      background: `linear-gradient(90deg, ${colorPalette[t.id % colorPalette.length].from}, ${colorPalette[t.id % colorPalette.length].to})`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trainer Availability */}
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-500" /> Trainer Availability
            </span>
            <span className="text-[9px] text-gray-400">Live</span>
          </div>
          <div className="space-y-1.5">
            {trainers.slice(0, 5).map(t => {
              const isAvailable = t.availability === 'available';
              return (
                <div key={t.id} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="text-[11px] font-medium text-gray-700">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-medium ${isAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isAvailable ? 'Available' : 'Busy'}
                    </span>
                    <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {t.assignedCount} assigned
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== SELECT MODE BAR ===== */}
      <div className="mb-3 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <MousePointerClick className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-600">
            {selectMode ? 'Select mode: tap cards to select' : 'Tap a card to move it forward'}
          </span>
        </div>
        <button
          onClick={toggleSelectMode}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${selectMode ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          {selectMode ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
          {selectMode ? 'Exit Select Mode' : 'Select Multiple'}
        </button>
      </div>

      {/* ===== GRID VIEW ===== */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-[70px_repeat(10,1fr)] gap-1 min-w-[800px]">
          {/* Header */}
          <div className="rounded-t-lg bg-gray-700 py-1.5 px-2 text-center text-[10px] font-bold text-white">
            Time
          </div>
          {rooms.map(room => {
            const trainer = trainers.find(t => t.id === room.trainerId);
            return (
              <div key={room.id} className="rounded-t-lg bg-gray-700 py-1.5 px-2 text-center flex flex-col items-center leading-tight">
                {room.bikeName && (
                  <span className="text-yellow-400 font-bold text-[9px] flex items-center gap-0.5">
                    <Bike className="h-3 w-3" /> {room.bikeName}
                  </span>
                )}
                <span className="text-white font-bold text-[10px]">{room.name.replace('Octonorm ', 'O')}</span>
                <span className="text-[8px] text-gray-300">{trainer?.name || '—'}</span>
              </div>
            );
          })}

          {/* Rows */}
          {Array.from({ length: Math.min(maxRows, 8) }).map((_, rowIdx) => (
            <div key={`row-${rowIdx}`} className="contents">
              <div className="bg-gray-100 border border-gray-200 min-h-[72px] flex items-center justify-center text-[10px] font-semibold text-gray-500">
                {timeLabels[rowIdx] || ''}
              </div>
              {rooms.map(room => {
                const participant = roomsData[room.id]?.[rowIdx] || null;
                if (!participant) {
                  return (
                    <div
                      key={`${room.id}-${rowIdx}`}
                      className="p-1 border border-gray-200 min-h-[72px] relative bg-white/30"
                    >
                      <div className="text-center text-[8px] text-gray-300 py-4">—</div>
                    </div>
                  );
                }
                const stageIdx = getStageIndex(participant.stage);
                const borderColor = stageIdx !== -1 ? borderColors[stageIdx % borderColors.length] : 'border-gray-400';
                const isSelected = selectedIds.has(participant.id);

                return (
                  <div
                    key={`${room.id}-${rowIdx}`}
                    className="p-1 border border-gray-200 min-h-[72px] relative transition-colors grid-cell"
                  >
                    <div
                      draggable={!selectMode}
                      onDragStart={(e) => {
                        if (selectMode) { e.preventDefault(); return; }
                        setDraggedId(participant.id);
                        dragOccurredRef.current = false;
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', participant.id);
                      }}
                      onDragEnd={() => { setDraggedId(null); setDragOverRoomId(null); }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dragOccurredRef.current = true;
                        const sourceId = draggedId;
                        setDragOverRoomId(null);
                        setDraggedId(null);
                        if (!sourceId || sourceId === participant.id) return;
                        setParticipants(prev => {
                          const arr = [...prev];
                          const fromIdx = arr.findIndex(p => p.id === sourceId);
                          const toIdx = arr.findIndex(p => p.id === participant.id);
                          if (fromIdx === -1 || toIdx === -1) return prev;
                          const [item] = arr.splice(fromIdx, 1);
                          const insertIdx = fromIdx < toIdx ? toIdx - 1 : toIdx;
                          arr.splice(insertIdx, 0, { ...item, octonormId: participant.octonormId });
                          return arr;
                        });
                      }}
                      onClick={() => {
                        if (selectMode) { toggleSelectParticipant(participant.id); return; }
                        if (dragOccurredRef.current) { dragOccurredRef.current = false; return; }
                        openPopup(participant);
                      }}
                      className={`group relative flex flex-col items-center rounded-lg bg-white p-1 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md cursor-${selectMode ? 'pointer' : 'grab'} active:cursor-grabbing border-4 ${borderColor} ${draggedId === participant.id ? 'opacity-30' : ''} ${isSelected ? 'ring-4 ring-indigo-500 ring-offset-1' : ''}`}
                    >
                      {selectMode && (
                        <div className={`absolute -top-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow-sm ${isSelected ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                          {isSelected && <CheckSquare className="h-2.5 w-2.5 text-white" />}
                        </div>
                      )}
                      <div className="relative">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 border-2 border-white shadow-sm">
                          {participant.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        {participant.timer > 0 && (
                          <div className="absolute -bottom-0.5 -right-0.5 rounded-full border border-white bg-red-500 p-0.5 shadow-sm">
                            <Clock className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                        {participant.status === 'completed' && (
                          <div className="absolute -top-0.5 -right-0.5 rounded-full bg-emerald-500 p-0.5 shadow-sm">
                            <CheckCircle className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                        {participant.delayed && (
                          <div className="absolute -top-0.5 -left-0.5 rounded-full bg-amber-500 p-0.5 shadow-sm animate-pulse">
                            <Clock className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="mt-0.5 w-full truncate text-center text-[9px] font-semibold leading-tight text-black">
                        {participant.name}
                      </div>
                      <div className="mt-0.5 w-full truncate text-center text-[8px] font-medium text-gray-500">
                        {participant.role} · {participant.language || '—'}
                      </div>
                      <div className="mt-0.5 w-full flex justify-center">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold ${trainerColors[participant.trainer]?.bg || 'bg-gray-400'} text-white`}>
                          {participant.trainer}
                        </span>
                      </div>
                      {participant.timer > 0 && (
                        <div className={`mt-0.5 text-[9px] font-bold ${participant.timer < 60 ? 'animate-pulse text-red-500' : 'text-blue-500'}`}>
                          {formatTime(participant.timer)}
                        </div>
                      )}
                      {participant.passFail && (
                        <div className={`mt-0.5 text-[8px] font-bold ${participant.passFail === 'Pass' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {participant.passFail}
                        </div>
                      )}
                      {participant.resetCount > 0 && (
                        <div className="mt-0.5 text-[8px] text-gray-400">
                          <RefreshCw className="h-2.5 w-2.5 inline mr-0.5" /> {participant.resetCount}
                        </div>
                      )}
                      {/* Resume button for delayed participants */}
                      {participant.delayed && participant.stage !== 'completed' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleResumeTest(participant); }}
                          className="absolute bottom-0.5 right-0.5 text-[8px] bg-indigo-500 text-white px-1.5 py-0.5 rounded shadow-sm hover:bg-indigo-600 transition"
                        >
                          Resume
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ===== LEGEND ===== */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-[10px]">
          <span className="font-semibold text-gray-400">LEGEND:</span>
          <LegendDot color="bg-purple-500" label="MAIN" />
          <LegendDot color="bg-amber-500" label="HOLD (PRE)" />
          <LegendDot color="bg-sky-500" label="PREP" />
          <LegendDot color="bg-rose-500" label="Round 1" />
          <LegendDot color="bg-orange-500" label="Hold (after R1)" />
          <LegendDot color="bg-emerald-500" label="Round 2" />
          <LegendDot color="bg-green-500" label="HOLD (POST)" />
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-red-500" /> Timer</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /> Delayed</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Completed</span>
          <span className="text-gray-300">|</span>
          <span className="text-[9px]">{selectMode ? '💡 Tap cards to select · Use bulk bar below' :
            '💡 Click a card to advance · Drag to reorder · Use "Select Multiple" for bulk'}</span>
        </div>
      </div>

      {/* ===== TRAINER LEGEND ===== */}
      <div className="mt-2 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-gray-400">TRAINERS:</span>
          <TrainerLegend />
        </div>
      </div>

      {/* ===== BULK ACTION BAR ===== */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2.5 text-white shadow-2xl animate-slideUp">
          <span className="text-xs font-bold whitespace-nowrap">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-white/20" />
          <button onClick={handleBulkAdvance} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold hover:bg-indigo-500 transition whitespace-nowrap">
            <Play className="h-3 w-3 inline mr-1.5" /> Move Forward
          </button>
          <button onClick={() => setShowBulkTrainer(true)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold hover:bg-emerald-500 transition whitespace-nowrap">
            <UserCog className="h-3 w-3 inline mr-1.5" /> Change Trainer
          </button>
          <button onClick={clearSelection} className="rounded-lg bg-gray-700 px-3 py-1.5 text-[11px] font-semibold hover:bg-gray-600 transition whitespace-nowrap">
            <X className="h-3 w-3 inline mr-1.5" /> Clear
          </button>
        </div>
      )}

      {/* ===== ALERTS MODAL ===== */}
      {showAlerts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="mx-4 w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-2xl animate-slideUp flex flex-col">
            <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-white" />
                <span className="text-sm font-bold text-white">Notifications</span>
              </div>
              <button onClick={() => setShowAlerts(false)} className="text-white/70 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {liveAlerts.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">No new alerts</div>
              ) : (
                liveAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-2.5 px-3 py-2 rounded-lg text-xs border ${alert.type === 'danger' ? 'bg-red-50 border-red-100' :
                        alert.type === 'warning' ? 'bg-amber-50 border-amber-100' :
                        alert.type === 'success' ? 'bg-emerald-50 border-emerald-100' :
                        'bg-blue-50 border-blue-100'}`}
                  >
                    {alert.type === 'danger' ? <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" /> :
                      alert.type === 'warning' ? <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" /> :
                      alert.type === 'success' ? <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" /> :
                      <Bell className="h-4 w-4 text-blue-500 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-gray-700">{alert.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{alert.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-gray-100 px-4 py-3 shrink-0">
              <button onClick={() => setShowAlerts(false)} className="w-full rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== POPUP MODAL ===== */}
      {showPopup && selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-slideUp">
            <div className="px-5 py-3.5" style={{
              background: `linear-gradient(135deg, ${(() => {
                const idx = getStageIndex(selectedParticipant.stage);
                const c = idx !== -1 ? colorPalette[idx % colorPalette.length] : { from: '#6B7280', to: '#4B5563' };
                return `${c.from}, ${c.to}`;
              })()})`
            }}>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold text-white shadow-lg ring-4 ring-white/30">
                  {selectedParticipant.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white">{selectedParticipant.name}</h3>
                  <p className="text-xs text-white/70">{selectedParticipant.empId}</p>
                  <p className="text-[10px] text-white/50">{selectedParticipant.role} · {selectedParticipant.language || '—'}</p>
                </div>
                <button onClick={closePopup} className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="text-[10px] font-semibold text-gray-400 mb-2">FLOW STEPS</div>
                <div className="flex items-center justify-between">
                  {['MAIN', 'HOLD(PRE)', 'PREP', 'R1', 'Hold(R1)', 'R2', 'POST'].map((label, idx) => {
                    const isActive = getStageIndex(selectedParticipant.stage) === idx;
                    const isPast = getStageIndex(selectedParticipant.stage) > idx;
                    return (
                      <React.Fragment key={idx}>
                        <div className="flex flex-col items-center">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold ${isActive ? 'bg-indigo-600 text-white' : isPast ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            {idx + 1}
                          </div>
                          <span className="text-[7px] text-gray-500 mt-0.5">{label}</span>
                        </div>
                        {idx < 6 && <div className="flex-1 h-0.5 mx-0.5 bg-gray-200" />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Current</span>
                  <span className="font-medium text-gray-700">{getStageLabel(selectedParticipant.stage)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
                  <span className="text-gray-400">Next</span>
                  <span className="font-semibold text-indigo-600">
                    {(() => {
                      const order = ['main', 'holding(pre)', 'prep', 'round_1', 'hold_after_round_1', 'round_2', 'completed'];
                      const idx = order.indexOf(selectedParticipant.stage);
                      if (idx === -1 || idx === order.length - 1) return '—';
                      return getStageLabel(order[idx + 1]);
                    })()}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
                  <span className="text-gray-400">Octonorm</span>
                  <span className="font-medium text-gray-700">{rooms.find(r => r.id === selectedParticipant.octonormId)?.name || '—'}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
                  <span className="text-gray-400">Time Slot</span>
                  <span className="font-medium text-gray-700">{selectedParticipant.timeSlotTime || '—'}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
                  <span className="text-gray-400">Trainer</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${trainerColors[selectedParticipant.trainer]?.bg || 'bg-gray-400'} text-white`}>
                      {selectedParticipant.trainer}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedTrainerForParticipant(selectedParticipant);
                        setShowChangeTrainer(true);
                        closePopup();
                      }}
                      className="text-[9px] font-medium text-indigo-600 hover:text-indigo-800 transition"
                    >
                      Change
                    </button>
                  </div>
                </div>
                {selectedParticipant.passFail && (
                  <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
                    <span className="text-gray-400">Result</span>
                    <span className={`font-bold text-sm ${selectedParticipant.passFail === 'Pass' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {selectedParticipant.passFail}
                    </span>
                  </div>
                )}
                {selectedParticipant.delayed && (
                  <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
                    <span className="text-gray-400">Status</span>
                    <span className="text-amber-600 font-medium text-[10px] flex items-center gap-1">
                      <Clock className="h-3 w-3 animate-pulse" /> Delayed
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button onClick={closePopup} className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200">
                  Cancel
                </button>
                <button
                  onClick={() => handleMove(selectedParticipant)}
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:shadow-xl"
                  style={{
                    background: `linear-gradient(135deg, ${(() => {
                      const idx = getStageIndex(selectedParticipant.stage);
                      const c = idx !== -1 ? colorPalette[idx % colorPalette.length] : { from: '#6B7280', to: '#4B5563' };
                      return `${c.from}, ${c.to}`;
                    })()})`
                  }}
                >
                  <Play className="h-4 w-4 inline mr-1.5" /> Move to Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CHANGE TRAINER MODAL ===== */}
      {showChangeTrainer && selectedTrainerForParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-slideUp">
            <div className="px-5 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-white" />
                  <span className="text-sm font-bold text-white">Change Trainer</span>
                </div>
                <button onClick={() => { setShowChangeTrainer(false); setSelectedTrainerForParticipant(null); }} className="text-white/70 hover:text-white transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-white/70 mt-1">{selectedTrainerForParticipant.name} — Current: {selectedTrainerForParticipant.trainer}</p>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              <div className="space-y-1">
                {trainers.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleSelectTrainer(selectedTrainerForParticipant.id, t.id);
                      setShowChangeTrainer(false);
                      setSelectedTrainerForParticipant(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition flex items-center justify-between ${selectedTrainerForParticipant.trainerId === t.id ? `ring-2 ring-indigo-500 ${trainerColors[t.name]?.bg || 'bg-gray-400'} text-white` : `hover:${trainerColors[t.name]?.bg || 'bg-gray-100'}`}`}
                  >
                    <span className={selectedTrainerForParticipant.trainerId === t.id ? "text-white" : "text-gray-700"}>
                      {t.name} {t.languages ? `(${t.languages})` : ''}
                    </span>
                    {selectedTrainerForParticipant.trainerId === t.id && (
                      <span className="text-[10px] font-bold text-white">✓ Current</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
              <button onClick={() => { setShowChangeTrainer(false); setSelectedTrainerForParticipant(null); }} className="w-full rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BULK CHANGE TRAINER MODAL ===== */}
      {showBulkTrainer && selectedIds.size > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-slideUp">
            <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-white" />
                  <span className="text-sm font-bold text-white">Change Trainer (Bulk)</span>
                </div>
                <button onClick={() => setShowBulkTrainer(false)} className="text-white/70 hover:text-white transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-white/70 mt-1">Applying to {selectedIds.size} selected participant{selectedIds.size > 1 ? 's' : ''}</p>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              <div className="space-y-1">
                {trainers.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleBulkSelectTrainer(t.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition flex items-center justify-between hover:${trainerColors[t.name]?.bg || 'bg-gray-100'}`}
                  >
                    <span className="text-gray-700">{t.name} {t.languages ? `(${t.languages})` : ''}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
              <button onClick={() => setShowBulkTrainer(false)} className="w-full rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== RESUME MODAL ===== */}
      {showResumeModal && resumeParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-slideUp">
            <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-white" />
                  <span className="text-sm font-bold text-white">Resume Test</span>
                </div>
                <button onClick={() => { setShowResumeModal(false); setResumeParticipant(null); }} className="text-white/70 hover:text-white transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-white/70 mt-1">{resumeParticipant.name} — {resumeParticipant.empId}</p>
            </div>
            <div className="p-4">
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800 mb-4">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                This participant's slot time has expired. Allow them to resume the test with remaining questions?
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setShowResumeModal(false); setResumeParticipant(null); }} className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200">
                  Cancel
                </button>
                <button onClick={confirmResume} className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:bg-amber-600 hover:shadow-xl">
                  <CheckCircle className="h-4 w-4 inline mr-1.5" /> Resume Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CHAT BOT (Bottom Right Corner) ===== */}
      {showChat && (
        <div className="fixed bottom-4 right-4 z-50 w-80 max-h-[500px] flex flex-col rounded-2xl bg-white shadow-2xl border border-gray-200 animate-slideUp overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="text-sm font-bold">Flow Assistant</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <button onClick={() => setShowChat(false)} className="text-white/70 hover:text-white transition">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-64 min-h-[200px] bg-gray-50">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 p-2 flex gap-2 bg-white">
            <input
              type="text"
              placeholder="Type a message..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
              className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 transition"
            />
            <button onClick={sendChatMessage} className="bg-indigo-600 text-white rounded-lg px-3 py-2 text-xs font-semibold hover:bg-indigo-700 transition">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===== CSS Animations ===== */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-pulse { animation: pulse 1.5s ease-in-out infinite; }
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.06); }
        .grid-cell { transition: background-color 0.15s ease; }
        .grid-cell:hover { background-color: rgba(99, 102, 241, 0.04); }
        .filter-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; padding-right: 28px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .bg-grid-pattern { background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px); background-size: 16px 16px; }
        .chat-bubble-user { background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; border-bottom-right-radius: 4px; }
        .chat-bubble-bot { background: #f1f5f9; color: #1e293b; border-bottom-left-radius: 4px; }
      `}</style>
    </div>
  );
}