import React, { useState } from 'react';
import { ShiftWithClaims, User } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Calendar, Clock, Users, Stethoscope, HeartPulse, UserCheck,
  AlertCircle, CheckCircle2, Trash2, Edit, X, UserPlus, ShieldAlert, AlertTriangle
} from 'lucide-react';

interface ShiftDetailModalProps {
  shift: ShiftWithClaims | null;
  onClose: () => void;
  onRefresh: () => void;
  onEditShift: (shift: ShiftWithClaims) => void;
}

export const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({
  shift,
  onClose,
  onRefresh,
  onEditShift
}) => {
  const { currentUser, users, isManager } = useAuth();
  const [assignUserId, setAssignUserId] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDeleteSeries, setConfirmDeleteSeries] = useState<boolean>(false);

  if (!shift) return null;

  const userHasClaimed = currentUser && shift.claimedUsers.some(u => u.id === currentUser.id);
  const myClaim = currentUser ? shift.claims.find(c => c.userId === currentUser.id) : null;

  // Filter staff users eligible for manager assignment
  const staffUsers = users.filter(u => u.role === 'staff');

  // Handle Staff Claiming
  const handleClaim = async () => {
    if (!currentUser) return;
    setProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          shiftId: shift.id
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Shift claimed successfully!');
        onRefresh();
      } else {
        setErrorMessage(data.error || 'Claim rejected by server validation.');
      }
    } catch (err: any) {
      setErrorMessage('Network error submitting claim.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle Staff or Manager Unclaiming
  const handleUnclaim = async (claimId: string) => {
    setProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/claims/${claimId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestingUserId: currentUser?.id,
          requestingRole: currentUser?.role
        })
      });

      if (res.ok) {
        setSuccessMessage('Claim revoked successfully.');
        onRefresh();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to unclaim shift.');
      }
    } catch (err: any) {
      setErrorMessage('Error unclaiming shift.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle Manager Direct Assignment
  const handleAssignStaff = async () => {
    if (!assignUserId) return;
    setProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: assignUserId,
          shiftId: shift.id,
          assignedByManager: true,
          managerUserId: currentUser?.id
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Staff assigned successfully!');
        setAssignUserId('');
        onRefresh();
      } else {
        setErrorMessage(data.error || 'Manager assignment violated business rules.');
      }
    } catch (err: any) {
      setErrorMessage('Error assigning staff member.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle Shift Deletion
  const handleDelete = async (deleteSeries: boolean) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/shifts/${shift.id}?deleteSeries=${deleteSeries}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to delete shift.');
      }
    } catch (err) {
      setErrorMessage('Error deleting shift.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div id="modal-shift-detail-overlay" className="fixed inset-0 bg-slate-50/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div id="modal-shift-detail-card" className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-1.5 ${
              shift.status === 'fully_staffed'
                ? 'bg-emerald-100 text-emerald-800'
                : shift.status === 'partially_staffed'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}>
              {shift.status === 'fully_staffed' ? '🟢 Fully Staffed' : shift.status === 'partially_staffed' ? '🟡 Partially Staffed' : '🔴 Unstaffed'}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{shift.title}</h2>
          </div>

          <button
            id="btn-close-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date & Time Badge */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Date</div>
              <div className="text-xs font-bold text-slate-900">{shift.date}</div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-indigo-600" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Shift Hours</div>
              <div className="text-xs font-bold text-slate-900">{shift.startTime} – {shift.endTime}</div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div>{successMessage}</div>
          </div>
        )}

        {/* Required Roles Matrix */}
        <div className="bg-slate-50 text-slate-900 p-4 rounded-2xl mb-4">
          <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Role Requirements Matrix</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-blue-600 font-bold">
                <Stethoscope className="w-3.5 h-3.5" /> Doctors
              </div>
              <div className="text-base font-black mt-1">
                {shift.currentCounts.doctor} / {shift.requirements.doctor}
              </div>
              {shift.missingRoles.doctor > 0 && (
                <span className="text-[10px] text-amber-400 font-medium">Missing {shift.missingRoles.doctor}</span>
              )}
            </div>

            <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-emerald-400 font-bold">
                <HeartPulse className="w-3.5 h-3.5" /> Nurses
              </div>
              <div className="text-base font-black mt-1">
                {shift.currentCounts.nurse} / {shift.requirements.nurse}
              </div>
              {shift.missingRoles.nurse > 0 && (
                <span className="text-[10px] text-amber-400 font-medium">Missing {shift.missingRoles.nurse}</span>
              )}
            </div>

            <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-amber-400 font-bold">
                <UserCheck className="w-3.5 h-3.5" /> Reception
              </div>
              <div className="text-base font-black mt-1">
                {shift.currentCounts.receptionist} / {shift.requirements.receptionist}
              </div>
              {shift.missingRoles.receptionist > 0 && (
                <span className="text-[10px] text-amber-400 font-medium">Missing {shift.missingRoles.receptionist}</span>
              )}
            </div>
          </div>
        </div>

        {/* Claimed Staff Roster Section */}
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Claimed Staff Roster ({shift.totalClaimed}/{shift.totalRequired})</h3>

          {shift.claimedUsers.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-xs text-slate-500">
              No staff members have claimed this shift yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {shift.claimedUsers.map((u) => (
                <div key={u.claimId} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full text-slate-900 text-xs font-bold flex items-center justify-center"
                      style={{ backgroundColor: u.avatarColor || '#2563eb' }}
                    >
                      {u.name.substring(0, 1)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{u.name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{u.profession} • Claimed {new Date(u.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>

                  {(isManager || currentUser?.id === u.id) && (
                    <button
                      id={`btn-unclaim-${u.claimId}`}
                      onClick={() => handleUnclaim(u.claimId)}
                      disabled={processing}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manager Direct Staff Assignment Controls */}
        {isManager && (
          <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-200 mb-4">
            <label className="text-xs font-bold text-purple-900 block mb-1.5 flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5 text-purple-700" /> Direct Staff Assignment (Manager Override)
            </label>
            <div className="flex gap-2">
              <select
                id="select-assign-staff"
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                className="bg-white border border-purple-300 text-slate-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 flex-1"
              >
                <option value="">Select staff member to assign...</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.profession})
                  </option>
                ))}
              </select>
              <button
                id="btn-assign-staff-submit"
                onClick={handleAssignStaff}
                disabled={!assignUserId || processing}
                className="bg-purple-600 hover:bg-purple-700 text-slate-900 font-bold px-4 py-2 rounded-xl text-xs shadow-sm disabled:opacity-50 transition-all"
              >
                Assign
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200 pt-4">
          {/* Staff Claim Button */}
          {currentUser?.role === 'staff' && (
            <div className="w-full sm:w-auto">
              {userHasClaimed ? (
                <button
                  id="btn-unclaim-self"
                  onClick={() => myClaim && handleUnclaim(myClaim.id)}
                  disabled={processing}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-slate-900 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm"
                >
                  Unclaim My Spot
                </button>
              ) : (
                <button
                  id="btn-claim-shift-modal"
                  onClick={handleClaim}
                  disabled={processing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-slate-900 font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm transition-all"
                >
                  Claim Shift Spot
                </button>
              )}
            </div>
          )}

          {/* Manager Edit & Delete Buttons */}
          {isManager && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                id="btn-edit-shift-modal"
                onClick={() => {
                  onClose();
                  onEditShift(shift);
                }}
                className="bg-white hover:bg-slate-200 text-slate-900 font-bold px-3.5 py-2 rounded-xl text-xs border border-slate-300 flex items-center gap-1.5 transition-all"
              >
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>

              <button
                id="btn-delete-shift-modal"
                onClick={() => handleDelete(false)}
                className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold px-3.5 py-2 rounded-xl text-xs border border-rose-300 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
          
          {/* Universal Done Button */}
          <div className="flex items-center justify-end w-full sm:w-auto ml-auto">
            <button
              id="btn-done-modal"
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
