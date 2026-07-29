import React from 'react';
import { ShiftWithClaims } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { Users, Stethoscope, HeartPulse, UserCheck, ShieldAlert, Phone, Mail, UserPlus, Edit2 } from 'lucide-react';
import { AddStaffModal } from './AddStaffModal.js';
import { EditStaffModal } from './EditStaffModal.js';

export const RosterView: React.FC<{ shifts: ShiftWithClaims[] }> = ({ shifts }) => {
  const { users, refreshUsers, isManager } = useAuth();
  const [isAddingStaff, setIsAddingStaff] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<any>(null);

  // Calculate total claimed shifts per user across all shifts
  const getClaimCount = (userId: string) => {
    let count = 0;
    shifts.forEach(s => {
      if (s.claims.some(c => c.userId === userId)) count++;
    });
    return count;
  };

  return (
    <div id="roster-view-container" className="space-y-6">
      <div className="bg-slate-50 text-slate-900 p-6 rounded-3xl shadow-lg border border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Clinic Directory</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinic Staff Roster & Activity</h2>
            <p className="text-xs text-slate-400 mt-1">
              Overview of registered doctors, nurses, receptionists, and managers pre-seeded from clean imported data.
            </p>
          </div>
          {isManager && (
            <button
              onClick={() => setIsAddingStaff(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" /> Add Staff Member
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => {
          const claimCount = getClaimCount(u.id);

          return (
            <div key={u.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl text-slate-900 font-bold flex items-center justify-center text-sm shadow-inner"
                    style={{ backgroundColor: u.avatarColor || '#2563eb' }}
                  >
                    {u.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{u.name}</h3>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5 ${
                      u.role === 'manager'
                        ? 'bg-purple-100 text-purple-800'
                        : u.profession === 'doctor'
                        ? 'bg-blue-100 text-blue-800'
                        : u.profession === 'nurse'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {u.role === 'manager' ? 'Clinic Manager' : u.profession?.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 block">{claimCount} Shifts</span>
                  <span className="text-[10px] text-slate-400">Claimed</span>
                </div>
                {isManager && (
                  <button
                    onClick={() => setEditingUser(u)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-xs truncate">{u.email}</span>
                </div>
                {u.phone && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="text-xs">{u.phone}</span>
                  </div>
                )}
                {isManager && u.password && (
                  <div className="flex items-center gap-2 text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-mono text-slate-700">Password: {u.password}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isAddingStaff && (
        <AddStaffModal 
          onClose={() => setIsAddingStaff(false)}
          onRefresh={refreshUsers}
        />
      )}

      {editingUser && (
        <EditStaffModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onRefresh={refreshUsers}
        />
      )}
    </div>
  );
};
