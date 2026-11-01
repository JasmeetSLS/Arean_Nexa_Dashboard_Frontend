import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Loader2 } from 'lucide-react';
import {
  // Arena
  exportArenaDailyReport,
  exportArenaOverallAttendance,
  exportArenaOverallResult,
  exportArenaWinner,
  getArenaFilters,
  // TV
  exportTVMorning,
  exportTVOverallAttendance,
  exportTVOverallResult,
  exportTVWinner,
  exportTVWinnersZIP,
  getTVFilters,
} from '../service/api.js';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export default function ReportModal({
  isOpen,
  onClose,
  project: initialProject,
  date: initialDate,
}) {
  const [activeTab, setActiveTab] = useState('morning');
  const [reportType, setReportType] = useState('arena'); // 'arena' | 'tv'
  const [downloading, setDownloading] = useState(false);

  /* ---------- Arena filters ---------- */
  const [projects, setProjects] = useState([]);      // string[]
  const [dates, setDates] = useState([]);            // string[] for the selected project
  const [selectedProject, setSelectedProject] = useState(initialProject || '');
  const [selectedDate, setSelectedDate] = useState(initialDate || '');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);

  /* ---------- TV filters ---------- */
  const [tvDates, setTVDates] = useState([]);
  const [tvLevels, setTVLevels] = useState([]);
  const [selectedTVDate, setSelectedTVDate] = useState('');
  const [selectedTVLevel, setSelectedTVLevel] = useState('');
  const [loadingTVFilters, setLoadingTVFilters] = useState(false);

  /* -------- which filters does the current tab need? -------- */
  const needsProject =
    reportType === 'arena' &&
    (activeTab === 'morning' || activeTab === 'overall' || activeTab === 'winner');

  const needsDate = activeTab === 'morning'; // both Arena & TV need date only on Morning
  const needsLevel = reportType === 'tv' && activeTab === 'winner';
  const needsNothing = !needsProject && !needsDate && !needsLevel;

  /* ---------- Load Arena PROJECTS (no project passed) ---------- */
  useEffect(() => {
    if (!isOpen || reportType !== 'arena') return;
    (async () => {
      try {
        setLoadingProjects(true);
        const { data } = await getArenaFilters(); // no params → { projects: string[] }
        if (data?.success) {
          const list = data.projects || [];
          setProjects(list);
          if (!selectedProject && list.length > 0) {
            setSelectedProject(list[0]);
          }
        }
      } catch (e) {
        console.error('Failed to load Arena projects', e);
      } finally {
        setLoadingProjects(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reportType]);

  /* ---------- Load Arena DATES for the selected project ---------- */
  useEffect(() => {
    if (!isOpen || reportType !== 'arena' || !selectedProject) return;
    (async () => {
      try {
        setLoadingDates(true);
        const { data } = await getArenaFilters({ project: selectedProject }); // { project, dates }
        if (data?.success) {
          const list = data.dates || [];
          setDates(list);
          if (list.length && !list.includes(selectedDate)) setSelectedDate(list[0]);
          if (!list.length) setSelectedDate('');
        }
      } catch (e) {
        console.error('Failed to load Arena dates', e);
      } finally {
        setLoadingDates(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reportType, selectedProject]);

  /* ---------- Load TV filters ---------- */
  useEffect(() => {
    if (!isOpen || reportType !== 'tv') return;
    (async () => {
      try {
        setLoadingTVFilters(true);
        const { data } = await getTVFilters();
        if (data?.success) {
          setTVDates(data.dates || []);
          setTVLevels(data.levels || []);
          if (!selectedTVDate && data.dates?.length) setSelectedTVDate(data.dates[0]);
          if (!selectedTVLevel && data.levels?.length) setSelectedTVLevel(data.levels[0]);
        }
      } catch (e) {
        console.error('Failed to load TV filters', e);
      } finally {
        setLoadingTVFilters(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reportType]);

  if (!isOpen) return null;

  /* ---------- file-type helper ---------- */
  const fileMetaFor = (type) => {
    if (reportType === 'tv' && type === 'morning')
      return { ext: 'zip', mime: 'application/zip' };
    if (reportType === 'tv' && type === 'winner-zip')
      return { ext: 'zip', mime: 'application/zip' };
    return { ext: 'xlsx', mime: XLSX_MIME };
  };

  /* ---------- download handler ---------- */
  const handleDownload = async (type) => {
    // Guard required filters
    if (needsProject && !selectedProject) return alert('Please select a project.');
    if (reportType === 'arena' && activeTab === 'morning' && !selectedDate)
      return alert('Please select a date.');
    if (reportType === 'tv' && activeTab === 'morning' && !selectedTVDate)
      return alert('Please select a date.');
    if (reportType === 'tv' && (type === 'winner' || type === 'winner-zip') && !selectedTVLevel)
      return alert('Please select a level.');

    setDownloading(true);
    try {
      let res;

      /* -------- ARENA -------- */
      if (reportType === 'arena') {
        if (type === 'morning') {
          // GET /export-arena-daily-report?project=...&date=...
          res = await exportArenaDailyReport({
            project: selectedProject,
            date: selectedDate,
          });
        } else if (type === 'attendance') {
          // GET /arena-overall-attendance  (no params — backend uses today)
          res = await exportArenaOverallAttendance();
        } else if (type === 'overall') {
          // GET /export-arena-overall-result?project=...
          res = await exportArenaOverallResult({ project: selectedProject });
        } else if (type === 'winner') {
          // GET /export-arena-winner?project=...
          res = await exportArenaWinner({ project: selectedProject });
        }
      }
      /* -------- TV -------- */
      else {
        if (type === 'morning') {
          res = await exportTVMorning({ date: selectedTVDate });
        } else if (type === 'attendance') {
          res = await exportTVOverallAttendance();
        } else if (type === 'overall') {
          res = await exportTVOverallResult();
        } else if (type === 'winner') {
          res = await exportTVWinner({ level: selectedTVLevel });
        } else if (type === 'winner-zip') {
          res = await exportTVWinnersZIP({ level: selectedTVLevel });
        }
      }

      const { ext, mime } = fileMetaFor(type);
      const baseName =
        reportType === 'tv'
          ? [
              'tv',
              type,
              type === 'morning' ? selectedTVDate : '',
              type === 'winner' || type === 'winner-zip' ? selectedTVLevel : '',
            ]
              .filter(Boolean)
              .join('_')
          : [
              'arena',
              type,
              String(selectedProject).replace(/[^a-z0-9]/gi, '_'),
              type === 'morning' ? selectedDate : '',
            ]
              .filter(Boolean)
              .join('_');

      const blob = new Blob([res.data], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to download the report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const tabs = [
    { id: 'morning', label: 'Daily Hourly' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'overall', label: 'Overall Result' },
    { id: 'winner', label: 'Winners' },
  ];

  const isTV = reportType === 'tv';
  const showLoader = loadingProjects || loadingDates || loadingTVFilters;

  /* ---------- render ---------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header with Arena / TV switch */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <FileText className="h-5 w-5" /> Excel Reports
            </h2>
            <div className="flex bg-white/15 rounded-lg p-0.5">
              <button
                onClick={() => setReportType('arena')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  !isTV ? 'bg-white text-indigo-700 shadow' : 'text-white/80 hover:text-white'
                }`}
              >
                Arena
              </button>
              <button
                onClick={() => setReportType('tv')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  isTV ? 'bg-white text-indigo-700 shadow' : 'text-white/80 hover:text-white'
                }`}
              >
                TV
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-end gap-3 min-h-[64px]">
          {showLoader && (
            <div className="flex items-center text-xs text-gray-400 w-full">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading filters...
            </div>
          )}

          {!showLoader && (
            <>
              {/* Project (Arena tabs that need it) */}
              {needsProject && (
                <div className="flex flex-col gap-1 w-1/2">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    Project
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="" disabled>Select Project</option>
                    {projects.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date */}
              {needsDate && (
                <div className="flex flex-col gap-1 w-1/2">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    Date
                  </label>
                  {reportType === 'arena' ? (
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      disabled={!selectedProject || dates.length === 0}
                      className="border border-gray-300 rounded px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">-- Select Date --</option>
                      {dates.map((d) => (<option key={d} value={d}>{d}</option>))}
                    </select>
                  ) : (
                    <select
                      value={selectedTVDate}
                      onChange={(e) => setSelectedTVDate(e.target.value)}
                      disabled={tvDates.length === 0}
                      className="border border-gray-300 rounded px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">-- Select Date --</option>
                      {tvDates.map((d) => (<option key={d} value={d}>{d}</option>))}
                    </select>
                  )}
                </div>
              )}

              {/* Level (TV winners only) */}
              {needsLevel && (
                <div className="flex flex-col gap-1 w-1/2">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    Level
                  </label>
                  <select
                    value={selectedTVLevel}
                    onChange={(e) => setSelectedTVLevel(e.target.value)}
                    disabled={tvLevels.length === 0}
                    className="border border-gray-300 rounded px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">-- Select Level --</option>
                    {tvLevels.map((l) => (<option key={l} value={l}>{l}</option>))}
                  </select>
                </div>
              )}

              {/* Info when no filter required */}
              {needsNothing && (
                <div className="text-xs text-slate-500 italic w-full">
                  This report includes <b>all available data</b> — no filters required.
                </div>
              )}
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-700 bg-gray-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* MORNING */}
          {activeTab === 'morning' && (
            <div className="text-center space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                <h3 className="font-bold text-slate-800 mb-1">
                  {isTV ? 'TV Daily Hourly Report (ZIP)' : 'Arena Daily Hourly Report'}
                </h3>
                <p className="text-xs text-slate-600 mb-2">
                  {isTV
                    ? 'Downloads a ZIP containing the Main Round Status and Attendance Excel files for the selected date.'
                    : 'Generates a multi-sheet Excel file (Summary & Status) for the selected project and date.'}
                </p>
              </div>
              <button
                onClick={() => handleDownload('morning')}
                disabled={
                  downloading ||
                  (isTV ? !selectedTVDate : (!selectedDate || !selectedProject))
                }
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                <Download className="h-4 w-4" />{' '}
                {downloading ? 'Generating...' : 'Download Morning Report'}
              </button>
            </div>
          )}

          {/* ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="text-center space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                <h3 className="font-bold text-slate-800 mb-1">
                  {isTV ? 'TV Overall Attendance' : 'Arena Overall Attendance'}
                </h3>
                <p className="text-xs text-slate-600 mb-2">
                  {isTV
                    ? 'Generates an Excel file with overall attendance across all TV dates.'
                    : 'Generates an Excel file split by L1 and L2 tabs with attendance (Appeared / Pending / Absent) as of today.'}
                </p>
              </div>
              <button
                onClick={() => handleDownload('attendance')}
                disabled={downloading}
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                <Download className="h-4 w-4" />{' '}
                {downloading ? 'Generating...' : 'Download Attendance Report'}
              </button>
            </div>
          )}

          {/* OVERALL */}
          {activeTab === 'overall' && (
            <div className="text-center space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                <h3 className="font-bold text-slate-800 mb-1">
                  {isTV ? 'TV Overall Result' : 'Arena Overall Result'}
                </h3>
                <p className="text-xs text-slate-600 mb-2">
                  {isTV
                    ? 'Generates a Summary and detailed Status sheet with TV R1 and Main Round aggregated stats.'
                    : 'Generates a Summary and detailed Status sheet showing R1 and Main Round aggregated stats for the selected project.'}
                </p>
              </div>
              <button
                onClick={() => handleDownload('overall')}
                disabled={downloading || (needsProject && !selectedProject)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                <Download className="h-4 w-4" />{' '}
                {downloading ? 'Generating...' : 'Download Overall Result'}
              </button>
            </div>
          )}

          {/* WINNERS */}
          {activeTab === 'winner' && (
            <div className="text-center space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                <h3 className="font-bold text-slate-800 mb-1">
                  {isTV ? 'TV Winners Report' : 'Arena Winners Report'}
                </h3>
                <p className="text-xs text-slate-600 mb-2">
                  {isTV
                    ? 'Download a single consolidated winners Excel (per role sheets), or a ZIP with one Excel per region.'
                    : 'Generates a Winner Summary with dynamic category scores and ranks (1, 2, 3) for the selected project.'}
                </p>
              </div>

              <button
                onClick={() => handleDownload('winner')}
                disabled={downloading || (isTV ? !selectedTVLevel : !selectedProject)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                <Download className="h-4 w-4" />{' '}
                {downloading ? 'Generating...' : 'Download Winners Report'}
              </button>

              {isTV && (
                <button
                  onClick={() => handleDownload('winner-zip')}
                  disabled={downloading || !selectedTVLevel}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  <Download className="h-4 w-4" />{' '}
                  {downloading ? 'Preparing ZIP...' : 'Download All Winners (ZIP)'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}