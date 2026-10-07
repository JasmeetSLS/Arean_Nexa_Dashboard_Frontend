import React, { useState } from 'react';
import {
  ChevronRight, Save, Check, CheckCircle2, XCircle,
  Building2, Filter, Radio, Trophy, BarChart3,
  Route, UserCircle2, Settings2,
} from 'lucide-react';
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

// =====================================================================
// PAGE
// =====================================================================
export default function SetupPanel() {
  const { user } = useAuth();

  const [projectName, setProjectName] = useState('');

  const [selectedFilters, setSelectedFilters] = useState(() =>
    Object.fromEntries(FILTER_FIELDS.map((f) => [f.key, false]))
  );
  const [todayBoxes, setTodayBoxes] = useState(
    Object.fromEntries(TODAY_LIVE_BOXES.map((b) => [b.key, false]))
  );
  const [contestBoxes, setContestBoxes] = useState(
    Object.fromEntries(CONTEST_TOTAL_BOXES.map((b) => [b.key, false]))
  );
  const [metricBoxes, setMetricBoxes] = useState(
    Object.fromEntries(METRIC_BOXES.map((b) => [b.key, false]))
  );
  const [participantJourneyBoxes, setParticipantJourneyBoxes] = useState(
    Object.fromEntries(PARTICIPANT_JOURNEY_BOXES.map((b) => [b.key, false]))
  );
  const [trainerJourneyBoxes, setTrainerJourneyBoxes] = useState(
    Object.fromEntries(TRAINER_JOURNEY_BOXES.map((b) => [b.key, false]))
  );

  const [savedMsg, setSavedMsg] = useState('');

  const toggleOne = (setter) => (key) =>
    setter((s) => ({ ...s, [key]: !s[key] }));

  const toggleAll = (setter, options) => () =>
    setter((s) => {
      const allOn = options.every((o) => s[o.key]);
      const next = {};
      options.forEach((o) => { next[o.key] = !allOn; });
      return next;
    });

  const handleSave = () => {
    setSavedMsg('Saved');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const ROWS = [
    {
      icon: Filter,
      title: 'Required Filters',
      subtitle: 'Filters visible on the dashboard',
      options: FILTER_FIELDS,
      value: selectedFilters,
      setter: setSelectedFilters,
    },
    {
      icon: Radio,
      title: "Today's Live Data",
      subtitle: 'Data boxes shown in the today section',
      options: TODAY_LIVE_BOXES,
      value: todayBoxes,
      setter: setTodayBoxes,
    },
    {
      icon: Trophy,
      title: 'Contest Totals',
      subtitle: 'Data boxes shown in contest totals',
      options: CONTEST_TOTAL_BOXES,
      value: contestBoxes,
      setter: setContestBoxes,
    },
    {
      icon: BarChart3,
      title: 'Metric Sections',
      subtitle: 'Metrics displayed on the dashboard',
      options: METRIC_BOXES,
      value: metricBoxes,
      setter: setMetricBoxes,
    },
    {
      icon: Route,
      title: 'Participant Journey',
      subtitle: 'Fields shown in the participant popup',
      options: PARTICIPANT_JOURNEY_BOXES,
      value: participantJourneyBoxes,
      setter: setParticipantJourneyBoxes,
    },
    {
      icon: UserCircle2,
      title: 'Trainer Journey',
      subtitle: 'Fields shown in the trainer popup',
      options: TRAINER_JOURNEY_BOXES,
      value: trainerJourneyBoxes,
      setter: setTrainerJourneyBoxes,
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#F7F8FC] font-sans">

      {/* ============== TOP BAR ============== */}
      <header className="shrink-0 flex items-center justify-between gap-3 bg-white px-5 py-3 border-b border-slate-200 z-20">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-blue-600" />
            Setup Panel
          </h1>
          <p className="text-[11px] font-medium text-slate-500">
            Configure your contest settings and dashboard preferences
          </p>
        </div>

        <div className="flex items-center gap-2.5 pl-3 pr-2 py-1 bg-white border border-slate-200 rounded-full">
          <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-black">
            {(user?.name || 'AD').slice(0, 2).toUpperCase()}
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-black text-slate-900">{user?.name || 'Admin'}</p>
            <p className="text-[10px] font-medium text-slate-500 capitalize">{user?.type || 'Admin'}</p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 rotate-90" />
        </div>
      </header>

      {/* ============== SCROLLABLE CONTENT ============== */}
      <main className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Project Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
            <div className="shrink-0 h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-[13px] font-black text-slate-900">Project Information</h2>
              <p className="text-[11px] font-medium text-slate-500">Name this contest project</p>
            </div>
          </div>
          <div className="px-5 py-4">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1.5">
              Project Name
            </label>
           <input
  type="text"
  value={projectName}
  onChange={(e) => setProjectName(e.target.value)}
  placeholder="Enter project name"
  className="w-full max-w-md px-3 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
/>
          </div>
        </div>

        {/* ============== CONFIGURATION TABLE ============== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-[280px]">
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
                const selectedCount = Object.values(row.value).filter(Boolean).length;
                const totalCount = row.options.length;
                const allOn = selectedCount === totalCount;

                return (
                  <tr
                    key={row.title}
                    className={`align-top ${
                      idx !== ROWS.length - 1 ? 'border-b border-slate-100' : ''
                    } hover:bg-blue-50/30 transition`}
                  >
                    {/* Section */}
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

                    {/* Options */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {row.options.map((o) => {
                          const active = row.value[o.key];
                          return (
                            <button
                              key={o.key}
                              type="button"
                              onClick={() => toggleOne(row.setter)(o.key)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold border transition ${
                                active
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-blue-50/50'
                              }`}
                            >
                              {active ? (
                                <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                              ) : (
                                <XCircle className="h-3 w-3" strokeWidth={2.5} />
                              )}
                              {o.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Selected count */}
                    <td className="px-5 py-4 text-center">
                      <span className="inline-block text-[11px] font-black px-2 py-1 rounded-md bg-blue-50 text-blue-700">
                        {selectedCount} / {totalCount}
                      </span>
                    </td>

                    {/* Toggle all */}
                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={toggleAll(row.setter, row.options)}
                        className={`text-[11px] font-black px-3 py-1.5 rounded-md border transition ${
                          allOn
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
      </main>

      {/* ============== FOOTER ============== */}
      <footer className="shrink-0 bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-end z-20">
        <div className="flex items-center gap-3">
          {savedMsg && (
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" strokeWidth={3} /> {savedMsg}
            </p>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Save className="h-3.5 w-3.5" />
            Save Setup
          </button>
        </div>
      </footer>
    </div>
  );
}