import React, { useState, useEffect } from 'react';
import { ShiftWithClaims, Shift } from '../types.js';
import { Calendar, Clock, Stethoscope, HeartPulse, UserCheck, Repeat, AlertTriangle, X } from 'lucide-react';

interface ShiftFormModalProps {
  initialShift?: ShiftWithClaims | null;
  defaultDate?: string;
  onClose: () => void;
  onRefresh: () => void;
}

export const ShiftFormModal: React.FC<ShiftFormModalProps> = ({
  initialShift,
  defaultDate,
  onClose,
  onRefresh
}) => {
  const isEditing = !!initialShift;

  const [title, setTitle] = useState<string>(initialShift?.title || 'General Clinic Coverage');
  const [date, setDate] = useState<string>(initialShift?.date || defaultDate || '2026-08-03');
  const [startTime, setStartTime] = useState<string>(initialShift?.startTime || '08:00');
  const [endTime, setEndTime] = useState<string>(initialShift?.endTime || '16:00');
  const [docReq, setDocReq] = useState<number>(initialShift?.requirements.doctor ?? 1);
  const [nurseReq, setNurseReq] = useState<number>(initialShift?.requirements.nurse ?? 2);
  const [recReq, setRecReq] = useState<number>(initialShift?.requirements.receptionist ?? 1);
  const [notes, setNotes] = useState<string>(initialShift?.notes || '');

  // Recurring options (only for new shifts)
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [repeatWeeks, setRepeatWeeks] = useState<number>(4);

  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [impactSummary, setImpactSummary] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setImpactSummary(null);

    const shiftData = {
      title,
      date,
      startTime,
      endTime,
      requirements: {
        doctor: Number(docReq),
        nurse: Number(nurseReq),
        receptionist: Number(recReq)
      },
      notes
    };

    try {
      if (isEditing && initialShift) {
        const res = await fetch(`/api/shifts/${initialShift.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shiftData)
        });

        const data = await res.json();
        if (res.ok) {
          const impact = data.impactReport;
          let summary = 'Shift updated successfully.';
          if (impact) {
            const retained = impact.retainedClaims.length;
            const revoked = impact.revokedClaims.length;
            summary += ` ${retained} claims retained.`;
            if (revoked > 0) {
              summary += ` ⚠️ ${revoked} claims revoked due to new time conflict / quota reduction.`;
            }
          }
          setImpactSummary(summary);
          setTimeout(() => {
            onRefresh();
            onClose();
          }, 1500);
        } else {
          setError(data.error || 'Failed to update shift.');
        }
      } else {
        const res = await fetch('/api/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shiftData,
            isRecurring,
            repeatWeeks
          })
        });

        const data = await res.json();
        if (res.ok) {
          onRefresh();
          onClose();
        } else {
          setError(data.error || 'Failed to create shift.');
        }
      }
    } catch (err: any) {
      setError('Network error saving shift.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="modal-shift-form-overlay" className="fixed inset-0 bg-slate-50/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div id="modal-shift-form-card" className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <h2 className="text-lg font-extrabold text-slate-900">
            {isEditing ? 'Edit Shift & Re-validate Claims' : 'Create New Shift'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800">
            {error}
          </div>
        )}

        {impactSummary && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900">
            {impactSummary}
          </div>
        )}

        {isEditing && initialShift && initialShift.totalClaimed > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Notice on Shift Edits:</span> This shift currently has {initialShift.totalClaimed} staff claims. Updating shift times or reducing quota will re-evaluate claims on the server and automatically revoke any claim that causes a schedule overlap.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Shift Title</label>
            <input
              type="text"
              id="input-shift-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              placeholder="e.g. Morning ER & Triage"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Date</label>
              <input
                type="date"
                id="input-shift-date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Start Time</label>
              <input
                type="text"
                id="input-shift-start"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="08:00"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">End Time</label>
              <input
                type="text"
                id="input-shift-end"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="16:00"
              />
            </div>
          </div>

          {/* Role Requirements Counters */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-slate-900 block">Required Staff Counts</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-blue-700 flex items-center gap-1">
                  <Stethoscope className="w-3 h-3" /> Doctors
                </label>
                <input
                  type="number"
                  min="0"
                  id="input-req-doctor"
                  value={docReq}
                  onChange={(e) => setDocReq(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-center font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                  <HeartPulse className="w-3 h-3" /> Nurses
                </label>
                <input
                  type="number"
                  min="0"
                  id="input-req-nurse"
                  value={nurseReq}
                  onChange={(e) => setNurseReq(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-center font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Reception
                </label>
                <input
                  type="number"
                  min="0"
                  id="input-req-receptionist"
                  value={recReq}
                  onChange={(e) => setRecReq(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-center font-bold"
                />
              </div>
            </div>
          </div>

          {!isEditing && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
              <label className="text-xs font-bold text-[#ececec] flex items-center gap-1.5 cursor-pointer">
                <Repeat className="w-4 h-4 text-blue-600" />
                <span>Repeat Weekly (Recurring Series)</span>
              </label>
              <input
                type="checkbox"
                id="checkbox-recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </div>
          )}

          {isRecurring && !isEditing && (
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Repeat Duration (Weeks)</label>
              <select
                id="select-repeat-weeks"
                value={repeatWeeks}
                onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-900"
              >
                <option value={2}>2 Weeks</option>
                <option value={4}>4 Weeks</option>
                <option value={8}>8 Weeks</option>
                <option value={12}>12 Weeks</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Notes / Instructions</label>
            <textarea
              id="input-shift-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Bring ICU badges, handover at 07:45..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
            <button
              type="button"
              id="btn-cancel-shift-form"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-shift-form"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-slate-900 font-bold px-5 py-2 rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
