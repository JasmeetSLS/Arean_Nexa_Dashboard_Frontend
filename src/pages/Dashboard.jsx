import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Bell, LogOut, ArrowLeft, ArrowRight, ArrowUp, ArrowDown
} from 'lucide-react';
import { Toaster } from '../components/Toaster.jsx';
import { FaBell, FaBellSlash } from 'react-icons/fa';
import {
  getDashboard,
  getGridTrainer,
  getGridParticipant,
  getFilters,
} from '../service/api.js';
import { useAuth } from '../service/auth.jsx';
import ChatBot from './ChatBot.jsx';

const FALLBACK_TRAINER_PHOTO = '/trainers/1.jpeg';
const GRID_LIMIT   = 5;
const REGION_LIMIT = 4;

export default function Dashboard() {
  const { user, logout } = useAuth();

  // Filters State (project is now a filter)
  const [filters, setFilters] = useState({
    project: '', date: '', zone: '', region: '', dealerName: '', dealerCode: '', trainer: '', role: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    projects: [], dates: [], zones: [], regions: [], dealerNames: [], dealerCodes: [], trainers: [], roles: []
  });

  // Grid State
  const [trainers, setTrainers]             = useState([]);
  const [availableRounds, setAvailableRounds] = useState([]); 
  const [trainerPages, setTrainerPages]     = useState(1);
  const [trainerPage, setTrainerPage]       = useState(0);
  
  // Participant Pagination State
  const [participantPage, setParticipantPage] = useState(0); 
  const [trainerParticipants, setTrainerParticipants] = useState({});
  
  // Dashboard State
  const [dashData, setDashData]       = useState(null);
  const [regionPage, setRegionPage]   = useState(0);

  // Modals
  const [selectedTrainer, setSelectedTrainer]               = useState(null);
  const [showTrainerJourney, setShowTrainerJourney]         = useState(false);
  const [selectedParticipant, setSelectedParticipant]       = useState(null);
  const [showParticipantJourney, setShowParticipantJourney] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [toastOn, setToastOn]       = useState(false);

  // Reset pages and sub-filters on project change
  useEffect(() => { 
    setTrainerPage(0); 
    setParticipantPage(0);
    setRegionPage(0);
    setFilters(prev => ({ ...prev, date: '', zone: '', region: '', dealerName: '', dealerCode: '', trainer: '', role: '' }));
  }, [filters.project]);

  // 1. Fetch Filter Options (Cascading & Initial Load)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await getFilters({
          project: filters.project,
          zone: filters.zone,
          region: filters.region,
          dealerName: filters.dealerName
        });
        
        if (data?.success) {
          setFilterOptions(prev => ({
            ...prev,
            projects: data.projects || prev.projects,
            dates: data.dates || [],
            zones: data.zones || [],
            regions: data.regions || [],
            dealerNames: data.dealerNames || [],
            dealerCodes: data.dealerCodes || [],
            trainers: data.trainers || [],
            roles: data.roles || [],
          }));

          // Auto-select first project if none selected
          if (!filters.project && data.projects?.length > 0) {
            setFilters(prev => ({ ...prev, project: data.projects[0].project_name }));
          }
        }
      } catch (err) { console.error('Filter fetch failed:', err); }
    })();
  }, [filters.project, filters.zone, filters.region, filters.dealerName]);

  // 2. Fetch Dashboard API
  useEffect(() => {
    if (!filters.project) return;
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await getDashboard({ 
          ...filters,
          regionPage, 
          regionLimit: REGION_LIMIT,
        });
        if (!cancelled && data?.success) setDashData(data);
      } catch (err) { console.error(err); }
    };

    load();

    return () => { cancelled = true; };
  }, [filters, regionPage]);

  // 3. Fetch Trainers + Participants
  useEffect(() => {
    if (!filters.project) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        
        const { data: tData } = await getGridTrainer({ 
          ...filters,
          page: trainerPage, 
          limit: GRID_LIMIT,
        });
        if (!tData?.success) return;
        
        const fetchedTrainers = tData.trainers || [];
        setTrainers(fetchedTrainers);
        setAvailableRounds(tData.rounds || []); 
        setTrainerPages(tData.pagination?.totalPages || 1);
        setError(null);

        const { data: pData } = await getGridParticipant({ 
          ...filters,
          page: trainerPage, 
          limit: GRID_LIMIT,
          participantPage: participantPage,
        });
        
        if (pData?.success) {
          const pMap = {};
          fetchedTrainers.forEach(t => { pMap[t.id] = []; });
          
          (pData.participants || []).forEach(p => {
            if (pMap[p.trainerId]) {
              pMap[p.trainerId].push(p);
            }
          });

          if (!cancelled) setTrainerParticipants(pMap);
        }
        
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => { cancelled = true; };
  }, [filters, trainerPage, participantPage]);

  const regionSummary     = dashData?.regionSummary || [];
  const regionPagination  = dashData?.regionPagination || { page: 0, totalPages: 1, total: 0, limit: REGION_LIMIT };
  const totalRegionPages  = regionPagination.totalPages;

  const gridStats = useMemo(() => {
    const allP = Object.values(trainerParticipants).flat();
    return {
      total: allP.length,
      completedCount: allP.filter(p => p.roundsStatus === 'Completed').length,
      inProgressCount: allP.filter(p => p.roundsStatus === 'In Progress').length,
    };
  }, [trainerParticipants]);

  if (loading && trainers.length === 0 && !filters.project) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F3F4F6] font-sans">
      {/* TOP BAR */}
      <div className="shrink-0 flex items-center justify-between gap-3 bg-white px-4 py-2 border-b border-gray-200 z-20">
        <div>
          <h1 className="text-lg font-black text-indigo-900 tracking-tight flex items-center gap-2">
            SKILL CONTEST <span className="text-purple-500 font-light">/</span> COMMAND CENTER
          </h1>
          <p className="text-xs font-semibold text-indigo-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Logged in as <span className="font-bold text-purple-600">{user?.username || 'Unknown'}</span>
            {filters.project && (
              <>
                <span className="mx-1 text-gray-300">·</span>
                <span className="font-bold text-indigo-700">{filters.project}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold text-gray-700">DATA · {dashData?.todayLive?.date || '—'}</span>
          </div>
          <button onClick={() => setToastOn(!toastOn)}
            className={`flex items-center justify-center h-8 w-8 rounded-full border transition ${toastOn ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-400 hover:shadow-md'}`}>
            {toastOn ? <FaBell className="h-4 w-4" /> : <FaBellSlash className="h-4 w-4" />}
          </button>
          <button onClick={() => setShowAlerts(true)}
            className="relative flex items-center justify-center h-8 w-8 bg-white border border-gray-200 text-gray-600 rounded-full shadow-sm hover:shadow-md transition-all">
            <Bell className="h-4 w-4" />
          </button>
          <button onClick={logout}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-semibold shadow-sm hover:shadow-md transition-all">
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="shrink-0 bg-white px-4 py-1.5 border-b border-gray-200 shadow-sm z-10">
        <div className="flex flex-wrap items-end gap-2">
          
          {/* Project */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-bold text-indigo-900 uppercase">Project</label>
            <select value={filters.project} onChange={(e) => setFilters({...filters, project: e.target.value})}
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white w-36 font-semibold text-indigo-700">
              {filterOptions.projects.map(p => <option key={p.id} value={p.project_name}>{p.name}</option>)}
            </select>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-bold text-indigo-900 uppercase">Date</label>
            <select value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})}
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white w-32">
              <option value="">All</option>
              {filterOptions.dates.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Zone */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-bold text-indigo-900 uppercase">Zone</label>
            <select value={filters.zone} onChange={(e) => {
              setFilters({...filters, zone: e.target.value, region: '', dealerName: '', dealerCode: ''});
            }} className="border border-gray-300 rounded px-2 py-1 text-xs bg-white w-24">
              <option value="">All</option>
              {filterOptions.zones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          {/* Region */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-bold text-indigo-900 uppercase">Region</label>
            <select value={filters.region} onChange={(e) => {
              setFilters({...filters, region: e.target.value, dealerName: '', dealerCode: ''});
            }} className="border border-gray-300 rounded px-2 py-1 text-xs bg-white w-28">
              <option value="">All</option>
              {filterOptions.regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Dealer Name */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-bold text-indigo-900 uppercase">Dealer Name</label>
            <select value={filters.dealerName} onChange={(e) => {
              setFilters({...filters, dealerName: e.target.value, dealerCode: ''});
            }} className="border border-gray-300 rounded px-2 py-1 text-xs bg-white w-44">
              <option value="">All</option>
              {filterOptions.dealerNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Dealer Code */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-bold text-indigo-900 uppercase">Dealer Code</label>
            <select value={filters.dealerCode} onChange={(e) => setFilters({...filters, dealerCode: e.target.value})}
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white w-32">
              <option value="">All</option>
              {filterOptions.dealerCodes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Trainer */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-bold text-indigo-900 uppercase">Trainer</label>
            <select value={filters.trainer} onChange={(e) => setFilters({...filters, trainer: e.target.value})}
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white w-32">
              <option value="">All</option>
              {filterOptions.trainers.map(t => <option key={t.id} value={t.username}>{t.name}</option>)}
            </select>
          </div>

          {/* Role */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-bold text-indigo-900 uppercase">Role</label>
            <select value={filters.role} onChange={(e) => setFilters({...filters, role: e.target.value})}
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white w-24">
              <option value="">All</option>
              {filterOptions.roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="ml-auto text-xs font-bold text-indigo-400 pb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mr-1.5 align-middle"></span>
            Manual refresh required
          </div>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* TODAY'S LIVE DATA */}
        <section className="px-3">
          <div className="flex justify-between items-end mb-1.5">
            <h2 className="text-sm font-black text-indigo-900 uppercase">
              TODAY'S LIVE DATA {filters.project && `· ${filters.project}`}
            </h2>
            <span className="text-xs text-gray-400 font-medium">Snapshot · {dashData?.todayLive?.date || '—'}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <div className="bg-gray-900 text-white p-3 shadow-sm border border-gray-800">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1">Scheduled</p>
              <p className="text-xl font-extrabold leading-tight">{dashData?.todayLive?.scheduled ?? 0}</p>
              <p className="text-[11px] font-medium mt-0.5">Daily plan</p>
            </div>
            <div className="bg-sky-500 text-white p-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1">Attempted</p>
              <p className="text-xl font-extrabold leading-tight">{dashData?.todayLive?.attempted ?? 0}</p>
              <div className="flex justify-between text-[11px] font-medium mt-0.5">
                <span>{dashData?.todayLive?.inProgress ?? 0} in prog</span>
                <span>{dashData?.todayLive?.completed ?? 0} comp</span>
              </div>
            </div>
            <div className="bg-rose-500 text-white p-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1">Absentees</p>
              <p className="text-xl font-extrabold leading-tight">{dashData?.todayLive?.absentees ?? 0}</p>
              <p className="text-[11px] font-medium mt-0.5">No round started</p>
            </div>
            <div className="bg-orange-500 text-white p-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1">Delayed</p>
              <p className="text-xl font-extrabold leading-tight">{dashData?.todayLive?.delayed ?? 0}</p>
              <p className="text-[11px] font-medium mt-0.5">Follow-ups</p>
            </div>
            <div className="bg-purple-600 text-white p-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1">Pass Rate</p>
              <p className="text-xl font-extrabold leading-tight">{dashData?.todayLive?.passRate ?? 0}%</p>
              <p className="text-[11px] font-medium mt-0.5">Today</p>
            </div>
            <div className="bg-teal-500 text-white p-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1">Avg Time</p>
              <p className="text-xl font-extrabold leading-tight">{dashData?.todayLive?.avgTime ?? '00:00:00'}</p>
              <p className="text-[11px] font-medium mt-0.5">Per participant</p>
            </div>
            <div className="bg-emerald-500 text-white p-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1">Active Trainers</p>
              <p className="text-xl font-extrabold leading-tight">{dashData?.todayLive?.activeTrainers ?? 0}</p>
              <p className="text-[11px] font-medium mt-0.5">Live</p>
            </div>
          </div>
        </section>

        {/* REGIONS */}
        <section className="px-3">
          <div className="flex justify-between items-end mb-1.5">
            <h2 className="text-sm font-black text-indigo-900 uppercase">REGION-WISE SUMMARY</h2>
            <span className="text-xs text-gray-400 font-medium">{regionPagination.total} regions · lifetime</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="shrink-0 h-[100px] flex items-center">
              <button onClick={() => setRegionPage(p => Math.max(0, p - 1))} disabled={regionPage === 0}
                className={`flex items-center justify-center h-9 w-6 rounded transition ${regionPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-purple-600 hover:scale-125'}`}>
                <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {regionSummary.map((r, idx) => (
                  <div key={`${r?.region || 'x'}|${r?.zone || 'x'}|${idx}`} className="bg-white text-black shadow-sm border-2 border-purple-500 p-3 text-center">
                    <h3 className="font-bold text-sm mb-1">{r?.region || '—'} – {r?.zone || '—'}</h3>
                    <p className="text-xs font-semibold">{r?.completed ?? 0} completed</p>
                    <p className="text-sm font-medium mt-0.5">{r?.passRate ?? 0}% pass · {r?.avgTime ?? '00:00:00'} avg</p>
                  </div>
                ))}
                {regionSummary.length === 0 && (
                  <div className="col-span-4 text-center text-xs text-gray-400 py-4">No region data available.</div>
                )}
              </div>
            </div>
            <div className="shrink-0 h-[100px] flex items-center">
              <button onClick={() => setRegionPage(p => Math.min(totalRegionPages - 1, p + 1))} disabled={regionPage >= totalRegionPages - 1}
                className={`flex items-center justify-center h-9 w-6 rounded transition ${regionPage >= totalRegionPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-purple-600 hover:scale-125'}`}>
                <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          <div className="flex justify-center mt-2 text-[11px] text-gray-400 font-medium">
            Page {regionPage + 1} of {totalRegionPages}
          </div>
        </section>

        {/* TRAINERS SUMMARY */}
        <section className="px-3">
          <div className="flex justify-between items-end mb-1.5">
            <h2 className="text-sm font-black text-indigo-900 uppercase">TRAINERS SUMMARY</h2>
            <span className="text-xs text-indigo-400 font-bold cursor-pointer hover:text-indigo-600 transition">
              Click a trainer to open journey
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="shrink-0 h-[110px] flex items-center">
              <button onClick={() => setTrainerPage(p => Math.max(0, p - 1))} disabled={trainerPage === 0}
                className={`flex items-center justify-center h-9 w-6 rounded transition ${trainerPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-purple-600 hover:scale-125'}`}>
                <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {trainers.map((t, idx) => (
                  <div
                    key={t?.id ?? idx}
                    className="bg-white shadow-sm border border-gray-100 p-3 hover:shadow-md transition cursor-pointer"
                    onClick={() => { setSelectedTrainer(t); setShowTrainerJourney(true); }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <img
                        src={t?.photoUrl || FALLBACK_TRAINER_PHOTO}
                        alt={t?.name || ''}
                        className="shrink-0 w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                        loading="lazy"
                        onError={(e) => { e.target.src = FALLBACK_TRAINER_PHOTO; }}
                      />
                      <h3 className="font-bold text-black text-xs tracking-wide truncate">
                        {String(t?.name || '—').toUpperCase()}
                      </h3>
                    </div>
                    <p className="text-xs font-semibold text-black">{t?.totalAssigned ?? 0} assigned</p>
                    <p className="text-xs text-black font-medium mt-0.5">
                      {t?.passPercentage ?? 0}% pass · {t?.avgTime ?? '00:00:00'}
                    </p>
                  </div>
                ))}
                {trainers.length === 0 && (
                  <div className="col-span-5 text-center text-xs text-gray-400 py-4">
                    No trainer data available.
                  </div>
                )}
              </div>
            </div>
            <div className="shrink-0 h-[110px] flex items-center">
              <button onClick={() => setTrainerPage(p => Math.min(trainerPages - 1, p + 1))} disabled={trainerPage >= trainerPages - 1}
                className={`flex items-center justify-center h-9 w-6 rounded transition ${trainerPage >= trainerPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-purple-600 hover:scale-125'}`}>
                <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          <div className="flex justify-center mt-2 text-[11px] text-gray-400 font-medium">
            Page {trainerPage + 1}
          </div>
        </section>

        {/* CONTEST TOTALS */}
        <section className="px-3">
          <div className="flex justify-between items-end mb-1.5">
            <h2 className="text-sm font-black text-indigo-900 uppercase">CONTEST TOTALS</h2>
            <span className="text-xs text-gray-400 font-medium">{filters.project ? filters.project : 'All projects'}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <div className="bg-white shadow-sm border-2 border-gray-900 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Total Scheduled</p>
              <p className="text-base font-extrabold text-gray-800 leading-tight">{dashData?.contestTotals?.totalScheduled ?? 0}</p>
              <p className="text-[11px] text-black font-medium mt-0.5">100% registered</p>
            </div>
            <div className="bg-white shadow-sm border-2 border-sky-500 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600 mb-1">Total Attempted</p>
              <p className="text-base font-extrabold text-sky-700 leading-tight">{dashData?.contestTotals?.totalAttempted ?? 0}</p>
              <p className="text-[11px] text-black font-medium mt-0.5">
                {dashData?.contestTotals?.inProgress ?? 0} in prog · {dashData?.contestTotals?.completed ?? 0} comp
              </p>
            </div>
            <div className="bg-white shadow-sm border-2 border-rose-500 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-1">Total Absentees</p>
              <p className="text-base font-extrabold text-rose-700 leading-tight">{dashData?.contestTotals?.totalAbsentees ?? 0}</p>
              <p className="text-[11px] text-black font-medium mt-0.5">No round started</p>
            </div>
            <div className="bg-white shadow-sm border-2 border-orange-500 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600 mb-1">Total Delayed</p>
              <p className="text-base font-extrabold text-orange-700 leading-tight">{dashData?.contestTotals?.delayed ?? 0}</p>
              <p className="text-[11px] text-black font-medium mt-0.5">Need action</p>
            </div>
            <div className="bg-white shadow-sm border-2 border-purple-600 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600 mb-1">Overall Pass</p>
              <p className="text-base font-extrabold text-purple-700 leading-tight">{dashData?.contestTotals?.passRate ?? 0}%</p>
              <p className="text-[11px] text-black font-medium mt-0.5">Goal 80%</p>
            </div>
            <div className="bg-white shadow-sm border-2 border-teal-500 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600 mb-1">Overall Avg Time</p>
              <p className="text-base font-extrabold text-teal-700 leading-tight">{dashData?.contestTotals?.avgTime ?? '00:00:00'}</p>
              <p className="text-[11px] text-black font-medium mt-0.5">Per participant</p>
            </div>
          </div>
        </section>

        {/* TRAINER GRID */}
        <section className="px-3">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 mb-2">
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">TRAINER SCHEDULE <span className="text-gray-400 font-light">/</span> LIVE</h1>
              <p className="text-xs text-gray-500 font-medium">5 trainers · 5 participants each · click any to open journey</p>
            </div>
            <div className="flex items-center gap-5 bg-white border border-gray-200 px-5 py-2.5 shadow-sm min-w-[250px]">
              <div className="text-center">
                <p className="text-[11px] font-bold text-black uppercase tracking-wider mb-0.5">Attempted</p>
                <p className="text-2xl font-extrabold text-blue-600 leading-none">{dashData?.contestTotals?.totalAttempted ?? 0}</p>
              </div>
              <div className="text-xs text-gray-500 font-medium space-y-0.5 border-l border-gray-100 pl-4">
                <p>Total <span className="font-bold text-gray-700">{dashData?.contestTotals?.totalScheduled ?? 0}</span></p>
                <p>In Progress <span className="font-bold text-gray-700">{dashData?.contestTotals?.inProgress ?? 0}</span></p>
                <p>Completed <span className="font-bold text-gray-700">{dashData?.contestTotals?.completed ?? 0}</span></p>
              </div>
            </div>
          </div>

          {/* Grid Top Participant Pagination */}
          <div className="flex items-center justify-center gap-3 mb-2 bg-white px-2 py-1 rounded shadow-sm border border-gray-200">
            <button onClick={() => setParticipantPage(p => Math.max(0, p - 1))} disabled={participantPage === 0}
              className={`flex items-center justify-center h-6 w-6 rounded transition ${participantPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-purple-600 hover:scale-125'}`}>
              <ArrowUp className="h-4 w-4" strokeWidth={3} />
            </button>
            <span className="text-[11px] text-gray-400 font-medium">
              Participant Page {participantPage + 1}
            </span>
            <button onClick={() => setParticipantPage(p => p + 1)} disabled={trainers.every(t => (trainerParticipants[t.id] || []).length < GRID_LIMIT)}
              className={`flex items-center justify-center h-6 w-6 rounded transition ${trainers.every(t => (trainerParticipants[t.id] || []).length < GRID_LIMIT) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-purple-600 hover:scale-125'}`}>
              <ArrowDown className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>

          <div className="flex items-start gap-1">
            <div className="shrink-0 h-[68px] flex items-center">
              <button onClick={() => setTrainerPage(p => Math.max(0, p - 1))} disabled={trainerPage === 0}
                className={`flex items-center justify-center h-9 w-6 rounded transition ${trainerPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-purple-600 hover:scale-125'}`}>
                <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              {trainers.length === 0 ? (
                <div className="bg-white border border-gray-200 p-6 text-center text-sm text-gray-500">No trainer data available.</div>
              ) : (
                <div className="grid grid-cols-5 gap-2 min-w-[860px]">
                  {trainers.map((t, idx) => {
                    const list = trainerParticipants[t.id] || [];
                    return (
                      <div key={t.id ?? idx} className="bg-white border border-gray-200 shadow-sm flex flex-col">
                        
                        {/* Trainer Header */}
                        <div
                          className="bg-[#1A202C] text-white p-2 border-b border-gray-700 cursor-pointer hover:bg-[#2D3748] transition-all"
                          onClick={() => { setSelectedTrainer(t); setShowTrainerJourney(true); }}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <img src={t.photoUrl || FALLBACK_TRAINER_PHOTO} alt={t.name || ''}
                              className="shrink-0 w-8 h-8 rounded-full object-cover ring-1 ring-white/30"
                              onError={(e) => { e.target.src = FALLBACK_TRAINER_PHOTO; }} />
                            <span className="text-xs font-bold truncate flex-1">{t.name || '—'}</span>
                            <span className="h-2 w-2 rounded-full shrink-0 bg-emerald-400" />
                          </div>
                          <div className="text-[11px] text-gray-300 font-medium space-y-0.5">
                            <p>{t.totalAssigned ?? 0} assigned · {t.passPercentage ?? 0}% pass</p>
                            <p>{t.avgTime ?? '00:00:00'} avg / participant</p>
                          </div>
                        </div>

                        {/* Participants List */}
                        <div className="p-2 flex-1 flex flex-col">
                          <div className="space-y-1.5 flex-1">
                            {list.length === 0 ? (
                              <div className="flex items-center justify-center min-h-[56px]">
                                <span className="text-gray-300 text-xs">—</span>
                              </div>
                            ) : (
                              list.map((p, pIdx) => {
                                const isCompleted = p.roundsStatus === 'Completed';
                                const statusColor = isCompleted ? 'text-emerald-500' : 'text-purple-600';
                                const borderColor = isCompleted ? 'border-l-emerald-500' : 'border-l-purple-600';
                                return (
                                  <div
                                    key={p.mpin || pIdx}
                                    className={`border border-gray-200 bg-white p-2 min-h-[56px] border-l-4 ${borderColor} hover:bg-gray-50 transition-all cursor-pointer`}
                                    onClick={() => { setSelectedParticipant(p); setShowParticipantJourney(true); }}
                                  >
                                    <div className="text-xs font-bold text-gray-800 leading-tight truncate">{p.name || '—'}</div>
                                    <div className="text-[11px] text-gray-500 font-medium leading-tight truncate">
                                      {p.mpin || '—'} · {p.role || '—'}
                                    </div>
                                    <div className={`text-[11px] font-bold tracking-wider leading-tight ${statusColor}`}>
                                      {p.roundsStatus || '—'}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Trainer Right Pagination */}
            <div className="shrink-0 h-[68px] flex items-center">
              <button onClick={() => setTrainerPage(p => Math.min(trainerPages - 1, p + 1))} disabled={trainerPage >= trainerPages - 1}
                className={`flex items-center justify-center h-9 w-6 rounded transition ${trainerPage >= trainerPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-purple-600 hover:scale-125'}`}>
                <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          
          <div className="flex justify-center mt-2 text-[11px] text-gray-400 font-medium">
            Trainer Page {trainerPage + 1}
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between z-20">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">PARTICIPANT</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-medium text-gray-700">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
              <span className="text-xs font-medium text-gray-700">In progress</span>
            </div>
          </div>
        </div>
        <div className="text-xs font-medium text-gray-500">Skill Contest Portal</div>
      </div>

      {/* TRAINER POPUP */}
      {showTrainerJourney && selectedTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg overflow-hidden bg-white shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <img src={selectedTrainer.photoUrl || FALLBACK_TRAINER_PHOTO} alt={selectedTrainer.name || ''}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white/40 shadow-md" 
                  onError={(e) => { e.target.src = FALLBACK_TRAINER_PHOTO; }} />
                <div>
                  <p className="text-[11px] font-bold text-purple-200 uppercase tracking-wider">TRAINER SUMMARY</p>
                  <h2 className="text-xl font-bold text-white mt-0.5">{selectedTrainer.name || '—'}</h2>
                </div>
              </div>
              <button onClick={() => { setShowTrainerJourney(false); setSelectedTrainer(null); }} className="text-white/70 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 px-5 py-2.5 border-b border-gray-100 shrink-0">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Assigned</p>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5">{selectedTrainer.totalAssigned ?? 0}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Completed</p>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5">{selectedTrainer.completedCount ?? 0}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pass Rate</p>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5">{selectedTrainer.passPercentage ?? 0}%</p>
              </div>
            </div>

            <div className="px-5 py-2.5 shrink-0 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-black uppercase tracking-wider">Round Milestones</h3>
                <span className="text-xs font-medium text-gray-500">
                  {availableRounds.length} rounds total
                </span>
              </div>

              <div className="flex items-start justify-between gap-1.5">
                {availableRounds.map((roundName) => {
                  const roundLabel = roundName.replace(/^round/i, 'R');
                  return (
                    <div key={roundName} className="flex flex-col items-center gap-0.5 flex-1">
                      <div className="w-full py-1.5 rounded text-center text-xs font-bold text-white bg-purple-600">
                        {roundLabel}
                      </div>
                      <span className="text-[11px] font-bold text-gray-700">
                        {selectedTrainer.completedCount ?? 0} / {selectedTrainer.totalAssigned ?? 0}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-5 py-2.5 bg-gray-50 flex-1 overflow-hidden flex flex-col">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5 shrink-0">
                Recent Participants
              </h3>
              <div className="space-y-1.5 overflow-y-auto pr-1">
                {((trainerParticipants[selectedTrainer.id] || [])).length === 0 ? (
                  <div className="text-center text-xs text-gray-400 py-2">No participants</div>
                ) : (
                  (trainerParticipants[selectedTrainer.id] || []).map((p, idx) => {
                    const isCompleted = p.roundsStatus === 'Completed';
                    const isPass = p.status === 'Pass';
                    const isFail = p.status === 'Fail';

                    return (
                      <div 
                        key={p.mpin || idx} 
                        className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-white cursor-pointer transition-colors"
                        onClick={() => { setShowTrainerJourney(false); setSelectedParticipant(p); setShowParticipantJourney(true); }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-gray-500 font-medium w-20 truncate">{p.mpin || '—'}</span>
                          <span className="text-gray-800 font-semibold truncate flex-1">{p.name || '—'}</span>
                        </div>
                        
                        <span className={`text-[11px] font-bold tracking-wider ${
                          !isCompleted ? 'text-purple-600' : 
                          isPass ? 'text-teal-600' : 
                          isFail ? 'text-rose-600' : 
                          'text-gray-500'
                        }`}>
                          {!isCompleted ? 'In Progress' : (p.status || '—')}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="px-5 py-1.5 text-[11px] text-gray-400 font-medium shrink-0">
              Last activity · {new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>

          </div>
        </div>
      )}

      {/* PARTICIPANT POPUP */}
      {showParticipantJourney && selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg overflow-hidden bg-white shadow-2xl">
            <div className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-teal-100 uppercase tracking-wider">PARTICIPANT JOURNEY</p>
                <h2 className="text-xl font-bold text-white mt-0.5">{selectedParticipant.name || '—'}</h2>
                <p className="text-xs text-teal-100 font-medium">{selectedParticipant.mpin || '—'} · {selectedParticipant.role || '—'}</p>
              </div>
              <button onClick={() => { setShowParticipantJourney(false); setSelectedParticipant(null); }} className="text-white/70 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 px-5 py-2.5 border-b border-gray-100">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Rounds</p>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5">{selectedParticipant.rounds?.length ?? 0} / {selectedParticipant.totalRounds ?? 5}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Percentage</p>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5">{selectedParticipant.percentage ?? 0}%</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Time</p>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5">{selectedParticipant.totalTime || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</p>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5">{selectedParticipant.roundsStatus || '—'}</p>
              </div>
            </div>
            <div className="px-5 py-2.5">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">Rounds</h3>
              <div className="space-y-1.5">
                {(selectedParticipant.rounds || []).length === 0 ? (
                  <div className="text-center text-xs text-gray-400 py-2">No rounds yet.</div>
                ) : (
                  (selectedParticipant.rounds || []).map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className={`px-2.5 h-6 rounded flex items-center justify-center text-[11px] font-bold text-white whitespace-nowrap ${r?.score != null ? 'bg-teal-500' : 'bg-gray-400'}`}>
                        {r?.roundName || `Round ${idx + 1}`}
                      </div>
                      <span className="text-xs text-gray-800 font-medium flex-1">{r?.trainerName || '—'}</span>
                      {r?.score != null && <span className="text-xs text-gray-900 font-bold">{r.score} Marks</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALERTS */}
      {showAlerts && (
        <div className="fixed inset-0 z-50" onClick={() => setShowAlerts(false)}>
          <div className="absolute top-16 right-4 w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
              <button onClick={() => setShowAlerts(false)} className="text-gray-400 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-2 text-center text-xs text-gray-400 py-6">No notifications</div>
          </div>
        </div>
      )}

      <Toaster enabled={toastOn} />
      <ChatBot embedded={true} />
    </div>
  );
}