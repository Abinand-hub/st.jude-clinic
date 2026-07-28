import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  Calendar, Users, FileSpreadsheet, ShieldAlert,
  UserCheck, Stethoscope, HeartPulse, UserPlus, LogOut, ChevronDown, Sparkles
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'myshifts' | 'roster' | 'import' | 'policy';
  setActiveTab: (tab: 'dashboard' | 'myshifts' | 'roster' | 'import' | 'policy') => void;
  onOpenNewShiftModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenNewShiftModal }) => {
  const { currentUser, users, isManager, logout } = useAuth();

  const getRoleBadge = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'manager') {
      return (
        <span id="role-badge-manager" className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
          <ShieldAlert className="w-3 h-3 text-purple-600" /> Clinic Manager
        </span>
      );
    }
    switch (currentUser.profession) {
      case 'doctor':
        return (
          <span id="role-badge-doctor" className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Stethoscope className="w-3 h-3 text-blue-600" /> Doctor
          </span>
        );
      case 'nurse':
        return (
          <span id="role-badge-nurse" className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <HeartPulse className="w-3 h-3 text-emerald-600" /> Nurse
          </span>
        );
      case 'receptionist':
        return (
          <span id="role-badge-receptionist" className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <UserCheck className="w-3 h-3 text-amber-600" /> Receptionist
          </span>
        );
      default:
        return null;
    }
  };

  // Quick preset accounts for instant testing
  const presetUsers = [
    { label: 'Dr. Sarah (Manager)', email: 'dr.sarah@stjude.clinic' },
    { label: 'Dr. Chen (Doctor)', email: 'dr.chen@stjude.clinic' },
    { label: 'Joy Miller (Nurse)', email: 'nurse.joy@stjude.clinic' },
    { label: 'Sam Wilson (Receptionist)', email: 'rec.sam@stjude.clinic' },
  ];

  return (
    <header id="main-header" className="bg-slate-50 text-slate-900 border-b border-slate-200 sticky top-0 z-40 shadow-md">
      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Clinic Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-slate-900 font-bold text-xl border border-blue-400/30">
              ✚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-900 tracking-tight">St. Jude Clinic</h1>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
                  Shift OS
                </span>
              </div>
              <p className="text-xs text-slate-400">Staff Shift Management & Coverage System</p>
            </div>
          </div>

          {/* Current User Info & Quick Action */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-900 font-semibold text-xs shadow-inner"
                style={{ backgroundColor: currentUser?.avatarColor || '#2563eb' }}
              >
                {currentUser?.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900">{currentUser?.name}</span>
                  {getRoleBadge()}
                </div>
                <span className="text-[11px] text-slate-400 block font-mono">{currentUser?.email}</span>
              </div>
            </div>

            <button
              id="btn-logout"
              onClick={logout}
              className="bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 font-medium px-4 py-2 rounded-lg text-xs shadow-sm transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 border-t border-slate-200/60 overflow-x-auto py-2">
          <button
            id="tab-coverage-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {isManager ? 'Manager Dashboard' : 'Coverage Dashboard'}
          </button>

          {currentUser?.role === 'staff' && (
            <button
              id="tab-my-shifts"
              onClick={() => setActiveTab('myshifts')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'myshifts'
                  ? 'bg-blue-600 text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              My Claimed Shifts
            </button>
          )}

        </nav>
      </div>
    </header>
  );
};
