import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronRight, Save, Check, Plus, RefreshCw, X,
  Building2, Settings2, Clock, Target, Hash, Percent,
  AlertCircle, Calendar,
} from 'lucide-react';
import { useAuth } from '../service/auth.jsx';
import { getProjects, addProject } from '../service/api';

const EMPTY_FORM = {
  projectName:       '',
  totalRounds:       5,
  totalScore:        100,
  passingPercentage: 80,
  trainerTimeSecs:   4800,     // 01:20:00
  status:            'active',
};

const secsToHms = (s) => {
  const sec = Number(s) || 0;
  const h  = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m  = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${ss}`;
};
const hmsToSecs = (hms) => {
  if (!hms) return 0;
  const [h = '0', m = '0', s = '0'] = String(hms).split(':');
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
};

export default function SetupPanel() {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);

  const [showPopup, setShowPopup] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [errMsg, setErrMsg]       = useState('');
  const [okMsg, setOkMsg]         = useState('');

  // ---- load list ----
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getProjects();
      if (data?.success) setProjects(data.projects || []);
    } catch (err) {
      console.error('[project load]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // ---- popup helpers ----
  const openPopup = () => {
    setForm(EMPTY_FORM);
    setErrMsg('');
    setOkMsg('');
    setShowPopup(true);
  };
  const closePopup = () => {
    if (saving) return;
    setShowPopup(false);
  };

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  // ---- save ----
  const handleSave = async () => {
    setErrMsg('');
    setOkMsg('');

    if (!form.projectName.trim()) {
      setErrMsg('Project name is required');
      return;
    }

    try {
      setSaving(true);
      const { data } = await addProject({
        projectName:       form.projectName.trim(),
        totalRounds:       Number(form.totalRounds),
        totalScore:        Number(form.totalScore),
        passingPercentage: Number(form.passingPercentage),
        trainerTimeSecs:   Number(form.trainerTimeSecs),
        status:            form.status,
      });

      if (data?.success) {
        setOkMsg(`Project created (id ${data.id})`);
        setForm(EMPTY_FORM);
        await loadProjects();
        setTimeout(() => setShowPopup(false), 800);
      } else {
        setErrMsg(data?.error || 'Save failed');
      }
    } catch (err) {
      console.error('[project save]', err);
      setErrMsg(err?.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
      setTimeout(() => { setOkMsg(''); setErrMsg(''); }, 2500);
    }
  };

  const trainerTimeStr = secsToHms(form.trainerTimeSecs);

  return (
    <div className="h-screen flex flex-col bg-[#F7F8FC] font-sans">

      {/* HEADER */}
      <header className="shrink-0 flex items-center justify-between gap-3 bg-white px-5 py-3 border-b border-slate-200 z-20">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-blue-600" />
            Project Setup
          </h1>
          <p className="text-[11px] font-medium text-slate-500">
            Manage your contest projects
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

        {/* LIST HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-black text-slate-900">
              Projects <span className="text-slate-400 font-medium">({projects.length})</span>
            </h2>
            <p className="text-[11px] font-medium text-slate-500">
              All projects configured in the system
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadProjects}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-black text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={openPopup}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black rounded-lg shadow-sm transition"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
              Create Project
            </button>
          </div>
        </div>

        {/* PROJECT LIST */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center text-xs text-slate-400 py-10">Loading…</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-14">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-50 mb-3">
                <Building2 className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-sm font-black text-slate-800">No projects yet</p>
              <p className="text-[11px] font-medium text-slate-500 mt-1">
                Click <b>Create Project</b> to add your first one
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-[60px]">#</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Project Name</th>
                    <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-[110px]">Rounds</th>
                    <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-[110px]">Score</th>
                    <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-[110px]">Pass %</th>
                    <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-[130px]">Trainer Time</th>
                    <th className="text-center px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-[100px]">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider w-[170px]">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p, i) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-100 hover:bg-blue-50/40 transition"
                    >
                      <td className="px-4 py-3 text-[11px] font-black text-slate-400">
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Building2 className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <span className="text-[12px] font-black text-slate-800">
                            {p.projectName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-[12px] font-bold text-slate-700">
                        {p.totalRounds}
                      </td>
                      <td className="px-4 py-3 text-center text-[12px] font-bold text-slate-700">
                        {p.totalScore}
                      </td>
                      <td className="px-4 py-3 text-center text-[12px] font-bold text-slate-700">
                        {p.passingPercentage}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                          <Clock className="h-3 w-3" />
                          {secsToHms(p.trainerTimeSecs)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                          p.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-600'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-medium text-slate-500">
                        {p.createdAt ? new Date(p.createdAt).toLocaleString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ===== CREATE PROJECT POPUP ===== */}
      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closePopup}
        >
          <div
            className="mx-4 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Popup header */}
            <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="shrink-0 h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-white" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-blue-100 uppercase tracking-wider">
                    NEW PROJECT
                  </p>
                  <h2 className="text-lg font-black text-white">Create Project</h2>
                </div>
              </div>
              <button
                onClick={closePopup}
                className="text-white/70 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Popup body */}
            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">

              <Field label="Project Name" icon={Building2} required>
                <input
                  type="text"
                  value={form.projectName}
                  onChange={(e) => update({ projectName: e.target.value })}
                  placeholder="e.g. Arena L3"
                  autoFocus
                  className="w-full px-3 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />
              </Field>

              <Field label="Status" icon={Check}>
                <select
                  value={form.status}
                  onChange={(e) => update({ status: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </Field>

              <Field label="Total Rounds" icon={Hash} required>
                <input
                  type="number" min="1" max="20"
                  value={form.totalRounds}
                  onChange={(e) => update({ totalRounds: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />
              </Field>

              <Field label="Total Score" icon={Target} required>
                <input
                  type="number" min="1"
                  value={form.totalScore}
                  onChange={(e) => update({ totalScore: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />
              </Field>

              <Field label="Passing %" icon={Percent} required>
                <input
                  type="number" min="0" max="100" step="0.01"
                  value={form.passingPercentage}
                  onChange={(e) => update({ passingPercentage: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />
              </Field>

              <Field label="Trainer Time (HH:MM:SS)" icon={Clock} required>
                <input
                  type="text"
                  value={trainerTimeStr}
                  onChange={(e) => update({ trainerTimeSecs: hmsToSecs(e.target.value) })}
                  placeholder="01:20:00"
                  className="w-full px-3 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                />
                <p className="text-[10px] font-medium text-slate-400 mt-1">
                  = {form.trainerTimeSecs} seconds
                </p>
              </Field>
            </div>

            {/* Popup messages */}
            {(okMsg || errMsg) && (
              <div className="px-6 pb-2">
                {okMsg && (
                  <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} /> {okMsg}
                  </p>
                )}
                {errMsg && (
                  <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" strokeWidth={3} /> {errMsg}
                  </p>
                )}
              </div>
            )}

            {/* Popup footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={closePopup}
                disabled={saving}
                className="px-4 py-2 text-xs font-black text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Saving…' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- field wrapper ----------
function Field({ label, icon: Icon, required, children }) {
  return (
    <div className="flex flex-col">
      <label className="flex items-center gap-1.5 text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}