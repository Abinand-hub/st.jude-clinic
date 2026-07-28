import React, { useState, useEffect } from 'react';
import { ImportReport, ImportLogRow } from '../types.js';
import {
  FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, XCircle,
  Search, Filter, FileText, Download, Sparkles, RefreshCw
} from 'lucide-react';

export const ImportReportView: React.FC<{ onRefreshData: () => void }> = ({ onRefreshData }) => {
  const [reports, setReports] = useState<ImportReport[]>([]);
  const [activeReportIndex, setActiveReportIndex] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'accepted' | 'merged' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'staff' | 'shift'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadAlert, setUploadAlert] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports/import');
      if (res.ok) {
        const data: ImportReport[] = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Failed to load import reports:', err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const activeReport = reports[activeReportIndex] || null;

  // Filter logs
  const filteredLogs = activeReport?.logs.filter((log) => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (typeFilter !== 'all' && log.entityType !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRaw = log.rawData.toLowerCase().includes(q);
      const matchReason = log.reason?.toLowerCase().includes(q);
      const matchAction = log.actionTaken.toLowerCase().includes(q);
      if (!matchRaw && !matchReason && !matchAction) return false;
    }
    return true;
  }) || [];

  // Handle CSV Upload via File Input
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadAlert(null);

    try {
      const text = await file.text();
      const res = await fetch(`/api/reports/import?fileName=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: text
      });

      if (res.ok) {
        setUploadAlert(`Successfully imported ${file.name}! Report generated below.`);
        await fetchReports();
        setActiveReportIndex(0); // Switch to newest report
        onRefreshData();
      } else {
        const data = await res.json();
        setUploadAlert(`Error importing CSV: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      setUploadAlert('Failed to read or upload CSV file.');
    } finally {
      setUploading(false);
    }
  };

  // Sample Dirty CSV Generators for Testing
  const handleLoadSampleDirtyStaff = async () => {
    const sampleStaff = `Name, Email, Role / Profession, Phone
Dr. Gregory House, house@stjude.clinic, MD, 555-7777
Nurse Ratched, nurse.ratched@stjude.clinic, RN, 555-8888
Joy Miller, nurse.joy@stjude.clinic, RN, 555-0104
No Email User, , Receptionist, 555-0000
Bad Role Person, bad.role@stjude.clinic, Superhero, 555-1234
Dr. Gregory House, house@stjude.clinic, Physician, 555-7777`;

    setUploading(true);
    try {
      const res = await fetch('/api/reports/import?fileName=Sample_Dirty_Staff.csv', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: sampleStaff
      });
      if (res.ok) {
        setUploadAlert('Sample Dirty Staff CSV processed successfully!');
        await fetchReports();
        setActiveReportIndex(0);
        onRefreshData();
      }
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSampleDirtyShifts = async () => {
    const sampleShifts = `Title, Date, Start Time, End Time, Doctors Req, Nurses Req, Receptionists Req, Notes
Overnight Surge, 2026-08-10, 00:00, 08:00, 2, 3, 1, Urgent night coverage
Feb 31 Broken Shift, 2026-02-31, 08:00, 16:00, 1, 1, 1, Impossible date
Reverse Time Shift, 2026-08-11, 18:00, 09:00, 1, 2, 1, End before start
Overnight Surge, 2026-08-10, 00:00, 08:00, 2, 3, 1, Duplicate shift row
Zero Staff Needed, 2026-08-12, 09:00, 17:00, 0, 0, 0, No requirements`;

    setUploading(true);
    try {
      const res = await fetch('/api/reports/import?fileName=Sample_Dirty_Shifts.csv', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: sampleShifts
      });
      if (res.ok) {
        setUploadAlert('Sample Dirty Shifts CSV processed successfully!');
        await fetchReports();
        setActiveReportIndex(0);
        onRefreshData();
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div id="import-report-container" className="space-y-6">
      {/* Page Title & CSV Upload Card */}
      <div className="bg-slate-50 text-slate-900 p-6 rounded-3xl shadow-lg border border-slate-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 bg-purple-600/30 text-purple-400 rounded-xl border border-purple-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Manager Import Engine</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dirty CSV Data Import & Reconciliation Report</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Processes raw spreadsheet exports containing messy real-world garbage: whitespace, bad dates, duplicate entries, inconsistent role names (e.g. RN/Nurse, MD/Physician), and impossible shift times.
          </p>
        </div>

        {/* Upload Controls & Test Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <label
            id="lbl-upload-csv"
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-slate-900 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Custom CSV</span>
            <input
              type="file"
              id="file-input-csv"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              id="btn-test-dirty-staff"
              onClick={handleLoadSampleDirtyStaff}
              disabled={uploading}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-purple-300 text-[11px] font-semibold px-3 py-2 rounded-xl border border-purple-500/30 transition-all flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Test Dirty Staff CSV</span>
            </button>

            <button
              id="btn-test-dirty-shifts"
              onClick={handleLoadSampleDirtyShifts}
              disabled={uploading}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-purple-300 text-[11px] font-semibold px-3 py-2 rounded-xl border border-purple-500/30 transition-all flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Test Dirty Shifts CSV</span>
            </button>
          </div>
        </div>
      </div>

      {uploadAlert && (
        <div className="p-4 bg-purple-50 border border-purple-200 text-purple-900 rounded-2xl text-xs font-bold flex items-center justify-between">
          <span>{uploadAlert}</span>
          <button onClick={() => setUploadAlert(null)}>✕</button>
        </div>
      )}

      {/* Report History Tabs */}
      {reports.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Audit History:</span>
          {reports.map((rep, idx) => (
            <button
              key={rep.id}
              onClick={() => setActiveReportIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                idx === activeReportIndex
                  ? 'bg-purple-600 text-slate-900 shadow-sm ring-2 ring-purple-400'
                  : 'bg-white text-slate-600 hover:bg-white border border-slate-200'
              }`}
            >
              {rep.fileName} ({new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
            </button>
          ))}
        </div>
      )}

      {activeReport ? (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold uppercase text-slate-500">Total Rows Evaluated</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{activeReport.totalRows}</div>
              <div className="text-[11px] text-slate-400 font-medium">Source: {activeReport.fileName}</div>
            </div>

            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 shadow-sm">
              <div className="text-[11px] font-bold uppercase text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Rows Accepted
              </div>
              <div className="text-2xl font-black text-emerald-900 mt-1">{activeReport.acceptedCount}</div>
              <div className="text-[11px] text-emerald-700 font-medium">Clean & imported directly</div>
            </div>

            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 shadow-sm">
              <div className="text-[11px] font-bold uppercase text-amber-800 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Merged / Deduplicated
              </div>
              <div className="text-2xl font-black text-amber-900 mt-1">{activeReport.mergedCount}</div>
              <div className="text-[11px] text-amber-700 font-medium">Duplicates normalized</div>
            </div>

            <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 shadow-sm">
              <div className="text-[11px] font-bold uppercase text-rose-800 flex items-center gap-1">
                <XCircle className="w-4 h-4 text-rose-600" /> Rows Rejected
              </div>
              <div className="text-2xl font-black text-rose-900 mt-1">{activeReport.rejectedCount}</div>
              <div className="text-[11px] text-rose-700 font-medium">Bad dates / impossible times</div>
            </div>
          </div>

          {/* Audit Log Table Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Table Filter Toolbar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Filter Log:
                </span>

                <select
                  id="select-log-status"
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-900 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Outcomes</option>
                  <option value="accepted">🟢 Accepted Only</option>
                  <option value="merged">🟡 Merged Only</option>
                  <option value="rejected">🔴 Rejected Only</option>
                </select>

                <select
                  id="select-log-type"
                  value={typeFilter}
                  onChange={(e: any) => setTypeFilter(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-900 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Staff & Shifts</option>
                  <option value="staff">Staff CSV Rows</option>
                  <option value="shift">Shift CSV Rows</option>
                </select>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  id="input-search-logs"
                  placeholder="Search log reason or raw CSV..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
              <table id="import-report-table" className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3 w-16 text-center">Row #</th>
                    <th className="p-3 w-24">Entity</th>
                    <th className="p-3 w-28">Status</th>
                    <th className="p-3">Raw CSV Row Content</th>
                    <th className="p-3">Validation Issue / Diagnosis</th>
                    <th className="p-3">Action Executed by System</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No import audit logs match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="p-3 text-center font-mono font-bold text-slate-500">
                          {log.rowNumber}
                        </td>

                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.entityType === 'staff' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {log.entityType}
                          </span>
                        </td>

                        <td className="p-3">
                          {log.status === 'accepted' && (
                            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Accepted
                            </span>
                          )}
                          {log.status === 'merged' && (
                            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100 font-bold px-2 py-0.5 rounded-full text-[11px]">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> Merged
                            </span>
                          )}
                          {log.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-100 font-bold px-2 py-0.5 rounded-full text-[11px]">
                              <XCircle className="w-3 h-3 text-rose-600" /> Rejected
                            </span>
                          )}
                        </td>

                        <td className="p-3 font-mono text-[11px] text-slate-600 bg-slate-50/50 rounded">
                          {log.rawData}
                        </td>

                        <td className="p-3 text-slate-900">
                          {log.reason ? (
                            <span className="text-rose-800 font-semibold">{log.reason}</span>
                          ) : (
                            <span className="text-slate-400 italic">No validation issues</span>
                          )}
                        </td>

                        <td className="p-3 text-slate-600 font-semibold">
                          {log.actionTaken}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
          No import reports available. Upload a CSV above to run the import engine!
        </div>
      )}
    </div>
  );
};
