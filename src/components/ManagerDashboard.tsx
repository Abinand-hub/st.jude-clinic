import React, { useState } from 'react';
import { ShiftWithClaims } from '../types.js';
import { CoverageDashboard } from './CoverageDashboard.js';
import { ImportReportView } from './ImportReportView.js';
import { RosterView } from './RosterView.js';
import { AuditPolicyNotice } from './AuditPolicyNotice.js';
import { Calendar, FileSpreadsheet, Plus, Users, ShieldAlert } from 'lucide-react';

interface ManagerDashboardProps {
  shifts: ShiftWithClaims[];
  loading: boolean;
  onRefresh: () => void;
  onSelectShift: (shift: ShiftWithClaims) => void;
  onOpenCreateShiftModal: (defaultDate?: string) => void;
}

type ManagerView = 'coverage' | 'import' | 'roster' | 'policy';

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  shifts,
  loading,
  onRefresh,
  onSelectShift,
  onOpenCreateShiftModal
}) => {
  const [activeView, setActiveView] = useState<ManagerView>('coverage');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Unified Command Center Action Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => onOpenCreateShiftModal()}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-slate-900 p-5 rounded-2xl shadow-lg border border-slate-200 flex flex-col items-center justify-center gap-3 transition-all active:scale-95 group"
        >
          <div className="p-3 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <span className="block font-bold text-sm">Create New Shift</span>
            <span className="block text-xs text-blue-200 mt-1 opacity-80">Add to schedule</span>
          </div>
        </button>

        <button
          onClick={() => setActiveView('import')}
          className={`p-5 rounded-2xl shadow-lg border flex flex-col items-center justify-center gap-3 transition-all active:scale-95 group ${
            activeView === 'import' ? 'bg-slate-100 border-blue-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${activeView === 'import' ? 'bg-blue-600/20 text-blue-600' : 'bg-slate-100 text-emerald-400'}`}>
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="text-center">
            <span className="block font-bold text-sm text-slate-900">CSV Imports</span>
            <span className="block text-xs text-slate-500 mt-1">Upload & Reports</span>
          </div>
        </button>

        <button
          onClick={() => setActiveView('roster')}
          className={`p-5 rounded-2xl shadow-lg border flex flex-col items-center justify-center gap-3 transition-all active:scale-95 group ${
            activeView === 'roster' ? 'bg-slate-100 border-blue-400' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${activeView === 'roster' ? 'bg-blue-400/20 text-blue-400' : 'bg-slate-100 text-blue-400'}`}>
            <Users className="w-6 h-6" />
          </div>
          <div className="text-center">
            <span className="block font-bold text-sm text-slate-900">Staff Roster</span>
            <span className="block text-xs text-slate-500 mt-1">View directory</span>
          </div>
        </button>

        <button
          onClick={() => setActiveView('policy')}
          className={`p-5 rounded-2xl shadow-lg border flex flex-col items-center justify-center gap-3 transition-all active:scale-95 group ${
            activeView === 'policy' ? 'bg-slate-100 border-amber-400' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${activeView === 'policy' ? 'bg-amber-400/20 text-amber-400' : 'bg-slate-100 text-amber-400'}`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="text-center">
            <span className="block font-bold text-sm text-slate-900">System Rules</span>
            <span className="block text-xs text-slate-500 mt-1">View enforcement</span>
          </div>
        </button>
      </div>

      {/* View Switcher Controls (Return to Dashboard) */}
      {activeView !== 'coverage' && (
        <div className="flex justify-start mb-4">
          <button
            onClick={() => setActiveView('coverage')}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold bg-blue-600/10 hover:bg-blue-600/20 px-4 py-2 rounded-lg transition-all"
          >
            <Calendar className="w-4 h-4" />
            &larr; Back to Coverage Dashboard
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {activeView === 'coverage' && (
          <div className="p-6">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Weekly Coverage Overview
            </h2>
            <CoverageDashboard
              shifts={shifts}
              loading={loading}
              onRefresh={onRefresh}
              onSelectShift={onSelectShift}
              onOpenCreateShiftModal={onOpenCreateShiftModal}
            />
          </div>
        )}

        {activeView === 'import' && (
          <div className="p-1">
            <ImportReportView onRefreshData={onRefresh} />
          </div>
        )}

        {activeView === 'roster' && (
          <div className="p-1">
            <RosterView shifts={shifts} />
          </div>
        )}

        {activeView === 'policy' && (
          <div className="p-1">
            <AuditPolicyNotice />
          </div>
        )}
      </div>
    </div>
  );
};
