import React from 'react';
import { ShieldCheck, Clock, Users, FileText, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';

export const AuditPolicyNotice: React.FC = () => {
  return (
    <div id="policy-notice-container" className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-50 text-slate-900 p-6 rounded-3xl shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Architecture & Logic Policy</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Business Rules & Shift Edit Policy</h2>
        <p className="text-xs text-slate-400 mt-1">
          Detailed specification of server-side validation rules, atomic concurrency locks, dirty data reconciliation, and shift editing decision logic.
        </p>
      </div>

      {/* Decision Documentation Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base border-b border-slate-200 pb-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3>1. Shift Editing Decision Logic (Handling Existing Claims)</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          When a clinic manager modifies an existing shift's date, start/end times, or role requirement quotas while staff members have already claimed spots:
        </p>

        <div className="space-y-2 text-xs">
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-2 text-[#ececec]">
            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Automated Re-Validation Engine:</span> The backend re-evaluates all existing claims against the new shift parameters and each staff member's other claimed shifts.
            </div>
          </div>

          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-2 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Selective Revocation on Conflict:</span> If the updated shift time causes a new schedule overlap with a staff member's existing claims OR if required role capacity is reduced below current claim counts, the affected claim is <span className="font-bold text-rose-700 underline">automatically revoked</span>.
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2 text-slate-900">
            <FileText className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Audit Notification Log:</span> An impact report is generated during shift update, detailing retained claims vs. revoked claims, and an audit entry is created for transparency.
            </div>
          </div>
        </div>
      </div>

      {/* Server Enforcement Rules */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base border-b border-slate-200 pb-3">
          <Lock className="w-5 h-5 text-emerald-600" />
          <h3>2. Server-Side Business Rule Enforcement</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Role Capacity Limits
            </h4>
            <p className="text-slate-600">
              A staff claim is rejected if the number of claims for their profession (<span className="font-mono">doctor, nurse, receptionist</span>) meets or exceeds the shift's specified quota.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Overlap Interval Protection
            </h4>
            <p className="text-slate-600">
              Claims are rejected if the shift interval <span className="font-mono">[start, end)</span> overlaps with any existing claimed shift on the same calendar date for that staff member.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span> Atomic Concurrency Safety
            </h4>
            <p className="text-slate-600">
              All claim mutations execute within server-side mutex locks, preventing race conditions when multiple users attempt to claim the last available spot simultaneously.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Dirty Import Sanitization
            </h4>
            <p className="text-slate-600">
              Parses ambiguous dates, converts 12-hr/24-hr times, normalizes role titles (MD, RN, Reception), deduplicates records, and rejects non-existent dates (e.g. Feb 31).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
