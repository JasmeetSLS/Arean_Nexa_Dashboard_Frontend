import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Bell, Save, Check,
  Building2, Filter, Radio, Trophy, BarChart3,
  Route, UserCircle2, Settings2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../service/auth.jsx';

// =====================================================================
// DATA
// =====================================================================
const FILTER_FIELDS = [
  { key: 'zone',       label: 'Zone' },
  { key: 'region',     label: 'Region' },
  { key: 'areaOffice', label: 'Area Office' },
  { key: 'trainer',    label: 'Trainer' },
  { key: 'role',       label: 'Role' },
  { key: 'agency',     label: 'Agency' },
  { key: 'dealerName', label: 'Dealer Name' },
  { key: 'dealerCode', label: 'Dealer Code' },
];

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

// =====================================================================
// PAGE
// =====================================================================
export default function SetupPanel() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [projectName, setProjectName] = useState('');

  const [selectedFilters, setSelectedFilters] = useState(() =>
    Object.fromEntries(FILTER_FIELDS.map((f) => [f.key, true]))
  );

  const [todayBoxes, setTodayBoxes] = useState(
    Object.fromEntries(TODAY_LIVE_BOXES.map((b) => [b.key, true]))
  );
  const [contestBoxes, setContestBoxes] = useState(
    Object.fromEntries(CONTEST_TOTAL_BOXES.map((b) => [b.key, true]))
  );
  const [metricBoxes, setMetricBoxes] = useState(
    Object.fromEntries(METRIC_BOXES.map((b) => [b.key, true]))
  );
  const [participantJourneyBoxes, setParticipantJourneyBoxes] = useState(
    Object.fromEntries(PARTICIPANT_JOURNEY_BOXES.map((b) => [b.key, true]))
  );
  const [trainerJourneyBoxes, setTrainerJourneyBoxes] = useState(
    Object.fromEntries(TRAINER_JOURNEY_BOXES.map((b) => [b.key, true]))
  );

  const [savedMsg, setSavedMsg] = useState('');

  const toggleFilter = (key) =>
    setSelectedFilters((s) => ({ ...s, [key]: !s[key] }));
  const toggle = (setter) => (key) =>
    setter((s) => ({ ...s, [key]: !s[key] }));

  const handleSave = () => {
    setSavedMsg('Saved');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-[#F7F8FC] font-sans">

      {/* ============== TOP BAR ============== */}
      <header className="shrink-0 flex items-center justify-between gap-3 bg-white px-5 py-3 border-b border-gray-200 z-20">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-indigo-600" />
              Setup Panel
            </h1>
            <p className="text-[11px] font-medium text-slate-500">
              Configure your contest settings and dashboard preferences
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
      <main className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Row 1: Project + Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Project */}
          <Card
            icon={Building2}
            accent="indigo"
            title="Project Information"
            subtitle="Name this contest project"
          >
            <div>
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1.5">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                className="w-full px-3 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
              />
            </div>
          </Card>

          {/* Required Filters */}
          <Card
            icon={Filter}
            accent="emerald"
            title="Required Filters"
            subtitle="Select filters to apply for the dashboard"
            badge={`${Object.values(selectedFilters).filter(Boolean).length} Filters`}
          >
            <TileGrid
              options={FILTER_FIELDS}
              value={selectedFilters}
              onToggle={toggleFilter}
              accent="emerald"
              columns={4}
            />
          </Card>
        </div>

        {/* Row 2: Today's Live + Contest Totals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <Card
            icon={Radio}
            accent="purple"
            title="Today's Live Data Boxes"
            subtitle="Select data boxes to show in today's live section"
            badge={`${Object.values(todayBoxes).filter(Boolean).length} Selected`}
          >
            <TileGrid
              options={TODAY_LIVE_BOXES}
              value={todayBoxes}
              onToggle={toggle(setTodayBoxes)}
              accent="purple"
              columns={4}
            />
          </Card>

          <Card
            icon={Trophy}
            accent="amber"
            title="Contest Totals Boxes"
            subtitle="Select data boxes to show in contest totals section"
            badge={`${Object.values(contestBoxes).filter(Boolean).length} Selected`}
          >
            <TileGrid
              options={CONTEST_TOTAL_BOXES}
              value={contestBoxes}
              onToggle={toggle(setContestBoxes)}
              accent="amber"
              columns={4}
            />
          </Card>
        </div>

        {/* Row 3: Metrics + Participant Journey + Trainer Journey */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <Card
            icon={BarChart3}
            accent="sky"
            title="Metric Sections"
            subtitle="Select metric boxes to display on the dashboard"
            badge={`${Object.values(metricBoxes).filter(Boolean).length} Selected`}
          >
            <TileGrid
              options={METRIC_BOXES}
              value={metricBoxes}
              onToggle={toggle(setMetricBoxes)}
              accent="sky"
              columns={2}
            />
          </Card>

          <Card
            icon={Route}
            accent="violet"
            title="Participant Journey Popup"
            subtitle="Select details to show in participant journey popup"
            badge={`${Object.values(participantJourneyBoxes).filter(Boolean).length} Selected`}
          >
            <TileGrid
              options={PARTICIPANT_JOURNEY_BOXES}
              value={participantJourneyBoxes}
              onToggle={toggle(setParticipantJourneyBoxes)}
              accent="violet"
              columns={2}
            />
          </Card>

          <Card
            icon={UserCircle2}
            accent="rose"
            title="Trainer Journey Popup"
            subtitle="Select details to show in trainer journey popup"
            badge={`${Object.values(trainerJourneyBoxes).filter(Boolean).length} Selected`}
          >
            <TileGrid
              options={TRAINER_JOURNEY_BOXES}
              value={trainerJourneyBoxes}
              onToggle={toggle(setTrainerJourneyBoxes)}
              accent="rose"
              columns={2}
            />
          </Card>
        </div>
      </main>

      {/* ============== FOOTER BAR ============== */}
      <footer className="shrink-0 bg-white border-t border-gray-200 px-5 py-3 flex items-center justify-end z-20">
        <div className="flex items-center gap-3">
          {savedMsg && (
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" strokeWidth={3} /> {savedMsg}
            </p>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Save className="h-3.5 w-3.5" />
            Save Setup
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

function Card({ icon: Icon, accent = 'indigo', title, subtitle, badge, children }) {
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
        {badge && (
          <span className={`shrink-0 text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-md ${a.chip}`}>
            {badge}
          </span>
        )}
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
                active
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'bg-white border-slate-300'
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