import React, { useState, useEffect, useMemo } from 'react';
import { ShiftWithClaims, Profession, RoleRequirements } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter,
  Stethoscope, HeartPulse, UserCheck, AlertCircle, CheckCircle2, Clock,
  Search, Download, RefreshCw, Plus, UserPlus, Info
} from 'lucide-react';

interface CoverageDashboardProps {
  shifts: ShiftWithClaims[];
  loading: boolean;
  onRefresh: () => void;
  onSelectShift: (shift: ShiftWithClaims) => void;
  onOpenCreateShiftModal: (defaultDate?: string) => void;
}

export const CoverageDashboard: React.FC<CoverageDashboardProps> = ({
  shifts,
  loading,
  onRefresh,
  onSelectShift,
  onOpenCreateShiftModal
}) => {
  const { currentUser, isManager } = useAuth();

  // Selected date for week computation (default to Aug 3, 2026, which is our seed week)
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-03');
  const [statusFilter, setStatusFilter] = useState<'all' | 'fully_staffed' | 'partially_staffed' | 'unstaffed'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [claimingShiftId, setClaimingShiftId] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Compute start of week (Monday) and 7 days
  const weekDays = useMemo(() => {
    const current = new Date(selectedDate + 'T00:00:00');
    const day = current.getDay();
    const diffToMon = (day === 0 ? -6 : 1 - day); // Monday as day 1
    const monday = new Date(current);
    monday.setDate(current.getDate() + diffToMon);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });

      days.push({
        dateStr,
        dayName,
        monthName,
        dayNum: d.getDate(),
        isToday: dateStr === '2026-08-03' // Our demo today
      });
    }
    return days;
  }, [selectedDate]);

  const weekRangeText = useMemo(() => {
    if (weekDays.length < 7) return '';
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.monthName} ${start.dayNum} – ${end.monthName} ${end.dayNum}, ${weekDays[0].dateStr.substring(0, 4)}`;
  }, [weekDays]);

  // Navigate Weeks
  const handlePrevWeek = () => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() - 7);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + 7);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate('2026-08-03');
  };

  // Filter shifts for selected week
  const weekShiftMap = useMemo(() => {
    const map = new Map<string, ShiftWithClaims[]>();
    weekDays.forEach(d => map.set(d.dateStr, []));

    const weekDates = new Set(weekDays.map(d => d.dateStr));

    shifts.forEach(shift => {
      if (weekDates.has(shift.date)) {
        // Apply filters
        if (statusFilter !== 'all' && shift.status !== statusFilter) return;

        if (roleFilter !== 'all') {
          if (roleFilter === 'missing_doctor' && shift.missingRoles.doctor === 0) return;
          if (roleFilter === 'missing_nurse' && shift.missingRoles.nurse === 0) return;
          if (roleFilter === 'missing_receptionist' && shift.missingRoles.receptionist === 0) return;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = shift.title.toLowerCase().includes(q);
          const matchNotes = shift.notes?.toLowerCase().includes(q);
          if (!matchTitle && !matchNotes) return;
        }

        const existing = map.get(shift.date) || [];
        existing.push(shift);
        map.set(shift.date, existing);
      }
    });

    // Sort shifts by start time within each day
    map.forEach((list, key) => {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return map;
  }, [shifts, weekDays, statusFilter, roleFilter, searchQuery]);

  // Metric Summaries for current week
  const weekMetrics = useMemo(() => {
    const weekDates = new Set(weekDays.map(d => d.dateStr));
    const weekShifts = shifts.filter(s => weekDates.has(s.date));

    const total = weekShifts.length;
    const fullyStaffed = weekShifts.filter(s => s.status === 'fully_staffed').length;
    const partiallyStaffed = weekShifts.filter(s => s.status === 'partially_staffed').length;
    const unstaffed = weekShifts.filter(s => s.status === 'unstaffed').length;

    let missingDocs = 0;
    let missingNurses = 0;
    let missingRecs = 0;

    weekShifts.forEach(s => {
      missingDocs += s.missingRoles.doctor;
      missingNurses += s.missingRoles.nurse;
      missingRecs += s.missingRoles.receptionist;
    });

    return {
      total,
      fullyStaffed,
      partiallyStaffed,
      unstaffed,
      missingDocs,
      missingNurses,
      missingRecs,
      coveragePercent: total > 0 ? Math.round((fullyStaffed / total) * 100) : 0
    };
  }, [shifts, weekDays]);

  // Handle Quick Claim Action for Staff
  const handleQuickClaim = async (shift: ShiftWithClaims, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || currentUser.role !== 'staff') return;

    setClaimingShiftId(shift.id);
    setActionAlert(null);

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
        setActionAlert({
          type: 'success',
          message: `Successfully claimed ${shift.title} (${shift.date} ${shift.startTime}-${shift.endTime})!`
        });
        onRefresh();
      } else {
        setActionAlert({
          type: 'error',
          message: data.error || 'Server rejected claim request.'
        });
      }
    } catch (err: any) {
      setActionAlert({
        type: 'error',
        message: 'Network error submitting claim.'
      });
    } finally {
      setClaimingShiftId(null);
    }
  };

  // CSV Schedule Export (Manager)
  const handleExportCSV = () => {
    const weekDates = new Set(weekDays.map(d => d.dateStr));
    const weekShifts = shifts.filter(s => weekDates.has(s.date));

    let csv = 'Title,Date,Start Time,End Time,Status,Doctor (Claimed/Req),Nurse (Claimed/Req),Receptionist (Claimed/Req),Claimed Staff Names\n';

    weekShifts.forEach(s => {
      const names = s.claimedUsers.map(u => `${u.name} (${u.profession})`).join('; ');
      csv += `"${s.title}",${s.date},${s.startTime},${s.endTime},${s.status},${s.currentCounts.doctor}/${s.requirements.doctor},${s.currentCounts.nurse}/${s.requirements.nurse},${s.currentCounts.receptionist}/${s.requirements.receptionist},"${names}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StJude_Schedule_Week_${weekDays[0].dateStr}.csv`;
    a.click();
  };

  return (
    <div id="coverage-dashboard-container" className="space-y-6">
      {/* Action Notification Banner */}
      {actionAlert && (
        <div
          id="action-alert-banner"
          className={`p-4 rounded-xl shadow-sm border flex items-center justify-between transition-all ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionAlert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <p className="text-xs font-semibold">{actionAlert.message}</p>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Week Navigation & Controls Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Week Jump Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200">
            <button
              id="btn-prev-week"
              onClick={handlePrevWeek}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-all active:scale-95 shadow-none hover:shadow-sm"
              title="Previous Week"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              id="btn-today"
              onClick={handleToday}
              className="px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-white rounded-lg transition-all"
            >
              Seed Week (Aug 3)
            </button>
            <button
              id="btn-next-week"
              onClick={handleNextWeek}
              className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-all active:scale-95 shadow-none hover:shadow-sm"
              title="Next Week"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">{weekRangeText}</h2>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Week Coverage View</p>
          </div>
        </div>

        {/* Date Picker Direct Input */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <input
            type="date"
            id="input-jump-date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />

          {isManager && (
            <button
              id="btn-export-csv"
              onClick={handleExportCSV}
              className="bg-white hover:bg-slate-200 text-slate-900 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-300 flex items-center gap-1.5 transition-all"
              title="Export Week Schedule to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            id="btn-refresh-dashboard"
            onClick={onRefresh}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 transition-all"
            title="Refresh Shift Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Week Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Shift Coverage</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{weekMetrics.coveragePercent}%</div>
          <div className="w-full bg-white h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${weekMetrics.coveragePercent}%` }}
            />
          </div>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Fully Staffed
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{weekMetrics.fullyStaffed}</div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">Shifts 100% Filled</div>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 shadow-sm">
          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Partial Staffed
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">{weekMetrics.partiallyStaffed}</div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">Needs Staff</div>
        </div>

        <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200 shadow-sm">
          <div className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Unstaffed
          </div>
          <div className="text-2xl font-black text-rose-900 mt-1">{weekMetrics.unstaffed}</div>
          <div className="text-[11px] text-rose-700 mt-1 font-medium">0 Claims Yet</div>
        </div>

        <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 shadow-sm col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="text-[11px] font-semibold text-[#ececec] uppercase tracking-wider">Missing Roles</div>
          <div className="flex items-center gap-2 mt-2 text-xs font-bold text-slate-900">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{weekMetrics.missingDocs} Doctors</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">{weekMetrics.missingNurses} RNs</span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded">{weekMetrics.missingRecs} Rec</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-slate-50 text-slate-900 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          {/* Status Filter */}
          <select
            id="filter-status-select"
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-slate-100 text-slate-900 text-xs font-medium rounded-xl px-3 py-1.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="fully_staffed">🟢 Fully Staffed Only</option>
            <option value="partially_staffed">🟡 Partially Staffed Only</option>
            <option value="unstaffed">🔴 Unstaffed Only</option>
          </select>

          {/* Missing Role Filter */}
          <select
            id="filter-role-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-100 text-slate-900 text-xs font-medium rounded-xl px-3 py-1.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Role Needs</option>
            <option value="missing_doctor">Needs Doctor</option>
            <option value="missing_nurse">Needs Nurse</option>
            <option value="missing_receptionist">Needs Receptionist</option>
          </select>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            id="input-search-shifts"
            placeholder="Search shift title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-100 text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-8 pr-3 py-1.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
          />
        </div>
      </div>

      {/* Week-At-A-Glance Schedule Grid */}
      <div id="week-schedule-grid" className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dayShifts = weekShiftMap.get(day.dateStr) || [];

          return (
            <div
              key={day.dateStr}
              id={`day-column-${day.dateStr}`}
              className={`bg-white rounded-2xl border transition-all flex flex-col min-h-[360px] ${
                day.isToday ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 shadow-sm'
              }`}
            >
              {/* Day Column Header */}
              <div
                className={`p-3 border-b rounded-t-2xl flex items-center justify-between ${
                  day.isToday ? 'bg-blue-600 text-slate-900' : 'bg-slate-50 text-slate-900'
                }`}
              >
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">{day.dayName}</div>
                  <div className="text-base font-extrabold">{day.monthName} {day.dayNum}</div>
                </div>

                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    day.isToday ? 'bg-blue-800 text-slate-900' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {dayShifts.length} {dayShifts.length === 1 ? 'shift' : 'shifts'}
                  </span>

                  {isManager && (
                    <button
                      id={`btn-add-shift-${day.dateStr}`}
                      onClick={() => onOpenCreateShiftModal(day.dateStr)}
                      className={`p-1 rounded-md transition-all ${
                        day.isToday ? 'hover:bg-blue-500 text-slate-900' : 'hover:bg-slate-200 text-slate-600'
                      }`}
                      title={`Add shift on ${day.dateStr}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Day Shifts Stack */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                {dayShifts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                    <Clock className="w-6 h-6 mb-1 opacity-40" />
                    <span className="text-[11px] font-medium">No shifts scheduled</span>
                  </div>
                ) : (
                  dayShifts.map((shift) => {
                    const isFullyStaffed = shift.status === 'fully_staffed';
                    const isPartiallyStaffed = shift.status === 'partially_staffed';

                    // Check if current user has claimed this shift
                    const userHasClaimed = currentUser && shift.claimedUsers.some(u => u.id === currentUser.id);

                    // Check if user's profession is full
                    const userProf = currentUser?.profession;
                    const profFull = userProf && shift.missingRoles[userProf] === 0;

                    return (
                      <div
                        key={shift.id}
                        id={`shift-card-${shift.id}`}
                        onClick={() => onSelectShift(shift)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md active:scale-[0.98] ${
                          userHasClaimed
                            ? 'bg-blue-50/90 border-blue-300 ring-1 ring-blue-500'
                            : isFullyStaffed
                            ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                            : isPartiallyStaffed
                            ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                            : 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                        }`}
                      >
                        {/* Time & Status Badge */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[11px] font-mono font-bold text-slate-900 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                            {shift.startTime} – {shift.endTime}
                          </span>

                          {isFullyStaffed && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Full
                            </span>
                          )}
                          {isPartiallyStaffed && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                              Partial
                            </span>
                          )}
                          {!isFullyStaffed && !isPartiallyStaffed && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded-full">
                              Unstaffed
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{shift.title}</h4>

                        {/* Requirements Breakdown */}
                        <div className="mt-2 space-y-1 text-[11px]">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="flex items-center gap-1 font-medium">
                              <Stethoscope className="w-3 h-3 text-blue-600" /> Dr:
                            </span>
                            <span className={`font-mono font-semibold ${shift.missingRoles.doctor > 0 ? 'text-amber-700 font-bold' : 'text-slate-600'}`}>
                              {shift.currentCounts.doctor}/{shift.requirements.doctor}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-600">
                            <span className="flex items-center gap-1 font-medium">
                              <HeartPulse className="w-3 h-3 text-emerald-600" /> RN:
                            </span>
                            <span className={`font-mono font-semibold ${shift.missingRoles.nurse > 0 ? 'text-amber-700 font-bold' : 'text-slate-600'}`}>
                              {shift.currentCounts.nurse}/{shift.requirements.nurse}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-600">
                            <span className="flex items-center gap-1 font-medium">
                              <UserCheck className="w-3 h-3 text-amber-600" /> Rec:
                            </span>
                            <span className={`font-mono font-semibold ${shift.missingRoles.receptionist > 0 ? 'text-amber-700 font-bold' : 'text-slate-600'}`}>
                              {shift.currentCounts.receptionist}/{shift.requirements.receptionist}
                            </span>
                          </div>
                        </div>

                        {/* Missing Roles Warning Pill */}
                        {(shift.missingRoles.doctor > 0 || shift.missingRoles.nurse > 0 || shift.missingRoles.receptionist > 0) && (
                          <div className="mt-2 text-[10px] bg-amber-100/80 text-amber-900 px-2 py-1 rounded-md font-medium border border-amber-200">
                            Missing:{' '}
                            {[
                              shift.missingRoles.doctor > 0 && `${shift.missingRoles.doctor} Dr`,
                              shift.missingRoles.nurse > 0 && `${shift.missingRoles.nurse} RN`,
                              shift.missingRoles.receptionist > 0 && `${shift.missingRoles.receptionist} Rec`
                            ].filter(Boolean).join(', ')}
                          </div>
                        )}

                        {/* Claimed Staff Avatars */}
                        {shift.claimedUsers.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {shift.claimedUsers.map((u) => (
                                <div
                                  key={u.claimId}
                                  className="w-5 h-5 rounded-full text-[9px] font-bold text-slate-900 flex items-center justify-center ring-1 ring-white"
                                  style={{ backgroundColor: u.avatarColor || '#2563eb' }}
                                  title={`${u.name} (${u.profession})`}
                                >
                                  {u.name.substring(0, 1)}
                                </div>
                              ))}
                            </div>

                            <span className="text-[10px] text-slate-500 font-mono font-medium">
                              {shift.totalClaimed}/{shift.totalRequired}
                            </span>
                          </div>
                        )}

                        {/* Quick Claim Button for Staff */}
                        {currentUser?.role === 'staff' && (
                          <div className="mt-2 pt-2 border-t border-slate-200">
                            {userHasClaimed ? (
                              <div className="text-[11px] font-bold text-blue-700 bg-blue-100 py-1 px-2 rounded text-center">
                                ✓ Claimed By You
                              </div>
                            ) : (
                              <button
                                id={`btn-quick-claim-${shift.id}`}
                                onClick={(e) => handleQuickClaim(shift, e)}
                                disabled={claimingShiftId === shift.id || profFull}
                                className={`w-full text-xs font-bold py-1.5 px-2 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1 ${
                                  profFull
                                    ? 'bg-white text-slate-400 cursor-not-allowed border border-slate-200'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-slate-900 active:scale-95'
                                }`}
                              >
                                {claimingShiftId === shift.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : profFull ? (
                                  <span>Role Full ({userProf})</span>
                                ) : (
                                  <span>Claim Spot</span>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
