import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Bell, Save, Check,
  ShieldCheck, Search, X, UserCog,
  Filter, Radio, Trophy, BarChart3, Route, UserCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../service/auth.jsx';

// =====================================================================
// MASTER DATA — one row per (role, zone, region)
// =====================================================================
const PARTICIPANTS = [
  { role: 'RM',  zone: 'Central',    region: 'C1' },
  { role: 'RM',  zone: 'Central',    region: 'C1' },
  { role: 'RM',  zone: 'Central',    region: 'C1' },
  { role: 'RM',  zone: 'Central',    region: 'C1' },
  { role: 'RM',  zone: 'Central',    region: 'C1' },
  { role: 'SRM', zone: 'Central',    region: 'C2' },
  { role: 'SRM', zone: 'Central',    region: 'C2' },
  { role: 'SRM', zone: 'Central',    region: 'C2' },
  { role: 'SRM', zone: 'Central',    region: 'C2' },
  { role: 'SRM', zone: 'Central',    region: 'C2' },
  { role: 'RM',  zone: 'Central',    region: 'C3' },
  { role: 'RM',  zone: 'Central',    region: 'C3' },
  { role: 'RM',  zone: 'Central',    region: 'C3' },
  { role: 'RM',  zone: 'Central',    region: 'C3' },
  { role: 'RM',  zone: 'Central',    region: 'C3' },
  { role: 'RM',  zone: 'Central',    region: 'C4' },
  { role: 'RM',  zone: 'Central',    region: 'C4' },
  { role: 'RM',  zone: 'Central',    region: 'C4' },
  { role: 'RM',  zone: 'Central',    region: 'C4' },
  { role: 'RM',  zone: 'Central',    region: 'C4' },
  { role: 'RM',  zone: 'East',       region: 'E1' },
  { role: 'RM',  zone: 'East',       region: 'E1' },
  { role: 'RM',  zone: 'East',       region: 'E1' },
  { role: 'RM',  zone: 'East',       region: 'E1' },
  { role: 'RM',  zone: 'East',       region: 'E1' },
  { role: 'RM',  zone: 'East',       region: 'E2' },
  { role: 'RM',  zone: 'East',       region: 'E2' },
  { role: 'RM',  zone: 'East',       region: 'E2' },
  { role: 'SRM', zone: 'East',       region: 'E2' },
  { role: 'RM',  zone: 'East',       region: 'E2' },
  { role: 'RM',  zone: 'East',       region: 'E3' },
  { role: 'RM',  zone: 'East',       region: 'E3' },
  { role: 'RM',  zone: 'East',       region: 'E3' },
  { role: 'RM',  zone: 'East',       region: 'E3' },
  { role: 'SRM', zone: 'East',       region: 'E3' },
  { role: 'RM',  zone: 'North',      region: 'N1' },
  { role: 'RM',  zone: 'North',      region: 'N1' },
  { role: 'RM',  zone: 'North',      region: 'N1' },
  { role: 'SRM', zone: 'North',      region: 'N1' },
  { role: 'RM',  zone: 'North',      region: 'N1' },
  { role: 'RM',  zone: 'North',      region: 'N2' },
  { role: 'RM',  zone: 'North',      region: 'N2' },
  { role: 'RM',  zone: 'North',      region: 'N2' },
  { role: 'SRM', zone: 'North',      region: 'N2' },
  { role: 'RM',  zone: 'North',      region: 'N2' },
  { role: 'RM',  zone: 'North',      region: 'N3' },
  { role: 'RM',  zone: 'North',      region: 'N3' },
  { role: 'SRM', zone: 'North',      region: 'N3' },
  { role: 'RM',  zone: 'North',      region: 'N3' },
  { role: 'RM',  zone: 'North',      region: 'N3' },
  { role: 'RM',  zone: 'North',      region: 'N4' },
  { role: 'RM',  zone: 'North',      region: 'N4' },
  { role: 'RM',  zone: 'North',      region: 'N4' },
  { role: 'RM',  zone: 'North',      region: 'N4' },
  { role: 'SRM', zone: 'North',      region: 'N4' },
  { role: 'RM',  zone: 'South',      region: 'S1' },
  { role: 'SRM', zone: 'South',      region: 'S1' },
  { role: 'RM',  zone: 'South',      region: 'S1' },
  { role: 'RM',  zone: 'South',      region: 'S1' },
  { role: 'RM',  zone: 'South',      region: 'S1' },
  { role: 'RM',  zone: 'South',      region: 'S2' },
  { role: 'RM',  zone: 'South',      region: 'S2' },
  { role: 'RM',  zone: 'South',      region: 'S2' },
  { role: 'RM',  zone: 'South',      region: 'S2' },
  { role: 'RM',  zone: 'South',      region: 'S2' },
  { role: 'RM',  zone: 'South',      region: 'S3' },
  { role: 'SRM', zone: 'South',      region: 'S3' },
  { role: 'RM',  zone: 'South',      region: 'S3' },
  { role: 'RM',  zone: 'South',      region: 'S3' },
  { role: 'RM',  zone: 'South',      region: 'S3' },
  { role: 'RM',  zone: 'South East', region: 'T1' },
  { role: 'SRM', zone: 'South East', region: 'T1' },
  { role: 'RM',  zone: 'South East', region: 'T1' },
  { role: 'RM',  zone: 'South East', region: 'T1' },
  { role: 'RM',  zone: 'South East', region: 'T1' },
  { role: 'RM',  zone: 'South East', region: 'T2' },
  { role: 'RM',  zone: 'South East', region: 'T2' },
  { role: 'RM',  zone: 'South East', region: 'T2' },
  { role: 'SRM', zone: 'South East', region: 'T2' },
  { role: 'SRM', zone: 'South East', region: 'T2' },
  { role: 'RM',  zone: 'West',       region: 'W1' },
  { role: 'RM',  zone: 'West',       region: 'W1' },
  { role: 'SRM', zone: 'West',       region: 'W1' },
  { role: 'RM',  zone: 'West',       region: 'W1' },
  { role: 'SRM', zone: 'West',       region: 'W1' },
  { role: 'RM',  zone: 'West',       region: 'W2' },
  { role: 'RM',  zone: 'West',       region: 'W2' },
  { role: 'RM',  zone: 'West',       region: 'W2' },
  { role: 'RM',  zone: 'West',       region: 'W3' },
  { role: 'RM',  zone: 'West',       region: 'W3' },
];

const uniq = (arr) => Array.from(new Set(arr));

const ALL_ROLES   = uniq(PARTICIPANTS.map((p) => p.role));
const ALL_ZONES   = uniq(PARTICIPANTS.map((p) => p.zone));
const ALL_REGIONS = uniq(PARTICIPANTS.map((p) => p.region));

// =====================================================================
// OTHER PERMISSION GROUPS
// =====================================================================
const TODAY_LIVE_BOXES = [
  { key: 'scheduled',      label: 'Scheduled' },
  { key: 'attempted',      label: 'Attempted' },
  { key: 'absentees',      label: 'Absentees' },
  { key: 'delayed',        label: 'Delayed' },
  { key: 'passRate',       label: 'Pass Rate' },
  { key: 'avgTime',        label: 'Avg Time' },
  { key: 'activeTrainers', label: 'Active Trainers' },
];

const CONTEST_TOTAL_BOXES = [
  { key: 'totalScheduled', label: 'Total Scheduled' },
  { key: 'totalAttempted', label: 'Total Attempted' },
  { key: 'totalAbsentees', label: 'Total Absentees' },
  { key: 'totalDelayed',   label: 'Total Delayed' },
  { key: 'totalResets',    label: 'Total Resets' },
  { key: 'overallPass',    label: 'Overall Pass' },
  { key: 'overallAvg',     label: 'Overall Avg Time' },
];

const METRIC_BOXES = [
  { key: 'trainerAssigned',   label: 'Trainer — Assigned count' },
  { key: 'trainerPassRate',   label: 'Trainer — Pass rate' },
  { key: 'trainerAvgTime',    label: 'Trainer — Avg time' },
  { key: 'participantStatus', label: 'Participant — Status' },
];

const PARTICIPANT_JOURNEY_BOXES = [
  { key: 'rounds',     label: 'Rounds completed' },
  { key: 'percentage', label: 'Percentage' },
  { key: 'totalTime',  label: 'Total Time' },
  { key: 'status',     label: 'Status' },
  { key: 'milestones', label: 'Assessment Milestones' },
];

const TRAINER_JOURNEY_BOXES = [
  { key: 'completed',       label: 'Completed count' },
  { key: 'passRate',        label: 'Pass rate' },
  { key: 'avgTime',         label: 'Avg time' },
  { key: 'roundMilestones', label: 'Round Milestones' },
  { key: 'recentList',      label: 'Recent Participants' },
];

const PERMISSION_GROUPS = [
  { key: 'todayLive',   title: "Today's Live Data Boxes",   subtitle: "Select data boxes to show in today's live section",   icon: Radio,       accent: 'purple',  cols: 4, items: TODAY_LIVE_BOXES },
  { key: 'contest',     title: 'Contest Totals Boxes',      subtitle: 'Select data boxes to show in contest totals section', icon: Trophy,      accent: 'amber',   cols: 4, items: CONTEST_TOTAL_BOXES },
  { key: 'metrics',     title: 'Metric Sections',           subtitle: 'Select metric boxes to display on the dashboard',     icon: BarChart3,   accent: 'sky',     cols: 4, items: METRIC_BOXES },
  { key: 'participant', title: 'Participant Journey Popup', subtitle: 'Select details to show in participant journey popup', icon: Route,       accent: 'violet',  cols: 4, items: PARTICIPANT_JOURNEY_BOXES },
  { key: 'trainer',     title: 'Trainer Journey Popup',     subtitle: 'Select details to show in trainer journey popup',     icon: UserCircle2, accent: 'rose',    cols: 4, items: TRAINER_JOURNEY_BOXES },
];

const ALL_KEYS = [
  'role', 'zone', 'region',
  ...PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => `${g.key}.${i.key}`)),
];

// =====================================================================
// MOCK USERS
// =====================================================================
const MOCK_USERS = [
  { id: 1, username: 'jasmeet',     fullName: 'Jasmeet Kaur',   role: 'Admin' },
  { id: 2, username: 'rahul.ops',   fullName: 'Rahul Mehta',    role: 'Ops Manager' },
  { id: 3, username: 'priya.north', fullName: 'Priya Verma',    role: 'Zone Lead' },
  { id: 4, username: 'vikram.west', fullName: 'Vikram Shah',    role: 'Zone Lead' },
  { id: 5, username: 'anita.south', fullName: 'Anita Rao',      role: 'Viewer' },
  { id: 6, username: 'karan.pb',    fullName: 'Karan Singh',    role: 'Trainer' },
];

const defaultPermissions = () => ({
  role:   Object.fromEntries(ALL_ROLES.map((r)   => [r, false])),
  zone:   Object.fromEntries(ALL_ZONES.map((z)   => [z, false])),
  region: Object.fromEntries(ALL_REGIONS.map((r) => [r, false])),
  ...Object.fromEntries(
    PERMISSION_GROUPS.map((g) => [
      g.key,
      Object.fromEntries(g.items.map((i) => [i.key, true])),
    ])
  ),
});

// =====================================================================
// PAGE
// =====================================================================
export default function RolesPermissions() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [savedMsg, setSavedMsg] = useState('');

  const searchWrapRef = useRef(null);

  const [data, setData] = useState(() =>
    Object.fromEntries(MOCK_USERS.map((u) => [u.id, defaultPermissions()]))
  );

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_USERS;
    return MOCK_USERS.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q)
    );
  }, [search]);

  const selectedUser = MOCK_USERS.find((u) => u.id === selectedUserId);
  const current = selectedUserId ? data[selectedUserId] : null;

  // ---- cascading options ----
  const zoneOptions = useMemo(() => {
    if (!current) return ALL_ZONES;
    const roles = ALL_ROLES.filter((r) => current.role[r]);
    if (roles.length === 0) return ALL_ZONES;
    return uniq(
      PARTICIPANTS.filter((p) => roles.includes(p.role)).map((p) => p.zone)
    );
  }, [current]);

  const regionOptions = useMemo(() => {
    if (!current) return ALL_REGIONS;
    const roles = ALL_ROLES.filter((r) => current.role[r]);
    const zones = ALL_ZONES.filter((z) => current.zone[z]);
    return uniq(
      PARTICIPANTS
        .filter((p) => roles.length === 0 || roles.includes(p.role))
        .filter((p) => zones.length === 0 || zones.includes(p.zone))
        .map((p) => p.region)
    );
  }, [current]);

  // Outside click
  useEffect(() => {
    const onClick = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // ---- updates ----
  const toggleItem = (groupKey, itemKey) => {
    if (!selectedUserId) return;
    const g = current[groupKey];
    setData((prev) => ({
      ...prev,
      [selectedUserId]: {
        ...prev[selectedUserId],
        [groupKey]: { ...g, [itemKey]: !g[itemKey] },
      },
    }));
  };

  const toggleGroup = (groupKey, items) => {
    if (!current) return;
    const g = current[groupKey];
    const allOn = items.every((i) => g[i.key]);
    const updated = { ...g };
    items.forEach((i) => (updated[i.key] = !allOn));
    setData((prev) => ({
      ...prev,
      [selectedUserId]: {
        ...prev[selectedUserId],
        [groupKey]: updated,
      },
    }));
  };

  const handleSelectUser = (u) => {
    setSelectedUserId(u.id);
    setSearch(u.fullName);
    setShowResults(false);
  };

  const clearSelection = () => {
    setSelectedUserId(null);
    setSearch('');
    setShowResults(false);
  };

  const handleSave = () => {
    console.log('Saving:', { userId: selectedUserId, ...current });
    setSavedMsg('Saved');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-[#F7F8FC] font-sans">

      {/* ============== TOP BAR ============== */}
      <header className="shrink-0 flex items-center justify-between gap-3 bg-white px-5 py-3 border-b border-gray-200 z-30">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              Roles & Permissions
            </h1>
            <p className="text-[11px] font-medium text-slate-500">
              Search a user and toggle their permissions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 pl-3 pr-2 py-1 bg-white border border-gray-200 rounded-full">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-black">
              {(user?.username || 'JD').slice(0, 2).toUpperCase()}
            </div>
            <div className="leading-tight">
              <p className="text-[11px] font-black text-slate-900">
                {user?.username || 'Jasmeet'}
              </p>
              <p className="text-[10px] font-medium text-slate-500">Admin</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 rotate-90" />
          </div>
        </div>
      </header>

      {/* ============== SCROLLABLE CONTENT ============== */}
      <main className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-4">

          {/* -------- SEARCH ROW -------- */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="relative w-full max-w-md" ref={searchWrapRef}>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1.5">
                Search User
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowResults(true);
                    if (selectedUserId) setSelectedUserId(null);
                  }}
                  onFocus={() => setShowResults(true)}
                  placeholder="Type name..."
                  className="w-full pl-10 pr-9 py-2.5 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                />
                {search && (
                  <button
                    onClick={clearSelection}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Dropdown results — name only */}
              {showResults && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto z-40">
                  {results.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 py-6">
                      No users match your search
                    </div>
                  ) : (
                    results.map((u) => {
                      const active = u.id === selectedUserId;
                      return (
                        <button
                          key={u.id}
                          onClick={() => handleSelectUser(u)}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left transition border-l-2 ${
                            active
                              ? 'bg-indigo-50 border-indigo-500'
                              : 'border-transparent hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`text-xs font-bold truncate ${
                              active ? 'text-indigo-800' : 'text-slate-800'
                            }`}
                          >
                            {u.fullName}
                          </span>
                          {active && (
                            <Check className="h-4 w-4 text-indigo-600 shrink-0" strokeWidth={3} />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* -------- PERMISSIONS CENTER -------- */}
          {!selectedUser ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
                <UserCog className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-1">
                Select a user to configure permissions
              </h3>
              <p className="text-xs font-medium text-slate-500 max-w-xs">
                Use the search box above to find a user, then toggle their
                permissions below.
              </p>
            </div>
          ) : (
            <>
              {/* Required Filters — Role → Zone → Region */}
              <Card
                icon={Filter}
                accent="emerald"
                title="Required Filters"
                subtitle="Select Role → Zone → Region"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FilterColumn
                    label="Role"
                    options={ALL_ROLES}
                    value={current.role}
                    onToggle={(k) => toggleItem('role', k)}
                    onAll={() => toggleGroup('role', ALL_ROLES.map((r) => ({ key: r })))}
                  />

                  <FilterColumn
                    label="Zone"
                    options={zoneOptions}
                    value={current.zone}
                    onToggle={(k) => toggleItem('zone', k)}
                    onAll={() => toggleGroup('zone', zoneOptions.map((z) => ({ key: z })))}
                  />

                  <FilterColumn
                    label="Region"
                    options={regionOptions}
                    value={current.region}
                    onToggle={(k) => toggleItem('region', k)}
                    onAll={() => toggleGroup('region', regionOptions.map((r) => ({ key: r })))}
                  />
                </div>
              </Card>

              {/* Other permission cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {PERMISSION_GROUPS.map((g) => {
                  const allOn = g.items.every((i) => current[g.key][i.key]);
                  return (
                    <Card
                      key={g.key}
                      icon={g.icon}
                      accent={g.accent}
                      title={g.title}
                      subtitle={g.subtitle}
                      action={
                        <button
                          onClick={() => toggleGroup(g.key, g.items)}
                          className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded hover:bg-indigo-50"
                        >
                          {allOn ? 'Clear' : 'Select All'}
                        </button>
                      }
                    >
                      <TileGrid
                        options={g.items}
                        value={current[g.key]}
                        onToggle={(k) => toggleItem(g.key, k)}
                        columns={g.cols}
                      />
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* ============== FOOTER ============== */}
      <footer className="shrink-0 bg-white border-t border-gray-200 px-5 py-3 flex items-center justify-end z-20">
        <div className="flex items-center gap-3">
          {savedMsg && (
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" strokeWidth={3} /> {savedMsg}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={!selectedUser}
            className={`flex items-center gap-1.5 px-5 py-2 text-white text-xs font-bold rounded-lg shadow-sm transition ${
              selectedUser
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <Save className="h-3.5 w-3.5" />
            Save Permissions
          </button>
        </div>
      </footer>
    </div>
  );
}

// =====================================================================
// SUB-COMPONENTS
// =====================================================================
const ACCENTS = {
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  chip: 'bg-indigo-50 text-indigo-600'  },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-600' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  chip: 'bg-purple-50 text-purple-600'  },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   chip: 'bg-amber-50 text-amber-600'   },
  sky:     { bg: 'bg-sky-50',     text: 'text-sky-600',     chip: 'bg-sky-50 text-sky-600'       },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  chip: 'bg-violet-50 text-violet-600' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    chip: 'bg-rose-50 text-rose-600'     },
};

function Card({ icon: Icon, accent = 'indigo', title, subtitle, badge, action, children }) {
  const a = ACCENTS[accent];
  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`shrink-0 h-9 w-9 rounded-xl ${a.bg} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${a.text}`} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[13px] font-black text-slate-900 truncate">{title}</h2>
            <p className="text-[11px] font-medium text-slate-500 truncate">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge && (
            <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-md ${a.chip}`}>
              {badge}
            </span>
          )}
          {action}
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

// Grid tiles — bigger checkbox, no label truncation
function TileGrid({ options, value, onToggle, columns = 4 }) {
  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${
          columns === 4 ? '140px' : '180px'
        }, 1fr))`,
      }}
    >
      {options.map((o) => {
        const active = value[o.key];
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onToggle(o.key)}
            className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-2 text-left transition ${
              active
                ? 'border-indigo-200 bg-indigo-50/40'
                : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span
              className={`shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition ${
                active ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'
              }`}
            >
              {active && <Check className="h-3 w-3 text-white" strokeWidth={4} />}
            </span>
            <span
              className={`text-[11px] font-bold leading-tight ${
                active ? 'text-slate-900' : 'text-slate-600'
              }`}
            >
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Compact filter column — bigger chips, bigger checkbox, taller scroll area
function FilterColumn({ label, options, value, onToggle, onAll }) {
  const allOn = options.length > 0 && options.every((o) => value[o]);

  return (
    <div className="flex flex-col border border-slate-200 rounded-xl bg-slate-50/40 overflow-hidden">
      {/* Column header — bigger text */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2">
        <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
          {label}
        </span>
        <button
          onClick={onAll}
          disabled={options.length === 0}
          className={`text-[11px] font-black uppercase tracking-wide px-2 py-1 rounded transition whitespace-nowrap ${
            options.length === 0
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
          }`}
        >
          {allOn ? 'Clear' : 'All'}
        </button>
      </div>

      {/* Chip area — taller, bigger chips */}
      <div className="h-[180px] overflow-y-auto p-3 flex flex-wrap gap-2 content-start">
        {options.length === 0 ? (
          <p className="text-xs font-medium text-slate-400 italic p-1">
            No options
          </p>
        ) : (
          options.map((o) => {
            const active = value[o];
            return (
              <button
                key={o}
                type="button"
                onClick={() => onToggle(o)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-xs font-bold leading-tight transition ${
                  active
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${
                    active
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'bg-white border-slate-300'
                  }`}
                >
                  {active && (
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={5} />
                  )}
                </span>
                <span className="whitespace-nowrap">{o}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}