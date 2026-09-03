// Dashboard.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock, Users, CheckSquare, Square, MousePointerClick,
  UserCog, LogOut, Bell, Filter,
  AlertCircle, CheckCircle,
  X, MessageCircle, Bot, Send, RefreshCw,
  Play, Award, Target, Hourglass,
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

// ---- 50 Participants with STATIC durations (1-10 minutes cycle) ----
const indianNames = [
  'Aarav Sharma - 1 min', 'Priya Patel - 2 min', 'Rahul Singh - 3 min', 'Ananya Reddy - 4 min', 'Vikram Kumar - 5 min',
  'Sneha Gupta - 6 min', 'Arjun Mehta - 7 min', 'Kavya Nair - 8 min', 'Rohan Joshi - 9 min', 'Ishita Malhotra - 10 min',
  'Aditya Verma - 1 min', 'Neha Agarwal - 2 min', 'Karan Kapoor - 3 min', 'Sara Khan - 4 min', 'Aryan Singh - 5 min',
  'Diya Sharma - 6 min', 'Kabir Singh - 7 min', 'Maya Patel - 8 min', 'Veer Singh - 9 min', 'Anika Reddy - 10 min',
  'Shaurya Mehta - 1 min', 'Aisha Gupta - 2 min', 'Dhruv Nair - 3 min', 'Anjali Singh - 4 min', 'Reyansh Kumar - 5 min',
  'Aanya Sharma - 6 min', 'Ishaan Patel - 7 min', 'Sia Reddy - 8 min', 'Aarav Singh - 9 min', 'Myra Gupta - 10 min',
  'Vivaan Mehta - 1 min', 'Aadhya Nair - 2 min', 'Anvi Singh - 3 min', 'Aarush Kumar - 4 min', 'Ira Reddy - 5 min',
  'Arjun Singh - 6 min', 'Aanya Patel - 7 min', 'Kiaan Mehta - 8 min', 'Naira Gupta - 9 min', 'Aayush Singh - 10 min',
  'Anaya Reddy - 1 min', 'Pranav Kumar - 2 min', 'Ishaan Gupta - 3 min', 'Riya Singh - 4 min', 'Kunal Sharma - 5 min',
  'Pooja Patel - 6 min', 'Rohit Nair - 7 min', 'Shreya Reddy - 8 min', 'Amit Kumar - 9 min', 'Sonal Mehta - 10 min',
];

export default function Dashboard() {
  // ---- State ----
  const [participants, setParticipants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [trainers, setTrainers] = useState([]);
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

  // Chat
  const [showChat, setShowChat] = useState(false);
  const [chatTrainerId, setChatTrainerId] = useState('bot');
  const [chatMessages, setChatMessages] = useState({
    bot: [
      { id: 1, sender: 'bot', text: '👋 Welcome! How can I help you?' },
    ],
  });
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // Alerts
  const [showAlerts, setShowAlerts] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([
    { id: 1, type: 'warning', message: 'Rahul Singh is overdue', time: '2 min ago' },
    { id: 2, type: 'info', message: 'Trainer Priya has 2 participants waiting', time: '5 min ago' },
    { id: 3, type: 'success', message: 'Ananya completed in 8:30', time: '8 min ago' },
    { id: 4, type: 'danger', message: 'Slot 3 has no trainer assigned', time: '12 min ago' },
  ]);

  // ---- Helper: Parse duration from name (e.g., "Aarav Sharma - 1 min" → 60 seconds) ----
  const parseDurationFromName = (name) => {
    const match = name.match(/(\d+)\s*min/);
    if (match) {
      const minutes = parseInt(match[1]);
      return minutes * 60;
    }
    return 300;
  };

  // ---- Helper: Calculate end time from start time + completion duration ----
  const calculateEndTime = (startTimeStr, durationSeconds) => {
    if (!startTimeStr || !durationSeconds) return '—';
    try {
      const parts = startTimeStr.match(/(\d{2}):(\d{2})\s(AM|PM)/);
      if (!parts) return '—';
      let hours = parseInt(parts[1]);
      const minutes = parseInt(parts[2]);
      const ampm = parts[3];

      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      const totalMinutes = hours * 60 + minutes + Math.floor(durationSeconds / 60);
      const extraSeconds = durationSeconds % 60;
      let newHours = Math.floor(totalMinutes / 60) % 24;
      const newMinutes = totalMinutes % 60;

      const newAmpm = newHours >= 12 ? 'PM' : 'AM';
      const h12 = newHours % 12 || 12;
      const secStr = String(extraSeconds).padStart(2, '0');
      return `${String(h12).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:${secStr} ${newAmpm}`;
    } catch {
      return '—';
    }
  };

  // ---- Format elapsed time as MM:SS ----
  const formatElapsedTime = (seconds) => {
    if (seconds === undefined || seconds === null) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ---- Static data generation ----
  const generateMockData = () => {
    // ---- 10 Trainers ----
    const trainerNames = [
      'Priya Sharma', 'Rahul Verma', 'Anjali Nair', 'Vikram Singh', 'Neha Patel',
      'Rajesh Kumar', 'Sneha Reddy', 'Amit Joshi', 'Kavya Menon', 'Suresh Pillai'
    ];
    const trainerLangs = [
      'English, Hindi', 'English, Tamil', 'English, Malayalam', 'Hindi, English', 'English, Telugu',
      'English, Kannada', 'Hindi, Tamil', 'English, Malayalam', 'Hindi, English', 'English, Telugu'
    ];
    const trainers = trainerNames.map((name, i) => ({
      id: i + 1,
      name,
      languages: trainerLangs[i],
      availability: i < 6 ? 'available' : 'busy',
      assignedCount: Math.floor(Math.random() * 8) + 2,
    }));

    // ---- 10 Rooms (Slots) ----
    const roomNames = Array.from({ length: 10 }, (_, i) => `Slot ${i + 1}`);
    const rooms = roomNames.map((name, i) => ({
      id: i + 1,
      name,
      trainerId: i + 1,
    }));

    const roles = ['Sales', 'Service', 'Finance', 'CRM', 'Parts'];
    const languages = ['English', 'Hindi', 'Tamil', 'Malayalam', 'Telugu', 'Kannada'];
    const agencies = ['Agency A', 'Agency B', 'Agency C'];
    const regions = ['North', 'South', 'East', 'West'];
    const dealerships = ['Dealer 1', 'Dealer 2', 'Dealer 3', 'Dealer 4'];

    const pList = [];
    const numParticipants = indianNames.length;
    for (let i = 0; i < numParticipants; i++) {
      const name = indianNames[i];
      const completionDuration = parseDurationFromName(name);
      
      const roomId = (i % rooms.length) + 1;
      const trainerId = rooms.find(r => r.id === roomId)?.trainerId || 1;
      const trainer = trainers.find(t => t.id === trainerId)?.name || 'Unknown';

      pList.push({
        id: String(i + 1001),
        name: name,
        displayName: name.replace(/\s*-\s*\d+\s*min\s*$/, '').trim(),
        empId: `MS${String(100 + i).padStart(3, '0')}`,
        role: roles[i % roles.length],
        language: languages[i % languages.length],
        elapsedTime: 0,
        completionDuration,
        trainer,
        trainerId,
        octonormId: roomId,
        dbId: i + 1001,
        timeSlotTime: null,
        agency: agencies[i % agencies.length],
        region: regions[i % regions.length],
        dealership: dealerships[i % dealerships.length],
        dealerCode: `D${String(100 + i).slice(0, 3)}`,
        status: 'in-progress',
        passFail: null,
        resetCount: Math.floor(Math.random() * 2),
        delayed: false,
        isTimerComplete: false,
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

    return { participants: pList, trainers, rooms, timeSlots: timeLabels.map(t => ({ time: t })) };
  };

  // ---- Load mock data ----
  useEffect(() => {
    setTimeout(() => {
      try {
        const data = generateMockData();
        setParticipants(data.participants);
        setTrainers(data.trainers);
        setRooms(data.rooms);
        setTimeSlots(data.timeSlots);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }, 600);
  }, []);

  // ---- Timer: count up from 0 to completion duration ----
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setParticipants(prev =>
        prev.map(p => {
          if (p.status === 'completed' || p.isTimerComplete) return p;
          
          const newElapsed = p.elapsedTime + 1;
          if (newElapsed >= p.completionDuration) {
            const passFail = Math.random() > 0.3 ? 'Pass' : 'Fail';
            const alertMsg = `${p.displayName} completed in ${formatElapsedTime(p.completionDuration)}`;
            setLiveAlerts(prevAlerts => [{
              id: Date.now(),
              type: 'success',
              message: alertMsg,
              time: 'Just now',
            }, ...prevAlerts.slice(0, 4)]);
            
            return {
              ...p,
              elapsedTime: p.completionDuration,
              status: 'completed',
              passFail,
              isTimerComplete: true,
            };
          }
          return { ...p, elapsedTime: newElapsed };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  // ---- Computed stats ----
  const stats = useMemo(() => {
    const total = participants.length;
    const completed = participants.filter(p => p.status === 'completed').length;
    const inProgress = participants.filter(p => p.status === 'in-progress').length;
    const delayed = participants.filter(p => p.delayed).length;
    const resets = participants.reduce((sum, p) => sum + (p.resetCount || 0), 0);
    const passCount = participants.filter(p => p.passFail === 'Pass').length;
    const failCount = participants.filter(p => p.passFail === 'Fail').length;
    const passRate = (passCount + failCount) > 0 ? Math.round((passCount / (passCount + failCount)) * 100) : 0;

    const completedParticipants = participants.filter(p => p.status === 'completed');
    const avgTime = completedParticipants.length > 0 ?
      Math.round(completedParticipants.reduce((sum, p) => sum + p.completionDuration, 0) / completedParticipants.length) :
      0;

    const trainerStats = trainers.map(t => {
      const assigned = participants.filter(p => p.trainerId === t.id);
      const completedByTrainer = assigned.filter(p => p.status === 'completed');
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
    };
  }, [participants, trainers]);

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

  // ---- Chat handlers ----
  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg = { id: Date.now(), sender: 'user', text: chatInput.trim() };
    setChatMessages(prev => ({
      ...prev,
      [chatTrainerId]: [...(prev[chatTrainerId] || []), newMsg],
    }));
    setChatInput('');

    setTimeout(() => {
      let replyText;
      if (chatTrainerId === 'bot') {
        const responses = [
          'Let me check that for you...',
          'I see. Can you provide more details?',
          '✅ Done! I\'ve updated the status.',
          '📊 Here\'s the report you requested.',
          '⏳ Please wait while I fetch that data.',
          `📈 Current pass rate is ${stats.passRate}%.`,
          `👤 ${trainers[0]?.name} is available right now.`,
        ];
        replyText = responses[Math.floor(Math.random() * responses.length)];
      } else {
        const trainer = trainers.find(t => t.id === Number(chatTrainerId));
        const trainerName = trainer ? trainer.name : 'Trainer';
        const replies = [
          `Thanks for your message, I'll look into it.`,
          `Sure, I can help with that.`,
          `Please check the participant list for updates.`,
          `I'll be available in 5 minutes.`,
          `Noted. I'll get back to you shortly.`,
          `Let me review the current status.`,
        ];
        replyText = replies[Math.floor(Math.random() * replies.length)];
      }
      const botReply = { id: Date.now() + 1, sender: chatTrainerId === 'bot' ? 'bot' : 'trainer', text: replyText };
      setChatMessages(prev => ({
        ...prev,
        [chatTrainerId]: [...(prev[chatTrainerId] || []), botReply],
      }));
    }, 800);
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatTrainerId]);

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

  // ---- Trainer Legend Component ----
  const TrainerLegend = () => {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {trainers.map(t => {
          const isAvailable = t.availability === 'available';
          return (
            <div key={t.id} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-[10px] font-medium text-gray-700">{t.name}</span>
              <span className={`text-[8px] font-medium ${isAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
                {isAvailable ? '●' : '●'}
              </span>
            </div>
          );
        })}
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
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <button
            onClick={() => {/* logout */ }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
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

          <select
            className="filter-select text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 transition w-32"
            value={filters.dealerCode}
            onChange={e => setFilters({ ...filters, dealerCode: e.target.value })}
          >
            <option value="">All Dealer Codes</option>
            {Array.from(new Set(participants.map(p => p.dealerCode))).map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>

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

      {/* ===== STATS ROW ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-4">
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

        <div className="relative overflow-hidden rounded-2xl p-3.5 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #14B8A6, #0D9488)' }}>
          <div className="flex items-start justify-between">
            <p className="text-[9px] font-bold tracking-wider uppercase">Avg Time</p>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <Hourglass className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="mt-1.5 text-2xl font-extrabold leading-none">{formatElapsedTime(stats.avgTime)}</p>
          <p className="mt-0.5 text-[9px] font-medium text-white/70">Per participant</p>
        </div>
      </div>

      {/* ===== TRAINER WISE COMPLETED + AVAILABILITY ===== */}
      <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
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

        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-500" /> Trainer Availability
            </span>
            <span className="text-[9px] text-gray-400">Live</span>
          </div>
          <div className="space-y-1.5">
            {trainers.map(t => {
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

      {/* ===== GRID VIEW ===== */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-[70px_repeat(10,1fr)] gap-1 min-w-[800px]">
          {/* Header — Time column */}
          <div className="rounded-t-lg bg-gray-700 py-1.5 px-2 text-center text-[12px] font-bold text-white">
            Time
          </div>

{/* Header — Trainer names with availability status (green dot = available, red dot = busy) */}
{rooms.map(room => {
  const trainer = trainers.find(t => t.id === room.trainerId);
  const isAvailable = trainer?.availability === 'available';
  const statusColor = isAvailable ? 'bg-emerald-400' : 'bg-red-400';
  const statusText = isAvailable ? 'Available' : 'Busy';
  return (
    <div key={room.id} className="rounded-t-lg bg-gray-700 py-1.5 px-2 text-center flex flex-col items-center leading-tight">
      {/* Trainer name on its own line */}
      <span className="text-white font-bold text-[12px]">{trainer?.name || '—'}</span>
      {/* Dot + Status text on the same line */}
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className={`h-2 w-2 rounded-full ${statusColor} ${isAvailable ? 'animate-pulse' : ''}`} />
        <span className={`text-[8px] font-medium ${isAvailable ? 'text-emerald-300' : 'text-red-300'}`}>
          {statusText}
        </span>
      </div>
    </div>
  );
})}

          {/* Rows */}
          {Array.from({ length: Math.min(maxRows, 8) }).map((_, rowIdx) => (
            <div key={`row-${rowIdx}`} className="contents">
              <div className="bg-gray-100 border border-gray-200 min-h-[72px] flex items-center justify-center text-[10px] font-bold text-gray-800">
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

                const isCompleted = participant.status === 'completed';
                const elapsedDisplay = isCompleted ? formatElapsedTime(participant.completionDuration) : formatElapsedTime(participant.elapsedTime);

                return (
                  <div
                    key={`${room.id}-${rowIdx}`}
                    className="p-1 border border-gray-200 min-h-[72px] relative transition-colors grid-cell"
                  >
                    <div
                      onClick={() => setSelectedParticipant(participant) || setShowPopup(true)}
                      className={`
                        group relative flex flex-col items-center rounded-lg bg-white p-1 
                        transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md 
                        cursor-pointer border-2 
                        ${isCompleted ? 'border-green-500' : 'border-red-500'}
                      `}
                    >
                      {/* Participant info */}
                      <div className="flex flex-col items-center w-full">
                        <div className="text-[10px] font-bold text-gray-800 truncate w-full text-center">
                          {participant.displayName}
                        </div>
                        <div className="text-[10px] font-bold text-gray-800 truncate w-full text-center">
                          {participant.empId}
                        </div>
                        <div className="text-[10px] font-bold text-gray-800 truncate w-full text-center">
                          {participant.role} · {participant.language || '—'}
                        </div>
                      </div>

                      {/* Elapsed Timer */}
                    <div className={`mt-0.5 text-[10px] font-bold flex items-center justify-center gap-1 ${isCompleted ? 'text-green-600' : 'text-blue-500'}`}>
  {isCompleted ? (
    <>
      <CheckCircle className="h-3 w-3" />
      <span>{elapsedDisplay}</span>
    </>
  ) : (
    <>
      <Clock className="h-3 w-3 animate-pulse" />
      <span>{elapsedDisplay}</span>
    </>
  )}
</div>
                      {/* Pass/Fail */}
                      {participant.passFail && (
                        <div className={`mt-0.5 text-[10px] font-bold ${participant.passFail === 'Pass' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {participant.passFail}
                        </div>
                      )}

                      {/* Status badges */}
                      <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                        {!isCompleted && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" title="Timer active" />
                        )}
                        {isCompleted && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500" title="Completed" />
                        )}
                      </div>
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
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full border-2 border-red-500" /> In Progress</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full border-2 border-green-500" /> Completed</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" /> Timer active</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Completed</span>
        </div>
        <div className="text-[10px] text-gray-400">
          💡 Click a participant card to view details
        </div>
      </div>

      {/* ===== POPUP MODAL ===== */}
      {showPopup && selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-slideUp">
            <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white">{selectedParticipant.displayName}</h3>
                  <p className="text-base font-bold text-white/70">{selectedParticipant.empId}</p>
                  <p className="text-base font-bold text-white/70">{selectedParticipant.role} · {selectedParticipant.language || '—'}</p>
                </div>
                <button onClick={() => { setShowPopup(false); setSelectedParticipant(null); }} className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
                  <span className="text-gray-400">Time Slot</span>
                  <span className="font-medium text-gray-700">{selectedParticipant.timeSlotTime || '—'}</span>
                </div>
               
                <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
                  <span className="text-gray-400">Trainer</span>
                  <span className="font-medium text-gray-700">
                    {selectedParticipant.trainer}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-bold ${selectedParticipant.status === 'completed' ? 'text-green-600' : 'text-blue-500'}`}>
                    {selectedParticipant.status === 'completed' ? '✅ Completed' : '⏱ In Progress'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
                  <span className="text-gray-400">Time Taken</span>
                  <span className={`font-bold ${selectedParticipant.status === 'completed' ? 'text-green-600' : 'text-blue-500'}`}>
                    {selectedParticipant.status === 'completed' 
                      ? formatElapsedTime(selectedParticipant.completionDuration) 
                      : formatElapsedTime(selectedParticipant.elapsedTime)}
                  </span>
                </div>
                {selectedParticipant.passFail && (
                  <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
                    <span className="text-gray-400">Result</span>
                    <span className={`font-bold text-sm ${selectedParticipant.passFail === 'Pass' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {selectedParticipant.passFail}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
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

      {/* ===== FLOATING CHAT BUTTON ===== */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl transition-transform hover:scale-110 hover:shadow-2xl focus:outline-none"
      >
        {showChat ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
        {!showChat && Object.values(chatMessages).some(arr => arr.some(m => m.sender !== 'user')) && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
            {Object.values(chatMessages).reduce((acc, arr) => acc + arr.filter(m => m.sender !== 'user').length, 0)}
          </span>
        )}
      </button>

      {/* ===== CHAT POPUP ===== */}
      {showChat && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-h-[600px] flex flex-col rounded-2xl bg-white shadow-2xl border border-gray-200 animate-slideUp overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-bold">Chat</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <button onClick={() => setShowChat(false)} className="text-white/70 hover:text-white transition">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-1/3 border-r border-gray-200 bg-gray-50 overflow-y-auto">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => setChatTrainerId('bot')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 ${chatTrainerId === 'bot' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
                >
                  <Bot className="h-4 w-4 text-indigo-500" />
                  <span>Bot</span>
                </button>

                {trainers.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setChatTrainerId(String(t.id))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 ${chatTrainerId === String(t.id) ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${t.availability === 'available' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <span className="truncate">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-72 min-h-[200px] bg-gray-50">
                {(chatMessages[chatTrainerId] || []).map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-gray-200 p-2 flex gap-2 bg-white shrink-0">
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