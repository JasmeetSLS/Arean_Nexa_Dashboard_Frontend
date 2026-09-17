import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Bell, LogOut, ChevronLeft, ChevronRight, Search,
  Download
} from 'lucide-react';
import { Toaster } from '../components/Toaster.jsx';
import { FaBell, FaBellSlash } from 'react-icons/fa';

const FALLBACK_TRAINER_PHOTO = '/trainers/1.jpeg';
const GRID_API_URL = 'http://localhost:5000/api/grid';
const DASHBOARD_API_URL = 'http://localhost:5000/api/dashboard';
const FILTERS_API_URL = 'http://localhost:5000/api/filters';

export default function Dashboard() {
  // ---- API data ----
  const [gridTrainers, setGridTrainers] = useState([]);
  const [dashData, setDashData] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    dates: [],
    zones: [],
    regions: [],
    trainers: [],
    roles: [],
    agencies: [],
    dealerNames: [],
    dealerCodes: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---- UI state ----
  const [filters, setFilters] = useState({
    date: '',
    zone: '',
    region: '',
    trainer: '',
    role: '',
    agency: '',
    dealerName: '',
    dealerCode: '',
  });
  const [searchTrainer, setSearchTrainer] = useState('');
  const [searchParticipant, setSearchParticipant] = useState('');

  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showParticipantJourney, setShowParticipantJourney] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [showTrainerJourney, setShowTrainerJourney] = useState(false);

  const [trainerPage, setTrainerPage] = useState(0);
  const [regionPage, setRegionPage] = useState(0);
  const [summaryTrainerPage, setSummaryTrainerPage] = useState(0);

  const [showAlerts, setShowAlerts] = useState(false);
  const [liveAlerts] = useState([]);
  const [toastOn, setToastOn] = useState(false);

  // Inside Dashboard component
const handleExportUsers = () => {
  const params = new URLSearchParams();
  if (filters.region) params.set('region', filters.region);
  if (filters.zone)   params.set('zone',   filters.zone);
  if (filters.role)   params.set('role',   filters.role);

  const qs = params.toString();
  const url = `http://localhost:5000/api/export/users${qs ? `?${qs}` : ''}`;
  window.open(url, '_blank');
};

  // ---- Fetch grid ----
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(GRID_API_URL);
        const json = await res.json();
        if (json.success) setGridTrainers(json.trainers || []);
        else setError(json.error || 'Failed to load grid data');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- Fetch dashboard KPIs ----
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(DASHBOARD_API_URL);
        const json = await res.json();
        if (json.success) setDashData(json);
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
      }
    })();
  }, []);

  // ---- Fetch filter options ----
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(FILTERS_API_URL);
        const json = await res.json();
        if (json.success) {
          setFilterOptions({
            dates:       json.dates       || [],
            zones:       json.zones       || [],
            regions:     json.regions     || [],
            trainers:    json.trainers    || [],
            roles:       json.roles       || [],
            agencies:    json.agencies    || [],
            dealerNames: json.dealerNames || [],
            dealerCodes: json.dealerCodes || [],
          });
        }
      } catch (err) {
        console.error('Filters fetch failed:', err);
      }
    })();
  }, []);

  // ---- Grid derived stats ----
  const gridStats = useMemo(() => {
    const flat = gridTrainers.flatMap(({ trainer }) => trainer.participants || []);
    const total = flat.length;
    const completedCount = flat.filter(p => p.roundsStatus === 'Completed').length;
    const inProgressCount = flat.filter(p => p.roundsStatus === 'In Progress').length;
    return { total, completedCount, inProgressCount };
  }, [gridTrainers]);

  // ---- Search query shortcuts ----
  const qTrainer = searchTrainer.trim().toLowerCase();
  const qParticipant = searchParticipant.trim().toLowerCase();

  // ---- Grid ordering (search-matches first, others still visible) ----
  const orderedGridTrainers = useMemo(() => {
    if (!qTrainer && !qParticipant) {
      return gridTrainers.map(({ trainer }) => ({
        trainer,
        participants: trainer.participants || [],
      }));
    }

    const scored = gridTrainers.map(({ trainer }, idx) => {
      let score = 0;
      if (qTrainer && trainer.name.toLowerCase().includes(qTrainer)) score += 100;
      if (qParticipant) {
        const hasMatch = (trainer.participants || []).some(
          (p) =>
            p.mspin?.toLowerCase().includes(qParticipant) ||
            p.name?.toLowerCase().includes(qParticipant)
        );
        if (hasMatch) score += 50;
      }
      return { trainer, participants: trainer.participants || [], score, idx };
    });

    return scored
      .sort((a, b) => b.score - a.score || a.idx - b.idx)
      .map(({ trainer, participants }) => ({ trainer, participants }));
  }, [gridTrainers, qTrainer, qParticipant]);

  const trainersPerPage = 5;
  const totalTrainerPages = Math.max(1, Math.ceil(orderedGridTrainers.length / trainersPerPage));
  const displayedGridTrainers = orderedGridTrainers.slice(
    trainerPage * trainersPerPage,
    (trainerPage + 1) * trainersPerPage
  );

  useEffect(() => { setTrainerPage(0); }, [searchTrainer, searchParticipant]);

  // ---- Region summary pagination ----
  const REGION_PER_PAGE = 4;
  const regionSummary = dashData?.regionSummary || [];
  const totalRegionPages = Math.max(1, Math.ceil(regionSummary.length / REGION_PER_PAGE));
  const displayedRegions = regionSummary.slice(
    regionPage * REGION_PER_PAGE,
    (regionPage + 1) * REGION_PER_PAGE
  );

  useEffect(() => {
    if (regionPage >= totalRegionPages) setRegionPage(0);
  }, [regionPage, totalRegionPages]);

  // ---- Trainer summary pagination ----
  const SUMMARY_TRAINER_PER_PAGE = 5;
  const trainerSummary = dashData?.trainerSummary || [];
  const totalSummaryTrainerPages = Math.max(1, Math.ceil(trainerSummary.length / SUMMARY_TRAINER_PER_PAGE));
  const displayedSummaryTrainers = trainerSummary.slice(
    summaryTrainerPage * SUMMARY_TRAINER_PER_PAGE,
    (summaryTrainerPage + 1) * SUMMARY_TRAINER_PER_PAGE
  );

  useEffect(() => {
    if (summaryTrainerPage >= totalSummaryTrainerPages) setSummaryTrainerPage(0);
  }, [summaryTrainerPage, totalSummaryTrainerPages]);

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
        <div className="text-center">
          <p className="text-red-600 text-sm font-medium mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F3F4F6] font-sans">

      {/* ===== TOP BAR ===== */}
      <div className="shrink-0 flex items-center justify-between gap-3 bg-white px-4 py-2 border-b border-gray-200 z-20">
        <div>
          <h1 className="text-lg font-black text-indigo-900 tracking-tight flex items-center gap-2">
            SKILL CONTEST <span className="text-purple-500 font-light">/</span> COMMAND CENTER
          </h1>
          <p className="text-xs text-indigo-500 font-medium">Portal progress monitor</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-gray-700">
              LIVE · {dashData?.todayLive?.date || '—'}
            </span>
          </div>

          <button
            onClick={() => setToastOn(!toastOn)}
            title={toastOn ? 'Notifications ON' : 'Notifications OFF'}
            className={`flex items-center justify-center h-8 w-8 rounded-full border transition ${
              toastOn
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-400 hover:shadow-md'
            }`}
          >
            {toastOn ? <FaBell className="h-4 w-4" /> : <FaBellSlash className="h-4 w-4" />}
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

          <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-semibold shadow-sm hover:shadow-md transition-all">
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="shrink-0 bg-white px-4 py-1.5 border-b border-gray-200 shadow-sm z-10">
        <div className="flex flex-wrap items-end gap-2">
          {/* Date / Month */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-bold text-indigo-900 uppercase">Date / Month</label>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white w-28"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            >
              <option value="">All</option>
              {filterOptions.dates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Zone */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-bold text-indigo-900 uppercase">Zone</label>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white w-24"
              value={filters.zone}
              onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
            >
              <option value="">All</option>
              {filterOptions.zones.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>

          {/* Region */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-bold text-indigo-900 uppercase">Region</label>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white w-28"
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            >
              <option value="">All</option>
              {filterOptions.regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Trainer */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-bold text-indigo-900 uppercase">Trainer</label>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white w-32"
              value={filters.trainer}
              onChange={(e) => setFilters({ ...filters, trainer: e.target.value })}
            >
              <option value="">All</option>
              {filterOptions.trainers.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-bold text-indigo-900 uppercase">Role</label>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white w-24"
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            >
              <option value="">All</option>
              {filterOptions.roles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Agency */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-bold text-indigo-900 uppercase">Agency</label>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white w-28"
              value={filters.agency}
              onChange={(e) => setFilters({ ...filters, agency: e.target.value })}
            >
              <option value="">All</option>
              {filterOptions.agencies.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Dealer Name */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-bold text-indigo-900 uppercase">Dealer Name</label>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white w-44"
              value={filters.dealerName}
              onChange={(e) => setFilters({ ...filters, dealerName: e.target.value })}
            >
              <option value="">All</option>
              {filterOptions.dealerNames.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Dealer Code */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-bold text-indigo-900 uppercase">Dealer Code</label>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white w-32"
              value={filters.dealerCode}
              onChange={(e) => setFilters({ ...filters, dealerCode: e.target.value })}
            >
              <option value="">All</option>
              {filterOptions.dealerCodes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
 <div className="flex flex-col gap-0.5">
          <button
  onClick={handleExportUsers}
  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-sm transition"
>
  <Download className="h-3.5 w-3.5" />
  Export Excel
</button>
</div>

          {/* Last sync */}
          <div className="ml-auto text-xs font-bold text-indigo-400 pb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse mr-1.5 align-middle"></span>
            Last sync {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* ===== SCROLLABLE CONTENT ===== */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* TODAY'S LIVE DATA */}
        <section className="px-3">
          <div className="flex justify-between items-end mb-1.5">
            <h2 className="text-sm font-black text-indigo-900 uppercase">TODAY'S LIVE DATA</h2>
            <span className="text-xs text-gray-400 font-medium">
              Live snapshot · {dashData?.todayLive?.date || '—'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <div className="bg-gray-900 text-white p-3 shadow-sm border border-gray-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white mb-1">Scheduled</p>
              <p className="text-xl font-extrabold leading-tight">{dashData?.todayLive?.scheduled ?? 0}</p>
              <p className="text-[11px] text-white font-medium mt-0.5">Daily plan</p>
            </div>

            <div className="bg-sky-500 text-white p-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white mb-1">Attempted</p>
              <p className="text-xl font-extrabold leading-tight">
                {(dashData?.todayLive?.completed ?? 0) + (dashData?.todayLive?.inProgress ?? 0)}
              </p>
              <div className="flex justify-between text-[11px] text-white font-medium mt-0.5">
                <span>{dashData?.todayLive?.inProgress ?? 0} in prog</span>
                <span>{dashData?.todayLive?.completed ?? 0} comp</span>
              </div>
            </div>

            <div className="bg-rose-500 text-white p-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white mb-1">Absentees</p>
              <p className="text-xl font-extrabold leading-tight">0</p>
              <p className="text-[11px] text-white font-medium mt-0.5">0% of schedule</p>
            </div>

            <div className="bg-orange-500 text-white p-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white mb-1">Delayed</p>
              <p className="text-xl font-extrabold leading-tight">0</p>
              <p className="text-[11px] text-white font-medium mt-0.5">0 follow-ups</p>
            </div>

            <div className="bg-purple-600 text-white p-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white mb-1">Pass Rate</p>
              <p className="text-xl font-extrabold leading-tight">{dashData?.todayLive?.passRate ?? 0}%</p>
              <p className="text-[11px] text-white font-medium mt-0.5">Today</p>
            </div>

            <div className="bg-teal-500 text-white p-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white mb-1">Avg Time</p>
              <p className="text-xl font-extrabold leading-tight">{dashData?.todayLive?.avgTime ?? '00:00:00'}</p>
              <p className="text-[11px] text-white font-medium mt-0.5">Per Participant</p>
            </div>

            <div className="bg-emerald-500 text-white p-3 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white mb-1">Active Trainers</p>
              <p className="text-xl font-extrabold leading-tight">
                {dashData?.todayLive?.activeTrainers ?? 0}
              </p>
              <p className="text-[11px] text-white font-medium mt-0.5">Live from API</p>
            </div>
          </div>
        </section>

        {/* REGION-WISE SUMMARY */}
        <section className="px-3">
          <div className="flex justify-between items-end mb-1.5">
            <h2 className="text-sm font-black text-indigo-900 uppercase">REGION-WISE SUMMARY</h2>
            <span className="text-xs text-gray-400 font-medium">
              {regionSummary.length} regions · lifetime
            </span>
          </div>

          <div className="flex items-center gap-1">
            <div className="shrink-0 h-[100px] flex items-center">
              <button
                onClick={() => setRegionPage(p => Math.max(0, p - 1))}
                disabled={regionPage === 0}
                className={`flex items-center justify-center h-9 w-6 rounded transition ${regionPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-purple-600 hover:scale-125'}`}
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {displayedRegions.map((r) => {
                  const regionDimmed = !!qTrainer;

                  return (
                    <div
                      key={`${r.region}|${r.zone}`}
                      className={`bg-white text-black shadow-sm border-2 border-purple-500 p-3 text-center transition-all ${regionDimmed ? 'opacity-25' : ''}`}
                    >
                      <h3 className="font-bold text-sm mb-1">{r.region} – {r.zone}</h3>
                      <p className="text-xs font-semibold">{r.completed} completed</p>
                      <p className="text-sm font-medium mt-0.5">
                        {r.passRate}% pass · {r.avgTime} avg
                      </p>
                    </div>
                  );
                })}
                {regionSummary.length === 0 && (
                  <div className="col-span-4 text-center text-xs text-gray-400 py-4">
                    No region data available.
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 h-[100px] flex items-center">
              <button
                onClick={() => setRegionPage(p => Math.min(totalRegionPages - 1, p + 1))}
                disabled={regionPage >= totalRegionPages - 1}
                className={`flex items-center justify-center h-9 w-6 rounded transition ${regionPage >= totalRegionPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-purple-600 hover:scale-125'}`}
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
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
              <button
                onClick={() => setSummaryTrainerPage(p => Math.max(0, p - 1))}
                disabled={summaryTrainerPage === 0}
                className={`flex items-center justify-center h-9 w-6 rounded transition ${summaryTrainerPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-purple-600 hover:scale-125'}`}
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {displayedSummaryTrainers.map((t) => {
                  const trainerMatch = !qTrainer || t.name.toLowerCase().includes(qTrainer);
                  const participantMatch = !qParticipant || (gridTrainers
                    .find(({ trainer }) => trainer.id === t.id)
                    ?.trainer.participants || []
                  ).some((p) =>
                    p.mspin?.toLowerCase().includes(qParticipant) ||
                    p.name?.toLowerCase().includes(qParticipant)
                  );

                  const dimmed = (qTrainer && !trainerMatch) || (qParticipant && !participantMatch);

                  return (
                    <div
                      key={t.id}
                      className={`bg-white shadow-sm border border-gray-100 p-3 hover:shadow-md transition cursor-pointer ${dimmed ? 'opacity-25' : ''}`}
                      onClick={() => { setSelectedTrainer(t); setShowTrainerJourney(true); }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <img
                          src={t.photoUrl}
                          alt={t.name}
                          className="shrink-0 w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                          loading="lazy"
                          onError={(e) => { e.target.src = FALLBACK_TRAINER_PHOTO; }}
                        />
                        <h3 className="font-bold text-black text-xs tracking-wide truncate">
                          {t.name.toUpperCase()}
                        </h3>
                      </div>
                      <p className="text-xs font-semibold text-black">{t.assigned} assigned</p>
                      <p className="text-xs text-black font-medium mt-0.5">
                        {t.passRate}% pass · {t.avgTime}
                      </p>
                    </div>
                  );
                })}
                {trainerSummary.length === 0 && (
                  <div className="col-span-5 text-center text-xs text-gray-400 py-4">
                    No trainer data available.
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 h-[110px] flex items-center">
              <button
                onClick={() => setSummaryTrainerPage(p => Math.min(totalSummaryTrainerPages - 1, p + 1))}
                disabled={summaryTrainerPage >= totalSummaryTrainerPages - 1}
                className={`flex items-center justify-center h-9 w-6 rounded transition ${summaryTrainerPage >= totalSummaryTrainerPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-purple-600 hover:scale-125'}`}
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="flex justify-center mt-2 text-[11px] text-gray-400 font-medium">
            Page {summaryTrainerPage + 1} of {totalSummaryTrainerPages}
          </div>
        </section>

        {/* CONTEST TOTALS */}
        <section className="px-3">
          <div className="flex justify-between items-end mb-1.5">
            <h2 className="text-sm font-black text-indigo-900 uppercase">CONTEST TOTALS</h2>
            <span className="text-xs text-gray-400 font-medium">All dates · all zones</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <div className="bg-white shadow-sm border-2 border-gray-900 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Total Scheduled</p>
              <p className="text-base font-extrabold text-gray-800 leading-tight">
                {dashData?.contestTotals?.totalScheduled ?? 0}
              </p>
              <p className="text-[11px] text-black font-medium mt-0.5">100% registered</p>
            </div>

            <div className="bg-white shadow-sm border-2 border-sky-500 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600 mb-1">Total Attempted</p>
              <p className="text-base font-extrabold text-sky-700 leading-tight">
                {dashData?.contestTotals?.totalScheduled ?? 0}
              </p>
              <p className="text-[11px] text-black font-medium mt-0.5">
                {dashData?.contestTotals?.inProgress ?? 0} in prog · {dashData?.contestTotals?.completed ?? 0} comp
              </p>
            </div>

            <div className="bg-white shadow-sm border-2 border-rose-500 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-1">Total Absentees</p>
              <p className="text-base font-extrabold text-rose-700 leading-tight">0</p>
              <p className="text-[11px] text-black font-medium mt-0.5">0% not attempted</p>
            </div>

            <div className="bg-white shadow-sm border-2 border-orange-500 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600 mb-1">Total Delayed</p>
              <p className="text-base font-extrabold text-orange-700 leading-tight">0</p>
              <p className="text-[11px] text-black font-medium mt-0.5">0% need action</p>
            </div>

            <div className="bg-white shadow-sm border-2 border-pink-500 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-pink-600 mb-1">Total Resets</p>
              <p className="text-base font-extrabold text-pink-700 leading-tight">0</p>
              <p className="text-[11px] text-black font-medium mt-0.5">0% reset rate</p>
            </div>

            <div className="bg-white shadow-sm border-2 border-purple-600 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600 mb-1">Overall Pass</p>
              <p className="text-base font-extrabold text-purple-700 leading-tight">
                {dashData?.contestTotals?.passRate ?? 0}%
              </p>
              <p className="text-[11px] text-black font-medium mt-0.5">Goal 80%</p>
            </div>

            <div className="bg-white shadow-sm border-2 border-teal-500 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600 mb-1">Overall Avg Time</p>
              <p className="text-base font-extrabold text-teal-700 leading-tight">
                {dashData?.contestTotals?.avgTime ?? '00:00:00'}
              </p>
              <p className="text-[11px] text-black font-medium mt-0.5">Per Participant</p>
            </div>
          </div>
        </section>

        {/* ===== TRAINER SCHEDULE GRID ===== */}
        <section className="px-3">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 mb-2">
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                TRAINER SCHEDULE <span className="text-gray-400 font-light">/</span> LIVE
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Trainer metrics are merged into each column header
              </p>
              <p className="text-xs text-gray-400">
                Grid combines trainer output, participant state, and scheduled capacity in one operational view
              </p>
            </div>
            <div className="flex items-center gap-5 bg-white border border-gray-200 px-5 py-2.5 shadow-sm min-w-[250px]">
              <div className="text-center">
                <p className="text-[11px] font-bold text-black uppercase tracking-wider mb-0.5">Attempted</p>
                <p className="text-2xl font-extrabold text-blue-600 leading-none">
                  {gridStats.completedCount + gridStats.inProgressCount}
                </p>
              </div>
              <div className="text-xs text-gray-500 font-medium space-y-0.5 border-l border-gray-100 pl-4">
                <p>Total <span className="font-bold text-gray-700">{gridStats.total}</span></p>
                <p>In Progress <span className="font-bold text-gray-700">{gridStats.inProgressCount}</span></p>
                <p>Completed <span className="font-bold text-gray-700">{gridStats.completedCount}</span></p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-purple-600">Live from Skill Contest Portal</p>
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
                className="pl-8 pr-7 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white w-52 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
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
                placeholder="Search Participant / MSPIN..."
                value={searchParticipant}
                onChange={(e) => setSearchParticipant(e.target.value)}
                className="pl-8 pr-7 py-1.5 text-xs font-medium border border-gray-300 rounded-md bg-white w-52 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
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
                className="ml-auto text-[11px] font-bold text-indigo-500 hover:text-indigo-700 transition"
              >
                Clear search
              </button>
            )}
          </div>

          {/* GRID */}
          <div className="flex items-start gap-1">
            <div className="shrink-0 h-[68px] flex items-center">
              <button
                onClick={() => setTrainerPage(p => Math.max(0, p - 1))}
                disabled={trainerPage === 0}
                className={`flex items-center justify-center h-9 w-6 rounded transition ${trainerPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-purple-600 hover:scale-125'}`}
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-x-auto">
              {displayedGridTrainers.length === 0 ? (
                <div className="bg-white border border-gray-200 p-6 text-center text-sm text-gray-500">
                  No trainer data available.
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2 min-w-[860px]">
                  {displayedGridTrainers.map(({ trainer, participants: list }) => {
                    const trainerMatch = !qTrainer || trainer.name.toLowerCase().includes(qTrainer);
                    const trainerDimmed = qTrainer && !trainerMatch;

                    return (
                      <div
                        key={trainer.id}
                        className={`bg-white border border-gray-200 shadow-sm flex flex-col ${trainerDimmed ? 'opacity-25' : ''}`}
                      >
                        <div
                          className={`bg-[#1A202C] text-white p-2 border-b border-gray-700 cursor-pointer hover:bg-[#2D3748] transition-all ${trainerMatch && qTrainer ? 'ring-2 ring-purple-400 ring-inset' : ''}`}
                         onClick={() => {
  // Prefer the summary object (has roundJourney); fall back to grid trainer
  const summary = trainerSummary.find(x => x.id === trainer.id);
  setSelectedTrainer(
    summary
      ? { ...summary, totalAssigned: summary.assigned ?? summary.totalAssigned ?? 0 }
      : { ...trainer, assigned: trainer.totalAssigned ?? 0 }
  );
  setShowTrainerJourney(true);
}}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <img
                              src={trainer.photoUrl}
                              alt={trainer.name}
                              className="shrink-0 w-8 h-8 rounded-full object-cover ring-1 ring-white/30"
                              loading="lazy"
                              onError={(e) => { e.target.src = FALLBACK_TRAINER_PHOTO; }}
                            />
                            <span className="text-xs font-bold truncate flex-1">{trainer.name}</span>
                            <span className="h-2 w-2 rounded-full shrink-0 bg-emerald-400" />
                          </div>
                          <div className="text-[11px] text-gray-300 font-medium space-y-0.5">
                            <p>{trainer.totalAssigned} assigned · {trainer.passPercentage}% pass</p>
                            <p>{trainer.avgTime} avg / participant</p>
                          </div>
                        </div>

                        <div className="p-2 space-y-1.5 flex-1">
                          {list.length === 0 ? (
                            <div className="flex items-center justify-center min-h-[56px]">
                              <span className="text-gray-300 text-xs">—</span>
                            </div>
                          ) : (
                            list.map((p) => {
                              const rounds = p.rounds || [];
                              const lastRound = rounds[rounds.length - 1] || {};
                              const isCompleted = lastRound.status === 'completed';
                              const statusText = isCompleted ? 'COMPLETED' : 'IN PROGRESS';
                              const statusColor = isCompleted ? 'text-emerald-500' : 'text-purple-600';
                              const borderColor = isCompleted ? 'border-l-emerald-500' : 'border-l-purple-600';

                              const matchesParticipant =
                                !qParticipant ||
                                p.mspin?.toLowerCase().includes(qParticipant) ||
                                p.name?.toLowerCase().includes(qParticipant);
                              const participantDimmed = qParticipant && !matchesParticipant;

                              return (
                                <div
                                  key={p.mspin}
                                  className={`border border-gray-200 bg-white p-2 min-h-[56px] border-l-4 ${borderColor} hover:bg-gray-50 transition-all cursor-pointer ${participantDimmed ? 'opacity-25' : ''} ${matchesParticipant && qParticipant ? 'ring-2 ring-emerald-400 ring-inset' : ''}`}
                                  onClick={() => {
                                    setSelectedParticipant({
                                      displayName: p.name,
                                      empId: p.mspin,
                                      role: p.role,
                                      percentage: p.percentage,
                                      totalTime: p.totalTime,
                                      roundsStatus: p.roundsStatus,
                                      rounds: p.rounds,
                                    });
                                    setShowParticipantJourney(true);
                                  }}
                                >
                                  <div className="text-xs font-bold text-gray-800 leading-tight truncate">
                                    {p.name}
                                  </div>
                                  <div className="text-[11px] text-gray-500 font-medium leading-tight truncate">
                                    {p.mspin} · {p.role}
                                  </div>
                                  <div className={`text-[11px] font-bold tracking-wider leading-tight ${statusColor}`}>
                                    {p.roundsStatus} 
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="shrink-0 h-[68px] flex items-center">
              <button
                onClick={() => setTrainerPage(p => Math.min(totalTrainerPages - 1, p + 1))}
                disabled={trainerPage >= totalTrainerPages - 1}
                className={`flex items-center justify-center h-9 w-6 rounded transition ${trainerPage >= totalTrainerPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:text-purple-600 hover:scale-125'}`}
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="flex justify-center mt-2 text-[11px] text-gray-400 font-medium">
            Page {trainerPage + 1} of {totalTrainerPages}
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
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">TRAINER AVAILABILITY</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-medium text-gray-700">Online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-xs font-medium text-gray-700">Offline</span>
            </div>
          </div>
        </div>
        <div className="text-xs font-medium text-gray-500">Skill Contest Portal</div>
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
                  <p className="text-[11px] font-bold text-purple-200 uppercase tracking-wider">TRAINER JOURNEY</p>
                  <h2 className="text-xl font-bold text-white mt-0.5">{selectedTrainer.name}</h2>
                </div>
              </div>
              <button onClick={() => { setShowTrainerJourney(false); setSelectedTrainer(null); }} className="text-white/70 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>

           <div className="grid grid-cols-3 gap-3 px-5 py-2.5 border-b border-gray-100">
  <div>
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Completed</p>
    <p className="text-xl font-extrabold text-gray-900 mt-0.5">
      {selectedTrainer.totalAssigned ?? selectedTrainer.assigned ?? 0}
    </p>
  </div>
  <div>
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pass Rate</p>
    <p className="text-xl font-extrabold text-gray-900 mt-0.5">
      {selectedTrainer.passPercentage ?? selectedTrainer.passRate ?? 0}%
    </p>
  </div>
  <div>
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Avg Time</p>
    <p className="text-xl font-extrabold text-gray-900 mt-0.5">
      {selectedTrainer.avgTime ?? '00:00:00'}
    </p>
  </div>
</div>

{/* ---- Round Journey (top) ---- */}
<div className="px-5 py-2.5">
  <div className="flex items-center justify-between mb-2">
    <h3 className="text-xs font-bold text-black uppercase tracking-wider">
     Round Milestones
    </h3>
    <span className="text-xs font-medium text-gray-500">
      {Object.keys(selectedTrainer.roundJourney || {}).length} rounds taught
    </span>
  </div>

  {selectedTrainer.roundJourney && Object.keys(selectedTrainer.roundJourney).length > 0 ? (
    <div className="flex items-start justify-between gap-1.5">
      {Object.entries(selectedTrainer.roundJourney)
        .sort((a, b) => {
          const na = parseInt(a[0].replace(/\D/g, ''), 10) || 0;
          const nb = parseInt(b[0].replace(/\D/g, ''), 10) || 0;
          return na - nb;
        })
        .map(([roundKey, count]) => {
          const roundLabel = roundKey.replace(/^round/i, 'R'); // "round1" → "R1"
          const countNum   = Number(count) || 0;

          return (
            <div key={roundKey} className="flex flex-col items-center gap-0.5 flex-1">
              <div className="w-full py-1.5 rounded text-center text-xs font-bold text-white bg-purple-600">
                {roundLabel}
              </div>
              <span className="text-[11px] font-bold text-gray-700">
                {countNum} Participants
              </span>
            </div>
          );
        })}
    </div>
  ) : (
    <div className="text-center text-xs text-gray-400 py-2">
      No round activity yet.
    </div>
  )}
</div>

{/* ---- Assigned Participants (below) ---- */}
<div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100">
  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
    Recent Participants
  </h3>
  <div className="space-y-1.5 max-h-56 overflow-y-auto">
    {((gridTrainers.find(g => g.trainer.id === selectedTrainer.id)?.trainer.participants) || [])
      .slice(0, 10)
      .map((p) => (
        <div key={p.mspin} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium w-16 truncate">{p.mspin}</span>
            <span className="text-gray-800 font-semibold truncate flex-1">{p.name}</span>
          </div>
          <span className={`text-[11px] font-bold tracking-wider ${p.status === 'Pass' ? 'text-teal-600' : 'text-purple-600'}`}>
            {p.status || '—'}
          </span>
        </div>
      ))}
    {((gridTrainers.find(g => g.trainer.id === selectedTrainer.id)?.trainer.participants) || [])
      .length === 0 && (
      <div className="text-center text-xs text-gray-400 py-2">
        No participants
      </div>
    )}
  </div>
</div>

            <div className="px-5 py-1.5 text-[11px] text-gray-400 font-medium">
              Last activity · {new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )}

      {/* PARTICIPANT JOURNEY POPUP */}
      {showParticipantJourney && selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg overflow-hidden bg-white shadow-2xl">
            <div className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-teal-100 uppercase tracking-wider">PARTICIPANT JOURNEY</p>
                <h2 className="text-xl font-bold text-white mt-0.5">{selectedParticipant.displayName}</h2>
                <p className="text-xs text-teal-100 font-medium">{selectedParticipant.empId} · {selectedParticipant.role}</p>
              </div>
              <button onClick={() => { setShowParticipantJourney(false); setSelectedParticipant(null); }} className="text-white/70 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3 px-5 py-2.5 border-b border-gray-100">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Rounds</p>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5">
                  {selectedParticipant.rounds ? selectedParticipant.rounds.length : 0} / 5
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Percentage</p>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5">
                  {selectedParticipant.percentage ? `${selectedParticipant.percentage}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Time</p>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5">
                  {selectedParticipant.totalTime || '—'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</p>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5">
                  {selectedParticipant.roundsStatus || '—'}
                </p>
              </div>
            </div>

            <div className="px-5 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Assessment Milestones</h3>
                <span className="text-xs font-medium text-gray-500">
                  {selectedParticipant.rounds ? selectedParticipant.rounds.length : 0} of 5
                </span>
              </div>
              <div className="space-y-1.5">
                {(selectedParticipant.rounds || []).map((r, idx) => {
                  const status = r.status || 'pending';
                  const color = status === 'completed' ? 'bg-teal-500' : 'bg-gray-400';
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div className={`px-2.5 h-6 rounded flex items-center justify-center text-[11px] font-bold text-white whitespace-nowrap ${color}`}>
                        {r.roundName}
                      </div>
                      <span className="text-xs text-gray-800 font-medium flex-1">{r.trainerName}</span>
                      {r.score != null && (
                        <span className="text-xs text-gray-900 font-bold">
                          {r.score} Marks
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-5 py-1.5 text-[11px] text-gray-400 font-medium">
              Last activity · {new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
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
                <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                <span className="bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                  {liveAlerts.length}
                </span>
              </div>
              <button onClick={() => setShowAlerts(false)} className="text-gray-400 hover:text-gray-700 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-2 overflow-y-auto flex-1">
              {liveAlerts.length === 0 ? (
                <div className="text-center text-xs text-gray-400 py-6">
                  No notifications
                </div>
              ) : (
                liveAlerts.map(alert => (
                  <div key={alert.id} className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                    <div className="relative shrink-0">
                      <img
                        src={alert.photoUrl}
                        alt={alert.title}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                        onError={(e) => { e.target.src = FALLBACK_TRAINER_PHOTO; }}
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 leading-snug truncate">{alert.title}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{alert.subtitle}</p>
                      <p className="text-[11px] text-gray-400 font-medium mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      <Toaster enabled={toastOn} />
    </div>
  );
}