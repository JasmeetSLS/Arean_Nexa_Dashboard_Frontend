import React, { useState, useEffect } from 'react';
import {
  ChevronRight, Save, Check, CheckCircle2, XCircle,
  Building2, Filter, Radio, Trophy, BarChart3,
  Route, UserCircle2, Settings2,
} from 'lucide-react';
import { useAuth } from '../service/auth.jsx';
import { getSetup, saveSetup } from '../service/api';

// =====================================================================
// FLAT FIELD LIST
//   field_group : section
//   field_key   : column key
//   name        : display label
//   field_order : order INSIDE its group  (1, 2, 3 …)
//   sort_order  : order of the GROUP itself (filters=1, todayLive=2, …)
// =====================================================================
export const FIELDS = [
  // ---------- filters  (sort_order = 1) ----------
  { field_group: 'filters', field_key: 'zone',       name: 'Zone',        field_order: 1, sort_order: 1 },
  { field_group: 'filters', field_key: 'region',     name: 'Region',      field_order: 2, sort_order: 1 },
  { field_group: 'filters', field_key: 'areaOffice', name: 'Area Office', field_order: 3, sort_order: 1 },
  { field_group: 'filters', field_key: 'trainer',    name: 'Trainer',     field_order: 4, sort_order: 1 },
  { field_group: 'filters', field_key: 'role',       name: 'Role',        field_order: 5, sort_order: 1 },
  { field_group: 'filters', field_key: 'agency',     name: 'Agency',      field_order: 6, sort_order: 1 },
  { field_group: 'filters', field_key: 'dealerName', name: 'Dealer Name', field_order: 7, sort_order: 1 },
  { field_group: 'filters', field_key: 'dealerCode', name: 'Dealer Code', field_order: 8, sort_order: 1 },

  // ---------- todayLive  (sort_order = 2) ----------
  { field_group: 'todayLive', field_key: 'scheduled',      name: 'Scheduled',       field_order: 1, sort_order: 2 },
  { field_group: 'todayLive', field_key: 'attempted',      name: 'Attempted',       field_order: 2, sort_order: 2 },
  { field_group: 'todayLive', field_key: 'absentees',      name: 'Absentees',       field_order: 3, sort_order: 2 },
  { field_group: 'todayLive', field_key: 'delayed',        name: 'Delayed',         field_order: 4, sort_order: 2 },
  { field_group: 'todayLive', field_key: 'passRate',       name: 'Pass Rate',       field_order: 5, sort_order: 2 },
  { field_group: 'todayLive', field_key: 'avgTime',        name: 'Avg Time',        field_order: 6, sort_order: 2 },
  { field_group: 'todayLive', field_key: 'activeTrainers', name: 'Active Trainers', field_order: 7, sort_order: 2 },

  // ---------- contest  (sort_order = 3) ----------
  { field_group: 'contest', field_key: 'totalScheduled', name: 'Total Scheduled',   field_order: 1, sort_order: 3 },
  { field_group: 'contest', field_key: 'totalAttempted', name: 'Total Attempted',   field_order: 2, sort_order: 3 },
  { field_group: 'contest', field_key: 'totalAbsentees', name: 'Total Absentees',   field_order: 3, sort_order: 3 },
  { field_group: 'contest', field_key: 'totalDelayed',   name: 'Total Delayed',     field_order: 4, sort_order: 3 },
  { field_group: 'contest', field_key: 'totalResets',    name: 'Total Resets',      field_order: 5, sort_order: 3 },
  { field_group: 'contest', field_key: 'overallPass',    name: 'Overall Pass',      field_order: 6, sort_order: 3 },
  { field_group: 'contest', field_key: 'overallAvg',     name: 'Overall Avg Time',  field_order: 7, sort_order: 3 },

  // ---------- metrics  (sort_order = 4) ----------
  { field_group: 'metrics', field_key: 'trainerAssigned',   name: 'Trainer — Assigned',   field_order: 1, sort_order: 4 },
  { field_group: 'metrics', field_key: 'trainerPassRate',   name: 'Trainer — Pass Rate',  field_order: 2, sort_order: 4 },
  { field_group: 'metrics', field_key: 'trainerAvgTime',    name: 'Trainer — Avg Time',   field_order: 3, sort_order: 4 },
  { field_group: 'metrics', field_key: 'participantStatus', name: 'Participant — Status', field_order: 4, sort_order: 4 },

  // ---------- participantJourney  (sort_order = 5) ----------
  { field_group: 'participantJourney', field_key: 'rounds',     name: 'Rounds Completed',      field_order: 1, sort_order: 5 },
  { field_group: 'participantJourney', field_key: 'percentage', name: 'Percentage',            field_order: 2, sort_order: 5 },
  { field_group: 'participantJourney', field_key: 'totalTime',  name: 'Total Time',            field_order: 3, sort_order: 5 },
  { field_group: 'participantJourney', field_key: 'status',     name: 'Status',                field_order: 4, sort_order: 5 },
  { field_group: 'participantJourney', field_key: 'milestones', name: 'Assessment Milestones', field_order: 5, sort_order: 5 },

  // ---------- trainerJourney  (sort_order = 6) ----------
  { field_group: 'trainerJourney', field_key: 'completed',       name: 'Completed Count',     field_order: 1, sort_order: 6 },
  { field_group: 'trainerJourney', field_key: 'passRate',        name: 'Pass Rate',           field_order: 2, sort_order: 6 },
  { field_group: 'trainerJourney', field_key: 'avgTime',         name: 'Avg Time',            field_order: 3, sort_order: 6 },
  { field_group: 'trainerJourney', field_key: 'roundMilestones', name: 'Round Milestones',    field_order: 4, sort_order: 6 },
  { field_group: 'trainerJourney', field_key: 'recentList',      name: 'Recent Participants', field_order: 5, sort_order: 6 },
];

// section meta (title/icon/subtitle) used only for rendering
const SECTION_META = {
  filters:            { icon: Filter,      title: 'Required Filters',    subtitle: 'Filters visible on the dashboard' },
  todayLive:          { icon: Radio,       title: "Today's Live Data",   subtitle: 'Data boxes shown in the today section' },
  contest:            { icon: Trophy,      title: 'Contest Totals',      subtitle: 'Data boxes shown in contest totals' },
  metrics:            { icon: BarChart3,   title: 'Metric Sections',     subtitle: 'Metrics displayed on the dashboard' },
  participantJourney: { icon: Route,       title: 'Participant Journey', subtitle: 'Fields shown in the participant popup' },
  trainerJourney:     { icon: UserCircle2, title: 'Trainer Journey',     subtitle: 'Fields shown in the trainer popup' },
};

const GROUP_ORDER = [
  'filters', 'todayLive', 'contest',
  'metrics', 'participantJourney', 'trainerJourney',
];

export default function SetupPanel() {
  const { user } = useAuth();
  const [projectName, setProjectName] = useState('');
  // selection keyed by `${group}::${key}` → bool
  const [selected, setSelected] = useState({});
  const [savedMsg, setSavedMsg] = useState('');

  // ---- load ----
  useEffect(() => {
    (async () => {
      try {
        const { data } = await getSetup();
        if (!data?.success) return;
        setProjectName(data.setup?.projectName || '');
        const map = {};
        (data.fields || []).forEach((f) => {
          map[`${f.field_group}::${f.field_key}`] = !!f.is_selected;
        });
        setSelected(map);
      } catch (err) {
        console.error('[setup load]', err);
      }
    })();
  }, []);

  const isOn      = (g, k) => !!selected[`${g}::${k}`];
  const toggleOne = (g, k) =>
    setSelected((s) => ({ ...s, [`${g}::${k}`]: !s[`${g}::${k}`] }));
  const toggleAll = (groupFields) => {
    setSelected((s) => {
      const allOn = groupFields.every((f) => s[`${f.field_group}::${f.field_key}`]);
      const next = { ...s };
      groupFields.forEach((f) => {
        next[`${f.field_group}::${f.field_key}`] = !allOn;
      });
      return next;
    });
  };

  // ---- save : sends FLAT array, orders come from FIELDS definition ----
  const handleSave = async () => {
    if (!projectName.trim()) {
      setSavedMsg('Enter a project name');
      setTimeout(() => setSavedMsg(''), 2000);
      return;
    }

    try {
      const fields = FIELDS.map((f) => ({
        field_group: f.field_group,
        field_key:   f.field_key,
        field_order: f.field_order,   // defined in FIELDS above
        sort_order:  f.sort_order,    // defined in FIELDS above
        is_selected: isOn(f.field_group, f.field_key),
      }));

      const { data } = await saveSetup({ projectName: projectName.trim(), fields });
      setSavedMsg(data?.success ? 'Saved' : (data?.error || 'Save failed'));
    } catch (err) {
      console.error('[setup save]', err);
      setSavedMsg(err?.response?.data?.error || 'Save failed');
    } finally {
      setTimeout(() => setSavedMsg(''), 2000);
    }
  };

  // ---- build rows for render (grouped for display, still flat data) ----
  const rows = GROUP_ORDER.map((group) => {
    const groupFields = FIELDS
      .filter((f) => f.field_group === group)
      .sort((a, b) => a.field_order - b.field_order);
    const meta = SECTION_META[group];
    const onCount = groupFields.filter((f) => isOn(group, f.field_key)).length;
    return { group, meta, groupFields, onCount, total: groupFields.length };
  });

  return (
    <div className="h-screen flex flex-col bg-[#F7F8FC] font-sans">
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

        {/* Configuration Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-[280px]">Section</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Options</th>
                <th className="text-center px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-[110px]">Selected</th>
                <th className="text-center px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-[120px]">Toggle All</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const Icon = row.meta.icon;
                const allOn = row.onCount === row.total;
                return (
                  <tr key={row.group}
                      className={`align-top ${idx !== rows.length - 1 ? 'border-b border-slate-100' : ''} hover:bg-blue-50/30 transition`}>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Icon className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-black text-slate-900 leading-tight">{row.meta.title}</p>
                          <p className="text-[10px] font-medium text-slate-500 mt-0.5 leading-tight">{row.meta.subtitle}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {row.groupFields.map((o) => {
                          const active = isOn(o.field_group, o.field_key);
                          return (
                            <button
                              key={`${o.field_group}::${o.field_key}`}
                              type="button"
                              onClick={() => toggleOne(o.field_group, o.field_key)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold border transition ${
                                active
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-blue-50/50'
                              }`}
                            >
                              {active
                                ? <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                                : <XCircle className="h-3 w-3" strokeWidth={2.5} />}
                              {o.name}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="inline-block text-[11px] font-black px-2 py-1 rounded-md bg-blue-50 text-blue-700">
                        {row.onCount} / {row.total}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleAll(row.groupFields)}
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