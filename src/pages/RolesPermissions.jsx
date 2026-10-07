import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronRight, Save, Check, ShieldCheck, Search, X, UserCog,
  Radio, Trophy, BarChart3, Route, UserCircle2,
  Users, MapPin, Globe2,
  CheckCircle2, XCircle,
} from 'lucide-react';
import { useAuth } from '../service/auth.jsx';

// =====================================================================
// MASTER DATA
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
  { key: 'trainerAssigned',   label: 'Trainer — Assigned' },
  { key: 'trainerPassRate',   label: 'Trainer — Pass Rate' },
  { key: 'trainerAvgTime',    label: 'Trainer — Avg Time' },
  { key: 'participantStatus', label: 'Participant — Status' },
];

const PARTICIPANT_JOURNEY_BOXES = [
  { key: 'rounds',     label: 'Rounds Completed' },
  { key: 'percentage', label: 'Percentage' },
  { key: 'totalTime',  label: 'Total Time' },
  { key: 'status',     label: 'Status' },
  { key: 'milestones', label: 'Assessment Milestones' },
];

const TRAINER_JOURNEY_BOXES = [
  { key: 'completed',       label: 'Completed Count' },
  { key: 'passRate',        label: 'Pass Rate' },
  { key: 'avgTime',         label: 'Avg Time' },
  { key: 'roundMilestones', label: 'Round Milestones' },
  { key: 'recentList',      label: 'Recent Participants' },
];

const PERMISSION_GROUPS = [
  { key: 'todayLive',   title: "Today's Live Data",   subtitle: 'Data boxes shown in the today section', icon: Radio,       items: TODAY_LIVE_BOXES },
  { key: 'contest',     title: 'Contest Totals',      subtitle: 'Data boxes shown in contest totals',    icon: Trophy,      items: CONTEST_TOTAL_BOXES },
  { key: 'metrics',     title: 'Metric Sections',     subtitle: 'Metrics displayed on the dashboard',    icon: BarChart3,   items: METRIC_BOXES },
  { key: 'participant', title: 'Participant Journey', subtitle: 'Fields shown in the participant popup', icon: Route,       items: PARTICIPANT_JOURNEY_BOXES },
  { key: 'trainer',     title: 'Trainer Journey',     subtitle: 'Fields shown in the trainer popup',     icon: UserCircle2, items: TRAINER_JOURNEY_BOXES },
];

const MOCK_USERS = [
  { id: 1, fullName: 'Pankaj Kumar' },
  { id: 2, fullName: 'Rahul Mehta'  },
  { id: 3, fullName: 'Priya Verma'  },
  { id: 4, fullName: 'Vikram Shah'  },
  { id: 5, fullName: 'Anita Rao'    },
  { id: 6, fullName: 'Karan Singh'  },
];

const defaultPermissions = () => ({
  role:   Object.fromEntries(ALL_ROLES.map((r)   => [r, false])),
  zone:   Object.fromEntries(ALL_ZONES.map((z)   => [z, false])),
  region: Object.fromEntries(ALL_REGIONS.map((r) => [r, false])),
  ...Object.fromEntries(
    PERMISSION_GROUPS.map((g) => [
      g.key,
      Object.fromEntries(g.items.map((i) => [i.key, false])),
    ])
  ),
});

// =====================================================================
// PAGE
// =====================================================================
export default function RolesPermissions() {
  const { user } = useAuth();

  const [search, setSearch]                 = useState('');
  const [showResults, setShowResults]       = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [savedMsg, setSavedMsg]             = useState('');

  const searchWrapRef = useRef(null);

  const [data, setData] = useState(() =>
    Object.fromEntries(MOCK_USERS.map((u) => [u.id, defaultPermissions()]))
  );

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_USERS;
    return MOCK_USERS.filter((u) => u.fullName.toLowerCase().includes(q));
  }, [search]);

  const selectedUser = MOCK_USERS.find((u) => u.id === selectedUserId);
  const current      = selectedUserId ? data[selectedUserId] : null;

  const zoneOptions = useMemo(() => {
    if (!current) return ALL_ZONES;
    const roles = ALL_ROLES.filter((r) => current.role[r]);
    if (roles.length === 0) return ALL_ZONES;
    return uniq(PARTICIPANTS.filter((p) => roles.includes(p.role)).map((p) => p.zone));
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

  useEffect(() => {
    const onClick = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggleItem = (groupKey, itemKey) => {
    if (!selectedUserId) return;
    setData((prev) => ({
      ...prev,
      [selectedUserId]: {
        ...prev[selectedUserId],
        [groupKey]: { ...prev[selectedUserId][groupKey], [itemKey]: !prev[selectedUserId][groupKey][itemKey] },
      },
    }));
  };

  const toggleAllKeys = (groupKey, keys) => {
    if (!current) return;
    const g = current[groupKey];
    const allOn = keys.every((k) => g[k]);
    const updated = { ...g };
    keys.forEach((k) => (updated[k] = !allOn));
    setData((prev) => ({
      ...prev,
      [selectedUserId]: { ...prev[selectedUserId], [groupKey]: updated },
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

  const ROWS = selectedUser
    ? [
        {
          kind: 'single',
          icon: Users,
          title: 'Role',
          subtitle: 'Job roles this user can access',
          groupKey: 'role',
          options: ALL_ROLES.map((r) => ({ key: r, label: r })),
        },
        {
          kind: 'single',
          icon: MapPin,
          title: 'Zone',
          subtitle: current.role && Object.values(current.role).some(Boolean)
            ? 'Zones available for the selected roles'
            : 'All zones (no roles selected)',
          groupKey: 'zone',
          options: zoneOptions.map((z) => ({ key: z, label: z })),
        },
        {
          kind: 'single',
          icon: Globe2,
          title: 'Region',
          subtitle: 'Regions available for the selected roles & zones',
          groupKey: 'region',
          options: regionOptions.map((r) => ({ key: r, label: r })),
        },
        ...PERMISSION_GROUPS.map((g) => ({
          kind: 'group',
          icon: g.icon,
          title: g.title,
          subtitle: g.subtitle,
          group: g,
        })),
      ]
    : [];

  return (
    <div className="h-screen flex flex-col bg-[#F7F8FC] font-sans">

      <header className="shrink-0 flex items-center justify-between gap-3 bg-white px-5 py-3 border-b border-gray-200 z-30">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Roles & Permissions
          </h1>
          <p className="text-[11px] font-medium text-slate-500">
            Search a user and toggle their permissions
          </p>
        </div>

        <div className="flex items-center gap-2.5 pl-3 pr-2 py-1 bg-white border border-gray-200 rounded-full">
          <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-black">
            {(user?.name || 'AD').slice(0, 2).toUpperCase()}
          </div>
          <p className="text-[11px] font-black text-slate-900">
            {user?.name || 'Admin'}
          </p>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 rotate-90" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
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
                className="w-full pl-10 pr-9 py-2.5 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
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
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition border-l-2 ${
                          active ? 'bg-blue-50 border-blue-500' : 'border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <span className={`text-xs font-bold truncate ${active ? 'text-blue-800' : 'text-slate-800'}`}>
                          {u.fullName}
                        </span>
                        {active && <Check className="h-4 w-4 text-blue-600 shrink-0" strokeWidth={3} />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {!selectedUser ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm py-20 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
              <UserCog className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-1">
              Select a user to configure permissions
            </h3>
            <p className="text-xs font-medium text-slate-500 max-w-xs">
              Use the search box above to find a user, then toggle their permissions below.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-[260px]">
                    Section
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Options
                  </th>
                  <th className="text-center px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-[110px]">
                    Selected
                  </th>
                  <th className="text-center px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-[120px]">
                    Toggle All
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, idx) => {
                  const Icon = row.icon;

                  let options, value, onToggle, onToggleAll;

                  if (row.kind === 'single') {
                    options     = row.options;
                    value       = current[row.groupKey];
                    onToggle    = (k) => toggleItem(row.groupKey, k);
                    onToggleAll = () => toggleAllKeys(row.groupKey, options.map((o) => o.key));
                  } else {
                    const g = row.group;
                    options     = g.items.map((i) => ({ key: i.key, label: i.label }));
                    value       = current[g.key];
                    onToggle    = (k) => toggleItem(g.key, k);
                    onToggleAll = () => toggleAllKeys(g.key, options.map((o) => o.key));
                  }

                  const selectedCount = Object.values(value).filter(Boolean).length;
                  const totalCount    = options.length;
                  const allOn         = selectedCount === totalCount && totalCount > 0;

                  return (
                    <tr
                      key={row.title}
                      className={`align-top ${
                        idx !== ROWS.length - 1 ? 'border-b border-slate-100' : ''
                      } hover:bg-blue-50/30 transition`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Icon className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-black text-slate-900 leading-tight">
                              {row.title}
                            </p>
                            <p className="text-[10px] font-medium text-slate-500 mt-0.5 leading-tight">
                              {row.subtitle}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {options.length === 0 ? (
                          <p className="text-[11px] italic text-slate-400">
                            No options available
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {options.map((o) => (
                              <Pill
                                key={o.key}
                                label={o.label}
                                active={!!value[o.key]}
                                onClick={() => onToggle(o.key)}
                              />
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="inline-block text-[11px] font-black px-2 py-1 rounded-md bg-blue-50 text-blue-700">
                          {selectedCount} / {totalCount}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={onToggleAll}
                          disabled={totalCount === 0}
                          className={`text-[11px] font-black px-3 py-1.5 rounded-md border transition ${
                            totalCount === 0
                              ? 'bg-white border-slate-200 text-slate-300 cursor-not-allowed'
                              : allOn
                                ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {allOn ? 'Clear All' : 'Select All'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

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
              selectedUser ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'
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
// PILL — same style as SetupPanel
// =====================================================================
function Pill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold border transition ${
        active
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'bg-white border-slate-200 text-slate-500 hover:bg-blue-50/60'
      }`}
    >
      {active ? (
        <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
      ) : (
        <XCircle className="h-3 w-3" strokeWidth={2.5} />
      )}
      {label}
    </button>
  );
}