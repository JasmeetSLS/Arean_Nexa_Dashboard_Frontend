// Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock, Users, CheckCircle, AlertCircle, X, 
  RefreshCw, Play, Award, Hourglass, Bell, Filter, LogOut,
  ChevronLeft, ChevronRight, Search
} from 'lucide-react';
import { Toaster } from '../components/Toaster.jsx';

// ---- Color palette ----
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

// ---- Time Slots ----
const TIME_SLOTS = Array.from({ length: 9 }, (_, i) => {
  const hour = i + 9;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${String(h12).padStart(2, '0')}:00 ${ampm}`;
});

// ---- 90 Participant names ----
const PARTICIPANT_NAMES = [
  'AYUSH RAJ', 'AYUSH YADAV', 'AYYUB KHAN', 'AZHAR KALIM KHAN', 'B CHANDRA SEKHAR',
  'BABITHESH P K', 'BABLU NAGAR', 'BADRISH PANDEY', 'BAKHTAR ALLI KILEDAR', 'BALASUNDARAM MUTYALA',
  'CHUDAMANI SAHU', 'CIZEER RAJENDRA KADAM', 'DABHI LEENKUMAR NARESHKUMAR', 'DALEEP SINGH', 'DALVIR SINGH',
  'DAMANPREET SINGH', 'DANISH AHAMAD', 'DANISH GULZAR ZARGER', 'DANISH MAJEED BHAT', 'DARPAN ACHARYA',
  'DARSHAN GOWDA L', 'DARSHAN SINGH', 'DARSHAN VILAS GARVAD', 'DATTATRAY BABASO ROMAN', 'EDWIN M J',
  'EZAZ HIDAYATULLAH KHANUSIYA', 'FAHAD BIN AYYUB', 'FAHEK ALI BANGALI', 'FAIZAN ASHRAF DAR', 'FAIZAN PASHA KK',
  'FAKRE ALAM', 'FAROOQ KHAN', 'FEROZ SALIM SHAIKH', 'FIDUL KHADER', 'FINAZ K P',
  'FIRDOUS ALAM', 'GOVIND RANA', 'GOVIND SINGH PARIHAR', 'GRISHANT GHANSHAM GAIKWAD', 'GULSHAN KUMAR',
  'GULSHAN KUMAR NARCHAL', 'GULZAR AHMAD JOO', 'GUNDUMOGULA VENKATA PHANEENDRA', 'HANTSULA K', 'HARDIBEN PANKAJBHAI PATEL',
  'HARDIK KULKARNI', 'HARDIK RAJESHBHAI SANCHALA', 'HARDIPSINH ZALA', 'HARENDER', 'HARIHARAN S',
  'HARIKRISHNA SRIKOLANU', 'INBARASAN P', 'INSHAD C S', 'INZAMAM A SHAIKH', 'IRAPU RAVI',
  'IRFAN PATEL', 'ISHFAQ AHMAD FARASH', 'IZHAR ANWAAR SIDDIQUI', 'JADHAV ULHAS VIJAY', 'JAGAN M',
  'JAGAN THOMAS MATHEW', 'JAGDEEP SINGH', 'JAGDISH', 'JAGDISH KUMAR', 'KAMAL KANT',
  'KAMAL KISHOR', 'KAMAL KUMAR VISHVAKARMA', 'KAMAL TANEJA', 'KAMINI DEWANGAN', 'KAMINI KUMARI',
  'KAMLESH BANGWAL', 'KAMLESH TIWARI', 'LOVEPRIT SINGH', 'LUCKY ALI', 'LUCKY RAJ SINGH',
  'M LALRINSANGI', 'M ZUBAIR', 'MADASAMY R', 'MADHU SUDHANA', 'MADHU TERESA',
  'MADHUMANTHI TRIMURTHULU', 'MAHABIR PRASAD SAHOO', 'MAHADEVI POOJARI', 'MAHAK RAWAT', 'MAHAMADFARID CHHATBAR',
  'OSMAN E GHANI', 'OVAIS REYAZ KHAN', 'PABITRA KUMAR BEHERA', 'PALANIKUMAR M', 'PALASH SINGHA',
];

const indianNames = PARTICIPANT_NAMES.map((name, i) => {
  const mins = (i % 10) + 1;
  return `${name} - ${mins} min`;
});

// ---- Trainer Master Data ----
const TRAINER_MASTER = [
  { id: 1, name: 'Pooja Bora', languages: 'English, Hindi', availability: 'available', photoUrl: '/trainers/1.jpeg' },
  { id: 2, name: 'Meharban singh Bhatia', languages: 'English, Tamil', availability: 'available', photoUrl: '/trainers/2.jpeg' },
  { id: 3, name: 'Imtiyaz syed', languages: 'English, Malayalam', availability: 'available', photoUrl: '/trainers/3.jpeg' },
  { id: 4, name: 'Mihir Zaveri', languages: 'Hindi, English', availability: 'available', photoUrl: '/trainers/4.jpeg' },
  { id: 5, name: 'Virendar hada', languages: 'English, Telugu', availability: 'available', photoUrl: '/trainers/5.jpeg' },
  { id: 6, name: 'Arun jose', languages: 'English, Kannada', availability: 'available', photoUrl: '/trainers/6.jpeg' },
  { id: 7, name: 'Manjira', languages: 'Hindi, Tamil', availability: 'busy', photoUrl: '/trainers/7.jpeg' },
  { id: 8, name: 'Sudhevan kj', languages: 'English, Malayalam', availability: 'busy', photoUrl: '/trainers/8.jpeg' },
  { id: 9, name: 'Sagar mokase', languages: 'Hindi, English', availability: 'busy', photoUrl: '/trainers/9.jpeg' },
  { id: 10, name: 'Tikendra sumara', languages: 'English, Telugu', availability: 'busy', photoUrl: '/trainers/10.jpeg' },
];

const FALLBACK_TRAINER_PHOTO = '/trainers/1.jpeg';

export default function Dashboard() {
  const [participants, setParticipants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({ agency: '', region: '', dealership: '', dealerCode: '' });
  const [searchTrainer, setSearchTrainer] = useState('');
  const [searchParticipant, setSearchParticipant] = useState('');

  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showParticipantJourney, setShowParticipantJourney] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [showTrainerJourney, setShowTrainerJourney] = useState(false);

  const [trainerPage, setTrainerPage] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([
    { id: 1, title: 'Trainer Pooja is Offline', subtitle: 'Slot 3 · Sales · North region', time: '2 min ago', photoUrl: '/trainers/1.jpeg' },
    { id: 2, title: 'Trainer Meharban is Offline', subtitle: 'Slot 5 · Service · South region', time: '8 min ago', photoUrl: '/trainers/2.jpeg' },
    { id: 3, title: 'Trainer Imtiyaz missed slot start', subtitle: 'Slot 7 · Finance · East region', time: '15 min ago', photoUrl: '/trainers/3.jpeg' },
    { id: 4, title: 'Trainer Mihir not assigned', subtitle: 'Slot 2 · CRM · West region', time: '22 min ago', photoUrl: '/trainers/4.jpeg' },
  ]);

  // ---- Toast toggle state ----
  const [toastOn, setToastOn] = useState(false);

  const parseDurationFromName = (name) => {
    const match = name.match(/(\d+)\s*min/);
    return match ? parseInt(match[1]) * 60 : 300;
  };

  const formatElapsedTime = (seconds) => {
    if (seconds === undefined || seconds === null) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const generateMockData = () => {
    const trainers = TRAINER_MASTER.map(t => ({ ...t, assignedCount: 9 }));
    const roomNames = Array.from({ length: 10 }, (_, i) => `Slot ${i + 1}`);
    const rooms = roomNames.map((name, i) => ({ id: i + 1, name, trainerId: i + 1 }));

    const roles = ['Sales', 'Service', 'Finance', 'CRM', 'Parts'];
    const languages = ['English', 'Hindi', 'Tamil', 'Malayalam', 'Telugu', 'Kannada'];
    const agencies = ['Agency A', 'Agency B', 'Agency C'];
    const regions = ['North', 'South', 'East', 'West'];
    const dealerships = ['Dealer 1', 'Dealer 2', 'Dealer 3', 'Dealer 4'];

    const pList = [];
    let pIdx = 0;

    rooms.forEach(room => {
      const trainer = trainers.find(t => t.id === room.trainerId);
      TIME_SLOTS.forEach((slot, slotIdx) => {
        const name = indianNames[pIdx % indianNames.length];
        const completionDuration = parseDurationFromName(name);

        let status = 'in-progress';
        let passFail = null;
        let isTimerComplete = false;

        if (slotIdx < 4) {
          status = 'completed'; passFail = 'Pass'; isTimerComplete = true;
        } else if (slotIdx < 6) {
          status = pIdx % 3 === 0 ? 'in-progress' : 'completed';
          if (status === 'completed') { passFail = 'Pass'; isTimerComplete = true; }
        }

        pList.push({
          id: String(pIdx + 1001),
          name,
          displayName: name.replace(/\s*-\s*\d+\s*min\s*$/, '').trim(),
          empId: `MS${String(100 + pIdx).padStart(3, '0')}`,
          role: roles[pIdx % roles.length],
          language: languages[pIdx % languages.length],
          elapsedTime: status === 'completed' ? completionDuration : Math.floor(completionDuration * 0.4),
          completionDuration,
          trainer: trainer.name, trainerId: trainer.id,
          octonormId: room.id, dbId: pIdx + 1001, timeSlotTime: slot,
          agency: agencies[pIdx % agencies.length],
          region: regions[pIdx % regions.length],
          dealership: dealerships[pIdx % dealerships.length],
          dealerCode: `D${String(100 + pIdx).slice(0, 3)}`,
          status, passFail,
          resetCount: Math.floor(Math.random() * 2),
          delayed: false, isTimerComplete,
        });
        pIdx++;
      });
    });

    return { participants: pList, trainers, rooms };
  };

  useEffect(() => {
    setTimeout(() => {
      try {
        const data = generateMockData();
        setParticipants(data.participants);
        setTrainers(data.trainers);
        setRooms(data.rooms);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }, 600);
  }, []);

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setParticipants(prev =>
        prev.map(p => {
          if (p.status === 'completed' || p.isTimerComplete) return p;
          const newElapsed = p.elapsedTime + 1;
          if (newElapsed >= p.completionDuration) {
            const passFail = Math.random() > 0.3 ? 'Pass' : 'Fail';
            return { ...p, elapsedTime: p.completionDuration, status: 'completed', passFail, isTimerComplete: true };
          }
          return { ...p, elapsedTime: newElapsed };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  const stats = useMemo(() => {
    const total = participants.length;
    const completed = participants.filter(p => p.status === 'completed').length;
    const inProgress = participants.filter(p => p.status === 'in-progress').length;
    const passCount = participants.filter(p => p.passFail === 'Pass').length;
    const failCount = participants.filter(p => p.passFail === 'Fail').length;
    const passRate = (passCount + failCount) > 0 ? Math.round((passCount / (passCount + failCount)) * 100) : 0;
    const completedParticipants = participants.filter(p => p.status === 'completed');
    const avgTime = completedParticipants.length > 0 ?
      Math.round(completedParticipants.reduce((sum, p) => sum + p.completionDuration, 0) / completedParticipants.length) : 0;

    const trainerStats = trainers.map(t => {
      const assigned = participants.filter(p => p.trainerId === t.id);
      const completedByTrainer = assigned.filter(p => p.status === 'completed');
      const passed = assigned.filter(p => p.passFail === 'Pass');
      const avgTimePerTrainer = completedByTrainer.length > 0
        ? Math.round(completedByTrainer.reduce((sum, p) => sum + p.completionDuration, 0) / completedByTrainer.length) : 0;
      return {
        ...t, assigned: assigned.length, completed: completedByTrainer.length,
        passRate: assigned.length > 0 ? Math.round((passed.length / assigned.length) * 100) : 0,
        avgTime: avgTimePerTrainer,
      };
    });

    return { total, completed, inProgress, passCount, failCount, passRate, avgTime, trainerStats };
  }, [participants, trainers]);

  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      if (filters.agency && !p.agency?.includes(filters.agency)) return false;
      if (filters.region && !p.region?.includes(filters.region)) return false;
      if (filters.dealership && !p.dealership?.includes(filters.dealership)) return false;
      if (filters.dealerCode && !p.dealerCode?.includes(filters.dealerCode)) return false;
      return true;
    });
  }, [participants, filters]);

  const roomsData = (() => {
    const map = {};
    rooms.forEach(room => { map[room.id] = filteredParticipants.filter(p => p.octonormId === room.id); });
    return map;
  })();

  const orderedRooms = useMemo(() => {
    const qTrainer = searchTrainer.trim().toLowerCase();
    const qParticipant = searchParticipant.trim().toLowerCase();
    if (!qTrainer && !qParticipant) return rooms;

    const scored = rooms.map((room, idx) => {
      const trainer = trainers.find(t => t.id === room.trainerId);
      let score = 0;
      if (qTrainer && trainer?.name.toLowerCase().includes(qTrainer)) score += 100;
      if (qParticipant) {
        const roomParticipants = filteredParticipants.filter(p => p.octonormId === room.id);
        if (roomParticipants.some(p => p.displayName.toLowerCase().includes(qParticipant))) score += 50;
      }
      return { room, score, idx };
    });

    return scored.sort((a, b) => b.score - a.score || a.idx - b.idx).map(item => item.room);
  }, [rooms, trainers, filteredParticipants, searchTrainer, searchParticipant]);

  const matchingTrainerIds = useMemo(() => {
    if (!searchTrainer.trim()) return null;
    const q = searchTrainer.trim().toLowerCase();
    return new Set(trainers.filter(t => t.name.toLowerCase().includes(q)).map(t => t.id));
  }, [trainers, searchTrainer]);

  const displayedRooms = orderedRooms.slice(trainerPage * 5, (trainerPage + 1) * 5);
  const totalPages = Math.ceil(orderedRooms.length / 5);

  useEffect(() => { setTrainerPage(0); }, [searchTrainer, searchParticipant]);

  const participantMatchesSearch = (participant) => {
    if (!searchParticipant.trim()) return true;
    return participant.displayName.toLowerCase().includes(searchParticipant.trim().toLowerCase());
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F3F4F6]">
        <p className="text-red-600 text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F3F4F6] font-sans">

      {/* ===== TOP BAR ===== */}
      <div className="shrink-0 flex items-center justify-between gap-3 bg-white px-4 py-2 border-b border-gray-200 z-20">
        <div>
          <h1 className="text-base font-black text-indigo-900 tracking-tight flex items-center gap-2">
            SKILL CONTEST <span className="text-purple-500 font-light">/</span> COMMAND CENTER
          </h1>
          <p className="text-[11px] text-indigo-500 font-medium">Portal progress monitor</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-gray-700">LIVE · 04 Sep 2026 · 12:52 IST</span>
          </div>

          {/* ===== TOAST ON/OFF TOGGLE ===== */}
         <button
  onClick={() => setToastOn(!toastOn)}
  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${
    toastOn ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-700'
  }`}
>
  {toastOn ? 'ON' : 'OFF'}
</button>

          <button
            onClick={() => setShowAlerts(true)}
            className="relative flex items-center justify-center h-8 w-8 bg-white border border-gray-200 text-gray-600 rounded-full shadow-sm hover:shadow-md transition-all"
          >
            <Bell className="h-4 w-4" />
            {liveAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
                {liveAlerts.length}
              </span>
            )}
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full text-[11px] font-semibold shadow-sm hover:shadow-md transition-all">
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="shrink-0 bg-white px-4 py-1.5 border-b border-gray-200 shadow-sm z-10">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-indigo-900 uppercase">Date / Month</label>
            <select className="border border-gray-300 rounded px-2 py-1 text-[11px] bg-white w-26"><option>All</option></select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-indigo-900 uppercase">Zone</label>
            <select className="border border-gray-300 rounded px-2 py-1 text-[11px] bg-white w-22"><option>All</option></select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-indigo-900 uppercase">Region</label>
            <select className="border border-gray-300 rounded px-2 py-1 text-[11px] bg-white w-26"
              value={filters.region} onChange={e => setFilters({ ...filters, region: e.target.value })}>
              <option value="">All</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-indigo-900 uppercase">Trainer</label>
            <select className="border border-gray-300 rounded px-2 py-1 text-[11px] bg-white w-30"><option>All</option></select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-indigo-900 uppercase">Role</label>
            <select className="border border-gray-300 rounded px-2 py-1 text-[11px] bg-white w-22"><option>All</option></select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-indigo-900 uppercase">Agency</label>
            <select className="border border-gray-300 rounded px-2 py-1 text-[11px] bg-white w-26"
              value={filters.agency} onChange={e => setFilters({ ...filters, agency: e.target.value })}>
              <option value="">All</option>
              <option value="Agency A">Agency A</option>
              <option value="Agency B">Agency B</option>
              <option value="Agency C">Agency C</option>
            </select>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-indigo-900 uppercase">Dealer</label>
            <select className="border border-gray-300 rounded px-2 py-1 text-[11px] bg-white w-26"
              value={filters.dealerCode} onChange={e => setFilters({ ...filters, dealerCode: e.target.value })}>
              <option value="">All</option>
              {Array.from(new Set(participants.map(p => p.dealerCode))).map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto text-[11px] font-bold text-indigo-400 pb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse mr-1.5 align-middle"></span>
            Last sync 4:51 PM
          </div>
        </div>
      </div>

      {/* ===== SCROLLABLE CONTENT ===== */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* TODAY'S LIVE DATA */}
        <section className="px-3">
          <div className="flex justify-between items-end mb-1.5">
            <h2 className="text-xs font-black text-indigo-900 uppercase">TODAY'S LIVE DATA</h2>
            <span className="text-[11px] text-gray-400 font-medium">Live snapshot · 10 Sep 2026</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <div className="bg-gray-900 text-white p-3 shadow-sm border border-gray-800">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white mb-1">Scheduled</p>
              <p className="text-lg font-extrabold leading-tight">{stats.total}</p>
              <p className="text-[10px] text-white font-medium mt-0.5">Daily plan</p>
            </div>
            <div className="bg-sky-500 text-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white mb-1">Attempted</p>
              <div className="flex items-baseline gap-1">
                <p className="text-lg font-extrabold leading-tight">{stats.completed + stats.inProgress}</p>
                <p className="text-[11px] font-semibold text-white">/ {stats.total}</p>
              </div>
              <div className="flex justify-between text-[10px] text-white font-medium mt-0.5">
                <span>{stats.inProgress} in prog</span>
                <span>{stats.completed} comp</span>
              </div>
            </div>
            <div className="bg-rose-500 text-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white mb-1">Absentees</p>
              <p className="text-lg font-extrabold leading-tight">34</p>
              <p className="text-[10px] text-white font-medium mt-0.5">18.5% of schedule</p>
            </div>
            <div className="bg-orange-500 text-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white mb-1">Delayed</p>
              <p className="text-lg font-extrabold leading-tight">17</p>
              <p className="text-[10px] text-white font-medium mt-0.5">9 follow-ups</p>
            </div>
            <div className="bg-purple-600 text-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white mb-1">Pass Rate</p>
              <p className="text-lg font-extrabold leading-tight">{stats.passRate}%</p>
              <p className="text-[10px] text-white font-medium mt-0.5">+4 pts today</p>
            </div>
            <div className="bg-teal-500 text-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white mb-1">Avg Time</p>
              <p className="text-lg font-extrabold leading-tight">{formatElapsedTime(stats.avgTime)}</p>
              <p className="text-[10px] text-white font-medium mt-0.5">Per participant</p>
            </div>
            <div className="bg-emerald-500 text-white p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white mb-1">Active Trainers</p>
              <p className="text-lg font-extrabold leading-tight">10 / 10</p>
              <p className="text-[10px] text-white font-medium mt-0.5">6 ready · 4 occupied</p>
            </div>
          </div>
        </section>

        {/* REGION-WISE SUMMARY */}
        <section className="px-3">
          <h2 className="text-xs font-black text-indigo-900 uppercase mb-0.5">REGION-WISE SUMMARY</h2>
          <p className="text-[11px] text-gray-500 mb-1.5 font-medium">North selected · switch zone to refresh the regions below</p>
          <div className="flex gap-1.5 mb-1.5">
            {['NORTH', 'EAST', 'WEST', 'SOUTH', 'CENTRAL'].map(zone => (
              <button key={zone} className={`px-4 py-0.5 text-[11px] font-bold rounded transition ${zone === 'NORTH' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                {zone}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { name: 'NORTH–1', completed: 72, pass: '86%', avg: '19m', border: 'border-purple-500' },
              { name: 'NORTH–2', completed: 68, pass: '82%', avg: '21m', border: 'border-sky-500' },
              { name: 'NORTH–3', completed: 61, pass: '78%', avg: '24m', border: 'border-emerald-500' },
              { name: 'NORTH–4', completed: 54, pass: '74%', avg: '27m', border: 'border-orange-500' },
            ].map((region) => (
              <div key={region.name} className={`bg-white text-black shadow-sm border-2 ${region.border} p-3 text-center`}>
                <h3 className="font-bold text-[12px] mb-1">{region.name}</h3>
                <p className="text-[10px] font-semibold">{region.completed} completed</p>
                <p className="text-[12px] font-medium mt-0.5">{region.pass} pass · {region.avg} avg</p>
              </div>
            ))}
          </div>
        </section>

        {/* TRAINERS SUMMARY */}
        <section className="px-3">
          <div className="flex justify-between items-end mb-1.5">
            <h2 className="text-xs font-black text-indigo-900 uppercase">TRAINERS SUMMARY</h2>
            <span className="text-[11px] text-indigo-400 font-bold cursor-pointer hover:text-indigo-600 transition">Click a trainer to open journey</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {stats.trainerStats.slice(0, 5).map(t => (
              <div key={t.id} className="bg-white shadow-sm border border-gray-100 p-3 hover:shadow-md transition cursor-pointer"
                onClick={() => { setSelectedTrainer(t); setShowTrainerJourney(true); }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <img
                    src={t.photoUrl}
                    alt={t.name}
                    className="shrink-0 w-9 h-9 rounded-full object-cover ring-2 ring-gray-100"
                    loading="lazy"
                    onError={(e) => { e.target.src = FALLBACK_TRAINER_PHOTO; }}
                  />
                  <h3 className="font-bold text-black text-[11px] tracking-wide truncate">{t.name.toUpperCase()}</h3>
                </div>
                <p className="text-[11px] font-semibold text-black">{t.completed} completed</p>
                <p className="text-[11px] text-black font-medium mt-0.5">{t.passRate}% pass · {formatElapsedTime(t.avgTime)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CONTEST TOTALS */}
        <section className="px-3">
          <div className="flex justify-between items-end mb-1.5">
            <h2 className="text-xs font-black text-indigo-900 uppercase">CONTEST TOTALS</h2>
            <span className="text-[11px] text-gray-400 font-medium">All dates · all zones</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <div className="bg-white shadow-sm border-2 border-gray-900 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Total Scheduled</p>
              <p className="text-sm font-extrabold text-gray-800 leading-tight">{stats.total}</p>
              <p className="text-[10px] text-black font-medium mt-0.5">100% registered</p>
            </div>
            <div className="bg-white shadow-sm border-2 border-sky-500 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600 mb-1">Total Attempted</p>
              <p className="text-sm font-extrabold text-sky-700 leading-tight">{stats.completed + stats.inProgress}</p>
              <p className="text-[10px] text-black font-medium mt-0.5">{stats.inProgress} in prog · {stats.completed} comp</p>
            </div>
            <div className="bg-white shadow-sm border-2 border-rose-500 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-1">Total Absentees</p>
              <p className="text-sm font-extrabold text-rose-700 leading-tight">269</p>
              <p className="text-[10px] text-black font-medium mt-0.5">21.6% not attempted</p>
            </div>
            <div className="bg-white shadow-sm border-2 border-orange-500 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 mb-1">Total Delayed</p>
              <p className="text-sm font-extrabold text-orange-700 leading-tight">57</p>
              <p className="text-[10px] text-black font-medium mt-0.5">4.6% need action</p>
            </div>
            <div className="bg-white shadow-sm border-2 border-pink-500 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-pink-600 mb-1">Total Resets</p>
              <p className="text-sm font-extrabold text-pink-700 leading-tight">23</p>
              <p className="text-[10px] text-black font-medium mt-0.5">1.8% reset rate</p>
            </div>
            <div className="bg-white shadow-sm border-2 border-purple-600 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-1">Overall Pass</p>
              <p className="text-sm font-extrabold text-purple-700 leading-tight">{stats.passRate}%</p>
              <p className="text-[10px] text-black font-medium mt-0.5">Goal 80%</p>
            </div>
            <div className="bg-white shadow-sm border-2 border-teal-500 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-1">Overall Avg Time</p>
              <p className="text-sm font-extrabold text-teal-700 leading-tight">{formatElapsedTime(stats.avgTime)}</p>
              <p className="text-[10px] text-black font-medium mt-0.5">Per participant</p>
            </div>
          </div>
        </section>

        {/* LIVE SCHEDULE GRID */}
        <section className="px-3">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 mb-2">
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight">TRAINER SCHEDULE <span className="text-gray-400 font-light">/</span> ROUND 2</h1>
              <p className="text-[11px] text-gray-500 font-medium">Trainer metrics are merged into each column header</p>
              <p className="text-[11px] text-gray-400">Grid combines trainer output, participant state, and scheduled capacity in one operational view</p>
            </div>
            <div className="flex items-center gap-5 bg-white border border-gray-200 px-5 py-2.5 shadow-sm min-w-[250px]">
              <div className="text-center">
                <p className="text-[10px] font-bold text-black uppercase tracking-wider mb-0.5">Attempted</p>
                <p className="text-2xl font-extrabold text-blue-600 leading-none">{stats.completed + stats.inProgress}</p>
              </div>
              <div className="text-[11px] text-gray-500 font-medium space-y-0.5 border-l border-gray-100 pl-4">
                <p>Absentees <span className="font-bold text-gray-700">34</span></p>
                <p>In Progress <span className="font-bold text-gray-700">{stats.inProgress}</span></p>
                <p>Completed <span className="font-bold text-gray-700">{stats.completed}</span></p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-purple-600">Availability is indicated by header color only</p>
            </div>
          </div>

          {/* SEARCH INPUTS */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search trainer..."
                value={searchTrainer}
                onChange={(e) => setSearchTrainer(e.target.value)}
                className="pl-8 pr-7 py-1.5 text-[11px] font-medium border border-gray-300 rounded-md bg-white w-52 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
              />
              {searchTrainer && (
                <button onClick={() => setSearchTrainer('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search participant..."
                value={searchParticipant}
                onChange={(e) => setSearchParticipant(e.target.value)}
                className="pl-8 pr-7 py-1.5 text-[11px] font-medium border border-gray-300 rounded-md bg-white w-52 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
              />
              {searchParticipant && (
                <button onClick={() => setSearchParticipant('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {(searchTrainer || searchParticipant) && (
              <button
                onClick={() => { setSearchTrainer(''); setSearchParticipant(''); }}
                className="ml-auto text-[10px] font-bold text-indigo-500 hover:text-indigo-700 transition"
              >
                Clear search
              </button>
            )}
          </div>

          <div className="flex items-start gap-1">
            <div className="shrink-0 h-[60px] flex items-center">
              <button
                onClick={() => setTrainerPage(p => Math.max(0, p - 1))}
                disabled={trainerPage === 0}
                className={`flex items-center justify-center h-9 w-6 rounded transition ${trainerPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-purple-600 hover:scale-125'}`}
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-x-auto bg-white shadow-sm border border-gray-200">
              <div className="grid grid-cols-[85px_repeat(5,1fr)] min-w-[820px]">
                <div className="bg-[#1A202C] text-white p-2 flex items-center justify-center text-[11px] font-bold tracking-wider border-r border-gray-700">
                  TIME
                </div>
                {displayedRooms.map((room) => {
                  const trainer = trainers.find(t => t.id === room.trainerId);
                  const tStat = stats.trainerStats.find(t => t.id === trainer?.id);
                  const isAvailable = (trainer?.availability === 'available');
                  const dotColor = isAvailable ? 'bg-emerald-400' : 'bg-amber-400';
                  const isTrainerMatch = matchingTrainerIds ? matchingTrainerIds.has(trainer?.id) : false;
                  const trainerDimmed = matchingTrainerIds && !isTrainerMatch;

                  return (
                    <div
                      key={room.id}
                      className={`bg-[#1A202C] text-white p-2 border-r border-gray-700 last:border-r-0 cursor-pointer hover:bg-[#2D3748] transition-all ${isTrainerMatch && searchTrainer.trim() ? 'ring-2 ring-purple-400 ring-inset' : ''} ${trainerDimmed ? 'opacity-25' : ''}`}
                      onClick={() => { setSelectedTrainer(trainer); setShowTrainerJourney(true); }}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <img
                          src={trainer?.photoUrl}
                          alt={trainer?.name}
                          className="shrink-0 w-8 h-8 rounded-full object-cover ring-1 ring-white/30"
                          loading="lazy"
                          onError={(e) => { e.target.src = FALLBACK_TRAINER_PHOTO; }}
                        />
                        <span className="text-[11px] font-bold truncate flex-1">{trainer?.name}</span>
                        <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
                      </div>
                      <div className="text-[10px] text-gray-300 font-medium">
                        <p>{tStat?.completed || 0} / {tStat?.assigned || 0} completed · {tStat?.passRate || 0}% pass</p>
                        <p>{formatElapsedTime(tStat?.avgTime || 0)} avg / participant</p>
                      </div>
                    </div>
                  );
                })}

                {TIME_SLOTS.map((timeLabel, rowIdx) => (
                  <React.Fragment key={`row-${rowIdx}`}>
                    <div className="bg-gray-100 border border-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-800 py-2">
                      {timeLabel}
                    </div>

                    {displayedRooms.map(room => {
                      const participant = roomsData[room.id]?.find(p => p.timeSlotTime === timeLabel) || null;
                      const trainerDimmed = matchingTrainerIds && !matchingTrainerIds.has(room.trainerId);

                      if (!participant) {
                        return (
                          <div key={`${room.id}-${rowIdx}`} className={`border border-gray-200 bg-white p-2 flex items-center justify-center min-h-[52px] ${trainerDimmed ? 'opacity-25' : ''}`}>
                            <span className="text-gray-300 text-[11px]">—</span>
                          </div>
                        );
                      }

                      const matchesParticipant = participantMatchesSearch(participant);
                      const dimmed = searchParticipant.trim() && !matchesParticipant;

                      let statusText = 'IN PROGRESS';
                      let statusColor = 'text-purple-600';
                      let borderColor = 'border-l-purple-600';

                      if (participant.status === 'completed') {
                        statusText = 'COMPLETED';
                        statusColor = 'text-emerald-500';
                        borderColor = 'border-l-emerald-500';
                      }

                      return (
                        <div
                          key={`${room.id}-${rowIdx}`}
                          className={`border border-gray-200 bg-white p-2 flex flex-col justify-center min-h-[52px] border-l-4 ${borderColor} hover:bg-gray-50 transition-all cursor-pointer ${(dimmed || trainerDimmed) ? 'opacity-25' : ''} ${matchesParticipant && searchParticipant.trim() ? 'ring-2 ring-emerald-400 ring-inset' : ''}`}
                          onClick={() => { setSelectedParticipant(participant); setShowParticipantJourney(true); }}
                        >
                          <div className="text-[11px] font-bold text-gray-800 leading-tight">{participant.displayName}</div>
                          <div className="text-[10px] text-gray-500 font-medium leading-tight">{participant.empId} · {participant.role}</div>
                          <div className={`text-[10px] font-bold tracking-wider leading-tight ${statusColor}`}>
                            {statusText}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="shrink-0 h-[60px] flex items-center">
              <button
                onClick={() => setTrainerPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={trainerPage >= totalPages - 1}
                className={`flex items-center justify-center h-9 w-6 rounded transition ${trainerPage >= totalPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-purple-600 hover:scale-125'}`}
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* FOOTER */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between z-20">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">PARTICIPANT</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-medium text-gray-700">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
              <span className="text-[11px] font-medium text-gray-700">In progress</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">TRAINER AVAILABILITY</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-medium text-gray-700">Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-[11px] font-medium text-gray-700">Occupied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-[11px] font-medium text-gray-700">Offline</span>
            </div>
          </div>
        </div>
        <div className="text-[11px] font-medium text-gray-500">Skill Contest Portal</div>
      </div>

      {/* TRAINER JOURNEY POPUP */}
      {showTrainerJourney && selectedTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg overflow-hidden bg-white shadow-2xl">
            <div className="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedTrainer.photoUrl}
                  alt={selectedTrainer.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white/40 shadow-md"
                  onError={(e) => { e.target.src = FALLBACK_TRAINER_PHOTO; }}
                />
                <div>
                  <p className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">TRAINER JOURNEY</p>
                  <h2 className="text-lg font-bold text-white mt-0.5">{selectedTrainer.name}</h2>
                  <p className="text-[11px] text-purple-200 font-medium">Sales · North</p>
                </div>
              </div>
              <button onClick={() => { setShowTrainerJourney(false); setSelectedTrainer(null); }} className="text-white/70 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3 px-5 py-2.5 border-b border-gray-100">
              <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned</p><p className="text-lg font-extrabold text-gray-900 mt-0.5">9</p></div>
              <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completed</p><p className="text-lg font-extrabold text-gray-900 mt-0.5">5</p></div>
              <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delayed</p><p className="text-lg font-extrabold text-gray-900 mt-0.5">1</p></div>
              <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pass Rate</p><p className="text-lg font-extrabold text-gray-900 mt-0.5">88%</p></div>
              <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Time</p><p className="text-lg font-extrabold text-gray-900 mt-0.5">17m 42s</p></div>
            </div>
            <div className="px-5 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">Round Milestones</h3>
                <span className="text-[11px] font-medium text-gray-500">5 / 9 complete</span>
              </div>
              <div className="flex items-center justify-between gap-1.5">
                {[
                  { label: 'R1', value: '1/1', status: 'DONE', color: 'bg-teal-500' },
                  { label: 'R2', value: '1/1', status: 'DONE', color: 'bg-teal-500' },
                  { label: 'R3', value: '1/1', status: 'LATE', color: 'bg-orange-500' },
                  { label: 'R4', value: '1/1', status: 'LIVE', color: 'bg-purple-600' },
                  { label: 'R5', value: '1/1', status: 'DONE', color: 'bg-teal-500' },
                ].map((round, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-0.5 flex-1">
                    <div className={`w-full py-1.5 rounded text-center text-[11px] font-bold text-white ${round.color}`}>{round.label}</div>
                    <span className="text-[10px] font-bold text-gray-700">{round.value}</span>
                    <span className={`text-[9px] font-bold ${round.status === 'LATE' ? 'text-orange-500' : round.status === 'LIVE' ? 'text-purple-600' : 'text-teal-600'}`}>{round.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100">
              <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-1.5">Recent Assessments</h3>
              <div className="space-y-1.5">
                {[
                  { time: '09:00', name: 'Ayush Raj', score: '82%', status: 'PASSED' },
                  { time: '10:00', name: 'Danish Ahamad', score: '86%', status: 'PASSED' },
                  { time: '11:00', name: 'Gulshan Kumar', score: '68%', status: 'IN PROGRESS' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium w-10">{item.time}</span>
                      <span className="text-gray-800 font-semibold">{item.name}</span>
                      <span className="text-gray-500">·</span>
                      <span className="text-gray-600 font-medium">{item.score}</span>
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider ${item.status === 'PASSED' ? 'text-teal-600' : 'text-purple-600'}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 pb-1.5">
              <div className="bg-amber-50 border border-amber-200 rounded p-1.5 text-[11px] font-medium text-amber-800">
                <strong>ATTENTION</strong> · 2 assessments started more than 15 minutes late
              </div>
            </div>
            <div className="px-5 py-1.5 text-[10px] text-gray-400 font-medium">Last activity · 10:34 IST</div>
          </div>
        </div>
      )}

      {/* PARTICIPANT JOURNEY POPUP */}
      {showParticipantJourney && selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg overflow-hidden bg-white shadow-2xl">
            <div className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-teal-100 uppercase tracking-wider">PARTICIPANT JOURNEY</p>
                <h2 className="text-lg font-bold text-white mt-0.5">{selectedParticipant.displayName}</h2>
                <p className="text-[11px] text-teal-100 font-medium">{selectedParticipant.empId} · {selectedParticipant.role}</p>
              </div>
              <button onClick={() => { setShowParticipantJourney(false); setSelectedParticipant(null); }} className="text-white/70 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 px-5 py-2.5 border-b border-gray-100">
              <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rounds</p><p className="text-lg font-extrabold text-gray-900 mt-0.5">3 / 5</p></div>
              <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Score</p><p className="text-lg font-extrabold text-gray-900 mt-0.5">78%</p></div>
              <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Time</p><p className="text-lg font-extrabold text-gray-900 mt-0.5">52m</p></div>
              <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Flags</p><p className="text-lg font-extrabold text-gray-900 mt-0.5">1</p></div>
            </div>
            <div className="px-5 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">Assessment Milestones</h3>
                <span className="text-[11px] font-medium text-gray-500">Next · 14:30</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { round: 'R1', trainer: 'Pooja Bora', detail: '82%', status: 'PASSED', color: 'bg-teal-500' },
                  { round: 'R2', trainer: 'Meharban singh Bhatia', detail: '76%', status: 'PASSED', color: 'bg-teal-500' },
                  { round: 'R3', trainer: 'Imtiyaz syed', detail: '77%', status: 'PASSED', color: 'bg-orange-500' },
                  { round: 'R4', trainer: 'Mihir Zaveri', detail: '14:30', status: 'SCHEDULED', color: 'bg-purple-600' },
                  { round: 'R5', trainer: 'Trainer not assigned', detail: '', status: 'PENDING', color: 'bg-teal-500' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded text-center flex items-center justify-center text-[10px] font-bold text-white ${item.color}`}>{item.round}</div>
                      <span className="text-[11px] text-gray-800 font-medium">{item.trainer}</span>
                      {item.detail && <span className="text-[11px] text-gray-500">· {item.detail}</span>}
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider ${item.status === 'PASSED' ? 'text-teal-600' : item.status === 'SCHEDULED' ? 'text-orange-500' : 'text-gray-400'}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 pb-1.5">
              <div className="bg-amber-50 border border-amber-200 rounded p-1.5 text-[11px] font-medium text-amber-800">
                <strong>FLAG</strong> · ID check pending before Round 4
              </div>
            </div>
            <div className="px-5 py-1.5 text-[10px] text-gray-400 font-medium">Last activity · 10:34 IST</div>
          </div>
        </div>
      )}

      {/* ALERTS MODAL */}
      {showAlerts && (
        <div className="fixed inset-0 z-50" onClick={() => setShowAlerts(false)}>
          <div
            className="absolute top-16 right-4 w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">Notifications</h2>
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {liveAlerts.length}
                </span>
              </div>
              <button onClick={() => setShowAlerts(false)} className="text-gray-400 hover:text-gray-700 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-2 overflow-y-auto flex-1">
              {liveAlerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                  <div className="relative shrink-0">
                    <img
                      src={alert.photoUrl}
                      alt={alert.title}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                      onError={(e) => { e.target.src = FALLBACK_TRAINER_PHOTO; }}
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 leading-snug truncate">{alert.title}</p>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">{alert.subtitle}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
    <Toaster enabled={toastOn} />

    </div>
  );
}