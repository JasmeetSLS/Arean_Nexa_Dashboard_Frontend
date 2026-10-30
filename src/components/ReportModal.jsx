import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Loader2 } from 'lucide-react';
import {
  exportArenaMorning,
  exportArenaAttendance,
  exportArenaOverallResult,
  exportArenaWinner,
  getFilters,
} from '../service/api.js'; // Adjust path if needed

export default function ReportModal({ isOpen, onClose, project: initialProject, date: initialDate }) {
  const [activeTab, setActiveTab] = useState('morning');
  const [downloading, setDownloading] = useState(false);
  
  // Local state for filters
  const [projects, setProjects] = useState([]);
  const [dates, setDates] = useState([]);
  const [selectedProject, setSelectedProject] = useState(initialProject || '');
  const [selectedDate, setSelectedDate] = useState(initialDate || '');
  
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);

  // 1. Fetch Projects when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const { data } = await getFilters();
        if (data?.success) {
          setProjects(data.projects || []);
          
          // If no project selected yet, auto-select the first one
          if (!selectedProject && data.projects?.length > 0) {
            setSelectedProject(data.projects[0].project_name);
          }
        }
      } catch (err) {
        console.error("Failed to load projects", err);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [isOpen]); // Only run when modal opens

  // 2. Fetch Dates whenever selectedProject changes
  useEffect(() => {
    if (!isOpen || !selectedProject) return;

    const fetchDates = async () => {
      try {
        setLoadingDates(true);
        // Pass the selected project to the API to get its specific dates
        const { data } = await getFilters({ project: selectedProject });
        
        if (data?.success) {
          const newDates = data.dates || [];
          setDates(newDates);

          // If the previously selected date doesn't exist in the new dates, reset it
          if (newDates.length > 0) {
            if (!newDates.includes(selectedDate)) {
              setSelectedDate(newDates[0]);
            }
          } else {
            setSelectedDate('');
          }
        }
      } catch (err) {
        console.error("Failed to load dates", err);
      } finally {
        setLoadingDates(false);
      }
    };

    fetchDates();
  }, [isOpen, selectedProject]); // Re-run whenever project changes

  if (!isOpen) return null;

  const handleDownload = async (type) => {
    if (!selectedProject) return alert("Please select a project.");

    setDownloading(true);
    try {
      let res;
      const params = { project: selectedProject };

      if (type === 'morning') {
        if (!selectedDate) {
          setDownloading(false);
          return alert("Please select a Date to download the Morning Report.");
        }
        params.date = selectedDate;
        res = await exportArenaMorning(params);
      } else if (type === 'attendance') {
        res = await exportArenaAttendance(params);
      } else if (type === 'overall') {
        res = await exportArenaOverallResult(params);
      } else if (type === 'winner') {
        res = await exportArenaWinner(params);
      }

      // Trigger File Download
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_report_${selectedProject.replace(/[^a-z0-9]/gi, '_')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error(err);
      alert("Failed to download the report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const tabs = [
    { id: 'morning', label: 'Daily Hourly' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'overall', label: 'Overall Result' },
    { id: 'winner', label: 'Winners' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <FileText className="h-5 w-5" /> Excel Reports
            </h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* FILTERS INSIDE MODAL */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-end gap-3">
          
          {/* Project Selector */}
          <div className="flex flex-col gap-1 w-1/2">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Project</label>
            {loadingProjects ? (
              <div className="h-8 flex items-center text-xs text-gray-400"><Loader2 className="h-4 w-4 animate-spin mr-2"/> Loading...</div>
            ) : (
              <select 
                value={selectedProject} 
                onChange={(e) => setSelectedProject(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="" disabled>Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.project_name}>{p.project_name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Date Selector */}
          <div className="flex flex-col gap-1 w-1/2">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Date</label>
            {loadingDates ? (
              <div className="h-8 flex items-center text-xs text-gray-400"><Loader2 className="h-4 w-4 animate-spin mr-2"/> Loading Dates...</div>
            ) : (
              <select 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={!selectedProject || dates.length === 0}
                className="border border-gray-300 rounded px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">-- Select Date --</option>
                {dates.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white overflow-x-auto">
          {tabs.map(tab => (
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
          {activeTab === 'morning' && (
            <div className="text-center space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                <h3 className="font-bold text-slate-800 mb-1">Arena Daily Hourly Report</h3>
                <p className="text-xs text-slate-600 mb-2">Generates a multi-sheet Excel file (Summary & Status) based on the selected project and date.</p>
              </div>
              <button 
                onClick={() => handleDownload('morning')} 
                disabled={downloading || !selectedDate || !selectedProject}
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                <Download className="h-4 w-4" /> {downloading ? 'Generating...' : 'Download Morning Report'}
              </button>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="text-center space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                <h3 className="font-bold text-slate-800 mb-1">Arena Attendance Report</h3>
                <p className="text-xs text-slate-600 mb-2">Generates an Excel file split by L1 and L2 tabs, with dynamic time slot colors and attendance status.</p>
              </div>
              <button 
                onClick={() => handleDownload('attendance')} 
                disabled={downloading || !selectedProject}
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                <Download className="h-4 w-4" /> {downloading ? 'Generating...' : 'Download Attendance Report'}
              </button>
            </div>
          )}

          {activeTab === 'overall' && (
            <div className="text-center space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                <h3 className="font-bold text-slate-800 mb-1">Arena Overall Result</h3>
                <p className="text-xs text-slate-600 mb-2">Generates a Summary and detailed Status sheet showing R1 and Main Round aggregated stats.</p>
              </div>
              <button 
                onClick={() => handleDownload('overall')} 
                disabled={downloading || !selectedProject}
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                <Download className="h-4 w-4" /> {downloading ? 'Generating...' : 'Download Overall Result'}
              </button>
            </div>
          )}

          {activeTab === 'winner' && (
            <div className="text-center space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left">
                <h3 className="font-bold text-slate-800 mb-1">Arena Winners Report</h3>
                <p className="text-xs text-slate-600 mb-2">Generates a Winner Summary with dynamic category scores and ranks (1, 2, 3).</p>
              </div>
              <button 
                onClick={() => handleDownload('winner')} 
                disabled={downloading || !selectedProject}
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                <Download className="h-4 w-4" /> {downloading ? 'Generating...' : 'Download Winners Report'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}