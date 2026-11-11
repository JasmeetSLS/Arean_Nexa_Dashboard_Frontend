import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Loader2, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import { usePermissions } from '../context/PermissionContext.jsx'; // ✅ Import Context
import {
  // Arena
  exportArenaDailyReport,
  exportArenaOverallAttendance,
  exportArenaOverallResult,
  exportArenaWinner,
  getArenaFilters,
  // Nexa
  exportNexaDailyReport,
  exportNexaOverallAttendance,
  exportNexaOverallResult,
  getNexaFilters,
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

/* ---------- Auto-detect number of header rows ---------- */
const getHeaderCount = (sheetName, rows) => {
  if (!rows || rows.length === 0) return 0;
  if (sheetName === 'Summary') return 2;
  
  const firstRow = rows[0] || [];
  const emptyCount = firstRow.filter(c => String(c ?? '').trim() === '').length;
  if (firstRow.length > 0 && emptyCount / firstRow.length > 0.3) {
    return 2;
  }
  
  return 1;
};

export default function ReportModal({
  isOpen,
  onClose,
  project: initialProject,
  date: initialDate,
}) {
  // ✅ Get permissions
  const { perms } = usePermissions();
  
  // ✅ Check what they are allowed to see
  const allowedArena = perms?.pages?.report_arena !== false;
  const allowedNexa  = perms?.pages?.report_nexa !== false;
  const allowedTV    = perms?.pages?.report_tv !== false;

  const [activeTab, setActiveTab] = useState('morning');
  
  // ✅ Set default report type based on what they have access to
  const [reportType, setReportType] = useState(
    allowedArena ? 'arena' : allowedNexa ? 'nexa' : 'tv'
  );
  
  const [downloading, setDownloading] = useState(false);

  /* ---------- Preview state ---------- */
  const [preview, setPreview] = useState(null);   
  const [activeSheet, setActiveSheet] = useState(0);
  const [visibleRowCount, setVisibleRowCount] = useState(500); 

  /* ---------- Arena filters ---------- */
  const [projects, setProjects] = useState([]);
  const [dates, setDates] = useState([]);
  const [selectedProject, setSelectedProject] = useState(initialProject || '');
  const [selectedDate, setSelectedDate] = useState(initialDate || '');
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);

  /* ---------- Nexa filters ---------- */
  const [nexaProjects, setNexaProjects] = useState([]);
  const [nexaDates, setNexaDates] = useState([]);
  const [selectedNexaProject, setSelectedNexaProject] = useState('');
  const [selectedNexaDate, setSelectedNexaDate] = useState('');

  /* ---------- TV filters ---------- */
  const [tvDates, setTVDates] = useState([]);
  const [tvLevels, setTVLevels] = useState([]);
  const [selectedTVDate, setSelectedTVDate] = useState('');
  const [selectedTVLevel, setSelectedTVLevel] = useState('');
  const [loadingTVFilters, setLoadingTVFilters] = useState(false);

  const isTV = reportType === 'tv';
  const isNexa = reportType === 'nexa';

  /* -------- which filters does the current tab need? -------- */
  const needsProject = 
    (reportType === 'arena' && (activeTab === 'morning' || activeTab === 'overall' || activeTab === 'winner')) ||
    (reportType === 'nexa' && (activeTab === 'morning' || activeTab === 'overall'));
    
  const needsDate = 
    (reportType === 'arena' && activeTab === 'morning') ||
    (reportType === 'nexa' && activeTab === 'morning') ||
    (reportType === 'tv' && activeTab === 'morning');
    
  const needsLevel = reportType === 'tv' && activeTab === 'winner';
  
  const needsNothing = !needsProject && !needsDate && !needsLevel;

  /* ---------- Ensure the current tab is valid when switching report types ---------- */
  useEffect(() => {
    if (isNexa && !['morning', 'attendance', 'overall'].includes(activeTab)) {
      setActiveTab('morning');
    }
  }, [reportType, isNexa, activeTab]);

  /* ---------- Load Arena PROJECTS ---------- */
  useEffect(() => {
    if (!isOpen || reportType !== 'arena') return;
    (async () => {
      try {
        setLoadingProjects(true);
        const { data } = await getArenaFilters();
        if (data?.success) {
          const list = data.projects || [];
          setProjects(list);
          if (!selectedProject && list.length > 0) setSelectedProject(list[0]);
        }
      } catch (e) { console.error('Failed to load Arena projects', e); }
      finally { setLoadingProjects(false); }
    })();
  }, [isOpen, reportType]);

  /* ---------- Load Arena DATES ---------- */
  useEffect(() => {
    if (!isOpen || reportType !== 'arena' || !selectedProject) return;
    (async () => {
      try {
        setLoadingDates(true);
        const { data } = await getArenaFilters({ project: selectedProject });
        if (data?.success) {
          const list = data.dates || [];
          setDates(list);
          if (list.length && !list.includes(selectedDate)) setSelectedDate(list[0]);
          if (!list.length) setSelectedDate('');
        }
      } catch (e) { console.error('Failed to load Arena dates', e); }
      finally { setLoadingDates(false); }
    })();
  }, [isOpen, reportType, selectedProject]);

  /* ---------- Load Nexa PROJECTS ---------- */
  useEffect(() => {
    if (!isOpen || reportType !== 'nexa') return;
    (async () => {
      try {
        setLoadingProjects(true);
        const { data } = await getNexaFilters();
        if (data?.success) {
          const list = data.projects || [];
          setNexaProjects(list);
          if (!selectedNexaProject && list.length > 0) setSelectedNexaProject(list[0]);
        }
      } catch (e) { console.error('Failed to load Nexa projects', e); }
      finally { setLoadingProjects(false); }
    })();
  }, [isOpen, reportType]);

  /* ---------- Load Nexa DATES ---------- */
  useEffect(() => {
    if (!isOpen || reportType !== 'nexa' || !selectedNexaProject) return;
    (async () => {
      try {
        setLoadingDates(true);
        const { data } = await getNexaFilters({ project: selectedNexaProject });
        if (data?.success) {
          const list = data.dates || [];
          setNexaDates(list);
          if (list.length && !list.includes(selectedNexaDate)) setSelectedNexaDate(list[0]);
          if (!list.length) setSelectedNexaDate('');
        }
      } catch (e) { console.error('Failed to load Nexa dates', e); }
      finally { setLoadingDates(false); }
    })();
  }, [isOpen, reportType, selectedNexaProject]);

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
      } catch (e) { console.error('Failed to load TV filters', e); }
      finally { setLoadingTVFilters(false); }
    })();
  }, [isOpen, reportType]);

  /* ---------- Reset preview on close ---------- */
  useEffect(() => {
    if (!isOpen) {
      setPreview(null);
      setActiveSheet(0);
      setVisibleRowCount(500);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  /* ---------- file-type helper ---------- */
  const fileMetaFor = (type) => {
    if (reportType === 'tv' && type === 'morning') return { ext: 'zip', mime: 'application/zip' };
    if (reportType === 'tv' && type === 'winner-zip') return { ext: 'zip', mime: 'application/zip' };
    return { ext: 'xlsx', mime: XLSX_MIME };
  };

  /* ---------- download handler ---------- */
  const handleDownload = async (type) => {
    if (needsProject && reportType === 'arena' && !selectedProject) return alert('Please select a project.');
    if (needsProject && reportType === 'nexa' && !selectedNexaProject) return alert('Please select a project.');
    if (reportType === 'arena' && activeTab === 'morning' && !selectedDate) return alert('Please select a date.');
    if (reportType === 'nexa' && activeTab === 'morning' && !selectedNexaDate) return alert('Please select a date.');
    if (reportType === 'tv' && activeTab === 'morning' && !selectedTVDate) return alert('Please select a date.');
    if (reportType === 'tv' && (type === 'winner' || type === 'winner-zip') && !selectedTVLevel)
      return alert('Please select a level.');

    setDownloading(true);
    try {
      let res;

      if (reportType === 'arena') {
        if (type === 'morning')       res = await exportArenaDailyReport({ project: selectedProject, date: selectedDate });
        else if (type === 'attendance') res = await exportArenaOverallAttendance();
        else if (type === 'overall')  res = await exportArenaOverallResult({ project: selectedProject });
        else if (type === 'winner')   res = await exportArenaWinner({ project: selectedProject });
      } else if (reportType === 'nexa') {
        if (type === 'morning')       res = await exportNexaDailyReport({ project: selectedNexaProject, date: selectedNexaDate });
        else if (type === 'attendance') res = await exportNexaOverallAttendance();
        else if (type === 'overall')  res = await exportNexaOverallResult({ project: selectedNexaProject });
      } else {
        if (type === 'morning')         res = await exportTVMorning({ date: selectedTVDate });
        else if (type === 'attendance') res = await exportTVOverallAttendance();
        else if (type === 'overall')    res = await exportTVOverallResult();
        else if (type === 'winner')     res = await exportTVWinner({ level: selectedTVLevel });
        else if (type === 'winner-zip') res = await exportTVWinnersZIP({ level: selectedTVLevel });
      }

      const { ext, mime } = fileMetaFor(type);
      
      let baseName = '';
      if (reportType === 'arena') {
        baseName = ['arena', type, String(selectedProject).replace(/[^a-z0-9]/gi, '_'), type === 'morning' ? selectedDate : ''].filter(Boolean).join('_');
      } else if (reportType === 'nexa') {
        baseName = ['nexa', type, String(selectedNexaProject).replace(/[^a-z0-9]/gi, '_'), type === 'morning' ? selectedNexaDate : ''].filter(Boolean).join('_');
      } else {
        baseName = ['tv', type, type === 'morning' ? selectedTVDate : '', (type === 'winner' || type === 'winner-zip') ? selectedTVLevel : ''].filter(Boolean).join('_');
      }
      
      const filename = `${baseName}.${ext}`;
      const blob = new Blob([res.data], { type: mime });

      if (ext === 'zip') {
        setPreview({ blob, filename, isZip: true, sheets: [] });
      } else {
        const buf = await blob.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const sheets = wb.SheetNames.map((name) => ({
          name,
          rows: XLSX.utils.sheet_to_json(wb.Sheets[name], {
            header: 1, 
            defval: '', 
            raw: false, 
            blankrows: false,
          }),
        }));
        setPreview({ blob, filename, isZip: false, sheets });
      }
      setActiveSheet(0);
      setVisibleRowCount(500);
    } catch (err) {
      console.error(err);
      alert('Failed to load the report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  /* ---------- confirm download from preview ---------- */
  const handleConfirmDownload = () => {
    if (!preview) return;
    const url = URL.createObjectURL(preview.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = preview.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const allTabs = [
    { id: 'morning', label: 'Daily Hourly' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'overall', label: 'Overall Result' },
    { id: 'winner', label: 'Winners' },
  ];

  const tabs = allTabs.filter(tab => {
    if (reportType === 'nexa') return ['morning', 'attendance', 'overall'].includes(tab.id);
    return true;
  });

  const showLoader = loadingProjects || loadingDates || loadingTVFilters;

  /* ---------- derived preview rows ---------- */
  const activeSheetName = preview?.sheets?.[activeSheet]?.name;
  const activeRows = preview?.sheets?.[activeSheet]?.rows || [];
  
  const headerCount = getHeaderCount(activeSheetName, activeRows);
  const headerRows = activeRows.slice(0, headerCount);
  const dataRows   = activeRows.slice(headerCount);
  const combined   = [...headerRows, ...dataRows];
  
  const previewRows = combined.slice(0, visibleRowCount);
  const maxCols    = previewRows.reduce((m, r) => Math.max(m, r.length), 0);

  /* ---------- render ---------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className={`w-full ${preview ? 'max-w-7xl' : 'max-w-5xl'} bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]`}>
        
        {/* Header with toggle switch */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <FileText className="h-5 w-5" /> Excel Reports
            </h2>
            <div className="flex bg-white/15 rounded-lg p-0.5">
              
              {/* ✅ Only show buttons for allowed reports */}
              {allowedArena && (
                <button
                  onClick={() => setReportType('arena')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                    reportType === 'arena' ? 'bg-white text-indigo-700 shadow' : 'text-white/80 hover:text-white'
                  }`}
                >Arena</button>
              )}
              
              {allowedNexa && (
                <button
                  onClick={() => setReportType('nexa')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                    reportType === 'nexa' ? 'bg-white text-indigo-700 shadow' : 'text-white/80 hover:text-white'
                  }`}
                >Nexa</button>
              )}
              
              {allowedTV && (
                <button
                  onClick={() => setReportType('tv')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                    reportType === 'tv' ? 'bg-white text-indigo-700 shadow' : 'text-white/80 hover:text-white'
                  }`}
                >TV</button>
              )}

            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ==================== PREVIEW VIEW ==================== */}
        {preview && (
          <>
            <div className="px-5 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
              <button
                onClick={() => setPreview(null)}
                className="flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <span className="text-[11px] text-slate-500 font-mono truncate max-w-[420px]">
                {preview.filename}
              </span>
            </div>

            {preview.isZip ? (
              <div className="p-10 text-center space-y-3">
                <p className="text-sm text-slate-700 font-semibold">
                  This report is a ZIP archive — it can't be previewed inline.
                </p>
                <p className="text-xs text-slate-500">
                  Click <b>Download</b> below to save it.
                </p>
              </div>
            ) : (
              <>
                {/* sheet tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
                  {preview.sheets.map((s, i) => (
                    <button
                      key={s.name}
                      onClick={() => {
                        setActiveSheet(i);
                        setVisibleRowCount(500); // reset pagination
                      }}
                      className={`px-4 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
                        activeSheet === i
                          ? 'border-indigo-600 text-indigo-700 bg-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >{s.name}</button>
                  ))}
                </div>

                {/* table */}
                <div className="overflow-auto max-h-[55vh] p-3 bg-white">
                  {previewRows.length === 0 ? (
                    <div className="text-xs italic text-slate-500 p-6 text-center">
                      Empty sheet
                    </div>
                  ) : (
                    <>
                      <table className="text-[11px] border-collapse">
                        <tbody>
                          {previewRows.map((row, ri) => (
                            <tr key={ri} className={ri < headerCount ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'}>
                              {Array.from({ length: maxCols }).map((_, ci) => (
                                <td key={ci} className="border border-slate-200 px-2 py-1 whitespace-nowrap">
                                  {String(row[ci] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {/* Load More Button */}
                      {combined.length > previewRows.length && (
                        <div className="mt-4 text-center">
                          <button
                            onClick={() => setVisibleRowCount(prev => prev + 500)}
                            className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition"
                          >
                            Load More Rows (Showing {previewRows.length} of {combined.length})
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            <div className="px-5 py-3 border-t bg-gray-50 flex justify-end">
              <button
                onClick={handleConfirmDownload}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition"
              >
                <Download className="h-4 w-4" /> Download {preview.isZip ? 'ZIP' : 'Excel'}
              </button>
            </div>
          </>
        )}

        {/* ==================== CONFIG VIEW ==================== */}
        {!preview && (
          <>
            {/* Filters */}
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-end gap-3 min-h-[64px]">
              {showLoader && (
                <div className="flex items-center text-xs text-gray-400 w-full">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading filters...
                </div>
              )}

              {!showLoader && (
                <>
                  {/* Arena Project Selector */}
                  {reportType === 'arena' && needsProject && (
                    <div className="flex flex-col gap-1 w-1/2">
                      <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Project</label>
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="" disabled>Select Project</option>
                        {projects.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Nexa Project Selector */}
                  {reportType === 'nexa' && needsProject && (
                    <div className="flex flex-col gap-1 w-1/2">
                      <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Nexa Project</label>
                      <select
                        value={selectedNexaProject}
                        onChange={(e) => setSelectedNexaProject(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="" disabled>Select Project</option>
                        {nexaProjects.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  )}

                  {needsDate && (
                    <div className="flex flex-col gap-1 w-1/2">
                      <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Date</label>
                      {reportType === 'arena' && (
                        <select
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          disabled={!selectedProject || dates.length === 0}
                          className="border border-gray-300 rounded px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <option value="">-- Select Date --</option>
                          {dates.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      )}
                      {reportType === 'nexa' && (
                        <select
                          value={selectedNexaDate}
                          onChange={(e) => setSelectedNexaDate(e.target.value)}
                          disabled={!selectedNexaProject || nexaDates.length === 0}
                          className="border border-gray-300 rounded px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <option value="">-- Select Date --</option>
                          {nexaDates.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      )}
                      {reportType === 'tv' && (
                        <select
                          value={selectedTVDate}
                          onChange={(e) => setSelectedTVDate(e.target.value)}
                          disabled={tvDates.length === 0}
                          className="border border-gray-300 rounded px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <option value="">-- Select Date --</option>
                          {tvDates.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      )}
                    </div>
                  )}

                  {needsLevel && (
                    <div className="flex flex-col gap-1 w-1/2">
                      <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Level</label>
                      <select
                        value={selectedTVLevel}
                        onChange={(e) => setSelectedTVLevel(e.target.value)}
                        disabled={tvLevels.length === 0}
                        className="border border-gray-300 rounded px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="">-- Select Level --</option>
                        {tvLevels.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  )}

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
                >{tab.label}</button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto">
              {/* --- MORNING --- */}
              {activeTab === 'morning' && (
                <div className="text-center space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                    <h3 className="font-bold text-slate-800 mb-1">
                      {isTV ? 'TV Daily Hourly Report (ZIP)' : isNexa ? 'Nexa Daily Hourly Report' : 'Arena Daily Hourly Report'}
                    </h3>
                    <p className="text-xs text-slate-600 mb-2">
                      {isTV
                        ? 'Downloads a ZIP containing the Main Round Status and Attendance Excel files for the selected date.'
                        : 'Generates a multi-sheet Excel file (Summary & Status) for the selected project and date.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload('morning')}
                    disabled={downloading || (isTV ? !selectedTVDate : isNexa ? (!selectedNexaDate || !selectedNexaProject) : (!selectedDate || !selectedProject))}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    <Download className="h-4 w-4" />{' '}
                    {downloading
                      ? 'Generating...'
                      : isTV
                      ? 'Download Morning Report (ZIP)'
                      : 'Preview / Download Morning Report'}
                  </button>
                </div>
              )}

              {/* --- ATTENDANCE --- */}
              {activeTab === 'attendance' && (
                <div className="text-center space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                    <h3 className="font-bold text-slate-800 mb-1">
                      {isTV ? 'TV Overall Attendance' : isNexa ? 'Nexa Overall Attendance' : 'Arena Overall Attendance'}
                    </h3>
                    <p className="text-xs text-slate-600 mb-2">
                      {isTV
                        ? 'Generates an Excel file with overall attendance across all TV dates.'
                        : isNexa
                        ? 'Generates an Excel file with overall attendance for Nexa as of today.'
                        : 'Generates an Excel file split by L1 and L2 tabs with attendance (Appeared / Pending / Absent) as of today.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload('attendance')}
                    disabled={downloading}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    <Download className="h-4 w-4" />{' '}
                    {downloading ? 'Generating...' : 'Preview / Download Attendance Report'}
                  </button>
                </div>
              )}

              {/* --- OVERALL --- */}
              {activeTab === 'overall' && (
                <div className="text-center space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                    <h3 className="font-bold text-slate-800 mb-1">
                      {isTV ? 'TV Overall Result' : isNexa ? 'Nexa Overall Result' : 'Arena Overall Result'}
                    </h3>
                    <p className="text-xs text-slate-600 mb-2">
                      {isTV
                        ? 'Generates a Summary and detailed Status sheet with TV R1 and Main Round aggregated stats.'
                        : isNexa
                        ? 'Generates a Summary and detailed Status sheet showing R1 and Main Round aggregated stats for Nexa.'
                        : 'Generates a Summary and detailed Status sheet showing R1 and Main Round aggregated stats for the selected project.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload('overall')}
                    disabled={downloading || (needsProject && reportType === 'arena' && !selectedProject) || (needsProject && reportType === 'nexa' && !selectedNexaProject)}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    <Download className="h-4 w-4" />{' '}
                    {downloading ? 'Generating...' : 'Preview / Download Overall Result'}
                  </button>
                </div>
              )}

              {/* --- WINNER --- */}
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
                    {downloading ? 'Generating...' : 'Preview / Download Winners Report'}
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
          </>
        )}
      </div>
    </div>
  );
}