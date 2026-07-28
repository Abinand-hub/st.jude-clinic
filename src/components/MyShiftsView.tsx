import React, { useState } from 'react';
import { ShiftWithClaims } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { Calendar, Clock, CheckCircle2, AlertCircle, Trash2, HeartPulse, Stethoscope, UserCheck } from 'lucide-react';

interface MyShiftsViewProps {
  shifts: ShiftWithClaims[];
  onRefresh: () => void;
  onSelectShift: (shift: ShiftWithClaims) => void;
}

export const MyShiftsView: React.FC<MyShiftsViewProps> = ({ shifts, onRefresh, onSelectShift }) => {
  const { currentUser } = useAuth();
  const [unclaimingId, setUnclaimingId] = useState<string | null>(null);

  if (!currentUser || currentUser.role !== 'staff') {
    return (
      <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-500 text-xs">
        My Shifts view is reserved for clinic staff members. Switch to a staff persona above to view personal claimed shifts.
      </div>
    );
  }

  // Filter shifts claimed by current user
  const myClaimedShifts = shifts.filter(s => s.claimedUsers.some(u => u.id === currentUser.id));

  // Sort by date and start time
  myClaimedShifts.sort((a, b) => {
    const dComp = a.date.localeCompare(b.date);
    if (dComp !== 0) return dComp;
    return a.startTime.localeCompare(b.startTime);
  });

  // Calculate total hours scheduled
  const totalHours = myClaimedShifts.reduce((acc, s) => {
    const startH = parseInt(s.startTime.split(':')[0], 10);
    const endH = s.endTime === '24:00' ? 24 : parseInt(s.endTime.split(':')[0], 10);
    const diff = Math.max(0, endH - startH);
    return acc + diff;
  }, 0);

  const handleUnclaim = async (shift: ShiftWithClaims, e: React.MouseEvent) => {
    e.stopPropagation();
    const claim = shift.claims.find(c => c.userId === currentUser.id);
    if (!claim) return;

    setUnclaimingId(claim.id);
    try {
      const res = await fetch(`/api/claims/${claim.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestingUserId: currentUser.id,
          requestingRole: currentUser.role
        })
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Unclaim error:', err);
    } finally {
      setUnclaimingId(null);
    }
  };

  return (
    <div id="my-shifts-container" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-50 text-slate-900 p-6 rounded-3xl shadow-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Personal Schedule</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Claimed Shifts Roster</h2>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <span className="font-bold text-slate-900">{currentUser.name}</span> ({currentUser.profession})
          </p>
        </div>

        <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 text-right">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Total Scheduled Hours</div>
          <div className="text-2xl font-black text-blue-600 mt-0.5">{totalHours} hrs</div>
          <div className="text-[10px] text-slate-400 mt-1">{myClaimedShifts.length} shifts claimed</div>
        </div>
      </div>

      {/* Shifts List */}
      {myClaimedShifts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <h3 className="text-sm font-bold text-slate-600">No shifts claimed yet</h3>
          <p className="text-xs text-slate-400 mt-1">Go to the Coverage Dashboard to browse open shifts and claim your schedule.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myClaimedShifts.map((shift) => (
            <div
              key={shift.id}
              onClick={() => onSelectShift(shift)}
              className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm hover:shadow-md transition-all cursor-pointer ring-1 ring-blue-500/10 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  {shift.date}
                </span>
                <span className="text-xs font-mono font-bold text-slate-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> {shift.startTime} - {shift.endTime}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{shift.title}</h3>
                {shift.notes && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{shift.notes}</p>}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Claim Active</span>
                </div>

                <button
                  id={`btn-unclaim-my-shift-${shift.id}`}
                  onClick={(e) => handleUnclaim(shift, e)}
                  disabled={unclaimingId !== null}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-all"
                >
                  Unclaim
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
