import React, { useState, useMemo } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { useAuth } from '../context/AuthContext';
import { Employee, DayOfWeek, AttendanceRecord } from '../types';
import {
  timeStringToMinutes,
  calculateShiftDurationHours,
  isWorkingAtHour,
  formatTimeDisplay,
} from '../data/teamData';
import {
  checkShiftOverlapWithAttendance,
  getAllRosterConflictsForDate,
} from '../utils/conflictUtils';
import {
  Search,
  Filter,
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  AlertTriangle,
  Palmtree,
  Sparkles,
  ChevronRight,
  Info,
  Calendar,
  CheckCircle2,
  SlidersHorizontal,
  Printer,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyTimelineProps {
  onSelectEmployee: (emp: Employee) => void;
  onLogAttendanceForEmployee: (emp: Employee) => void;
  onExportPdf?: () => void;
}

export const DailyTimeline: React.FC<DailyTimelineProps> = ({
  onSelectEmployee,
  onLogAttendanceForEmployee,
  onExportPdf,
}) => {
  const {
    employees,
    selectedDay,
    selectedDate,
    filters,
    setFilters,
    currentTime,
    attendanceRecords,
    getCurrentTimeEntry,
    updateEmployeeSchedule,
  } = useSchedule();

  const { currentUser } = useAuth();
  const [showResolvedToast, setShowResolvedToast] = useState(false);

  // Current time in hours as float (e.g. 14.5 = 2:30 PM)
  const currentHourFloat = currentTime.getHours() + currentTime.getMinutes() / 60;
  const currentTotalMins = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentMarkerPercent = (currentTotalMins / 1440) * 100;

  // Compute all roster shift vs approved PTO/absence conflicts for the selected day/date
  const dailyConflicts = useMemo(() => {
    return getAllRosterConflictsForDate(employees, selectedDay, selectedDate, attendanceRecords);
  }, [employees, selectedDay, selectedDate, attendanceRecords]);

  // Extract unique departments, countries, supervisors
  const departments = useMemo(() => {
    const set = new Set(employees.map(e => e.department));
    return Array.from(set).sort();
  }, [employees]);

  const countries = useMemo(() => {
    const set = new Set(employees.map(e => e.country));
    return Array.from(set).sort();
  }, [employees]);

  const supervisors = useMemo(() => {
    const set = new Set(employees.map(e => e.supervisor));
    return Array.from(set).sort();
  }, [employees]);

  // Hourly coverage breakdown (0 - 23)
  const hourlyCoverage = useMemo(() => {
    const counts = new Array(24).fill(0);
    employees.forEach(emp => {
      const shift = emp.schedule[selectedDay];
      if (!shift || shift.isOff) return;

      // check if on PTO or Absent today
      const records = attendanceRecords.filter(r => {
        if (r.employeeId !== emp.id) return false;
        if (r.date === selectedDate) return true;
        if (r.endDate && r.date <= selectedDate && r.endDate >= selectedDate) return true;
        return false;
      });
      const hasPTO = records.some(r => r.type === 'PTO' && r.status === 'Approved');
      const hasAbsence = records.some(r => r.type === 'Absence' || r.type === 'Sick Leave');
      if (hasPTO || hasAbsence) return;

      for (let h = 0; h < 24; h++) {
        if (isWorkingAtHour(shift.start, shift.end, h + 0.5)) {
          counts[h]++;
        }
      }
    });
    return counts;
  }, [employees, selectedDay, selectedDate, attendanceRecords]);

  const maxCoverageCount = Math.max(...hourlyCoverage, 1);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchName = emp.name.toLowerCase().includes(q);
        const matchEmail = emp.email.toLowerCase().includes(q);
        const matchDept = emp.department.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchDept) return false;
      }

      // Department
      if (filters.department !== 'all' && emp.department !== filters.department) {
        return false;
      }

      // Country
      if (filters.country !== 'all' && emp.country !== filters.country) {
        return false;
      }

      // Supervisor
      if (filters.supervisor !== 'all' && emp.supervisor !== filters.supervisor) {
        return false;
      }

      const shift = emp.schedule[selectedDay];
      const records = attendanceRecords.filter(r => {
        if (r.employeeId !== emp.id) return false;
        if (r.date === selectedDate) return true;
        if (r.endDate && r.date <= selectedDate && r.endDate >= selectedDate) return true;
        return false;
      });
      const hasPTO = records.some(r => r.type === 'PTO' && r.status === 'Approved');
      const hasTardy = records.some(r => r.type === 'Tardiness');
      const hasAbsence = records.some(r => r.type === 'Absence' || r.type === 'Sick Leave');
      const isWorkingNow = shift && !shift.isOff && isWorkingAtHour(shift.start, shift.end, currentHourFloat) && !hasPTO && !hasAbsence;

      const conflict = checkShiftOverlapWithAttendance(emp, selectedDay, selectedDate, attendanceRecords);

      // Status filter
      if (filters.statusFilter === 'conflict' && !conflict.hasConflict) return false;
      if (filters.statusFilter === 'working' && !isWorkingNow) return false;
      if (filters.statusFilter === 'off' && (!shift || !shift.isOff)) return false;
      if (filters.statusFilter === 'pto' && !hasPTO) return false;
      if (filters.statusFilter === 'tardy' && !hasTardy) return false;
      if (filters.statusFilter === 'absent' && !hasAbsence) return false;

      return true;
    });
  }, [employees, filters, selectedDay, selectedDate, attendanceRecords, currentHourFloat]);

  // Overall Statistics for today
  const stats = useMemo(() => {
    let onShift = 0;
    let currentlyWorking = 0;
    let scheduledOff = 0;
    let ptoCount = 0;
    let tardyCount = 0;
    let absenceCount = 0;

    employees.forEach(emp => {
      const shift = emp.schedule[selectedDay];
      const records = attendanceRecords.filter(r => {
        if (r.employeeId !== emp.id) return false;
        if (r.date === selectedDate) return true;
        if (r.endDate && r.date <= selectedDate && r.endDate >= selectedDate) return true;
        return false;
      });

      const hasPTO = records.some(r => r.type === 'PTO' && r.status === 'Approved');
      const hasTardy = records.some(r => r.type === 'Tardiness');
      const hasAbsence = records.some(r => r.type === 'Absence' || r.type === 'Sick Leave');

      if (hasPTO) ptoCount++;
      if (hasTardy) tardyCount++;
      if (hasAbsence) absenceCount++;

      if (shift && !shift.isOff) {
        onShift++;
        if (isWorkingAtHour(shift.start, shift.end, currentHourFloat) && !hasPTO && !hasAbsence) {
          currentlyWorking++;
        }
      } else {
        scheduledOff++;
      }
    });

    return {
      total: employees.length,
      onShift,
      currentlyWorking,
      scheduledOff,
      ptoCount,
      tardyCount,
      absenceCount,
      conflictCount: dailyConflicts.length,
    };
  }, [employees, selectedDay, selectedDate, attendanceRecords, currentHourFloat, dailyConflicts]);

  // Auto-resolve all conflicts for today by setting scheduled shift to Off
  const handleAutoResolveAllConflicts = () => {
    dailyConflicts.forEach(c => {
      updateEmployeeSchedule(c.employeeId, selectedDay, 'Off', 'Off', true);
    });
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 } });
    setShowResolvedToast(true);
    setTimeout(() => setShowResolvedToast(false), 4000);
  };

  // Helper to compute visual bar position (left %, width %)
  const getShiftBarSegments = (startStr: string, endStr: string) => {
    if (startStr.toLowerCase() === 'off' || endStr.toLowerCase() === 'off') return [];

    const startMins = timeStringToMinutes(startStr);
    const endMins = timeStringToMinutes(endStr);
    if (startMins === -1 || endMins === -1) return [];

    if (endMins > startMins) {
      // Standard same-day shift
      const leftPercent = (startMins / 1440) * 100;
      const widthPercent = ((endMins - startMins) / 1440) * 100;
      return [{ left: leftPercent, width: widthPercent, label: `${startStr} - ${endStr}` }];
    } else {
      // Overnight shift (crosses midnight, e.g. 23:00 to 8:00 or 16:00 to 1:00)
      const part1Left = (startMins / 1440) * 100;
      const part1Width = ((1440 - startMins) / 1440) * 100;

      const part2Left = 0;
      const part2Width = (endMins / 1440) * 100;

      return [
        { left: part1Left, width: part1Width, label: `${startStr} - 24:00` },
        { left: part2Left, width: part2Width, label: `00:00 - ${endStr}` },
      ];
    }
  };

  const hoursArray = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showResolvedToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-600 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-bold">Schedule Conflicts Resolved</p>
            <p className="text-[11px] text-emerald-200">Conflicted shifts were set to Scheduled Off for {selectedDay}.</p>
          </div>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Total Roster */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Team</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-[11px] text-slate-500">engineers</span>
          </div>
        </div>

        {/* Scheduled Today */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">{selectedDay} Scheduled</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-600">{stats.onShift}</span>
            <span className="text-[11px] text-slate-500">({stats.scheduledOff} Off)</span>
          </div>
        </div>

        {/* Currently Active */}
        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Active On Shift Now</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{stats.currentlyWorking}</span>
            <span className="text-[11px] text-emerald-600 font-medium">on duty</span>
          </div>
        </div>

        {/* Approved PTO */}
        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">On PTO Today</span>
            <Palmtree className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">{stats.ptoCount}</span>
            <span className="text-[11px] text-amber-600 font-medium">approved</span>
          </div>
        </div>

        {/* Tardiness */}
        <div className="bg-orange-50/70 p-3.5 rounded-xl border border-orange-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-800">Tardiness Logged</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-orange-700">{stats.tardyCount}</span>
            <span className="text-[11px] text-orange-600 font-medium">late arrivals</span>
          </div>
        </div>

        {/* Absences / Sick */}
        <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">Absences / Sick</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-700">{stats.absenceCount}</span>
            <span className="text-[11px] text-rose-600 font-medium">unplanned</span>
          </div>
        </div>

        {/* Schedule Conflicts Alert Card */}
        <div
          onClick={() => setFilters(prev => ({ ...prev, statusFilter: prev.statusFilter === 'conflict' ? 'all' : 'conflict' }))}
          className={`p-3.5 rounded-xl border shadow-2xs cursor-pointer transition-all ${
            dailyConflicts.length > 0
              ? 'bg-amber-500/10 border-amber-400 hover:bg-amber-500/20 ring-1 ring-amber-400/50'
              : 'bg-slate-50 border-slate-200'
          }`}
          title="Click to toggle Schedule Conflict filter"
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${dailyConflicts.length > 0 ? 'text-amber-900 font-bold' : 'text-slate-500'}`}>
              Shift Conflicts
            </span>
            <AlertTriangle className={`w-4 h-4 ${dailyConflicts.length > 0 ? 'text-amber-600 animate-bounce' : 'text-slate-400'}`} />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${dailyConflicts.length > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
              {stats.conflictCount}
            </span>
            <span className={`text-[11px] font-medium ${dailyConflicts.length > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
              {dailyConflicts.length > 0 ? 'overlaps' : 'no conflicts'}
            </span>
          </div>
        </div>
      </div>

      {/* SCHEDULE OVERLAP WARNING ALERT BANNER */}
      {dailyConflicts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/80 to-rose-50 border-2 border-amber-400/90 rounded-2xl p-4 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-amber-950">
                    Schedule Overlap Warning Alert ({dailyConflicts.length} {dailyConflicts.length === 1 ? 'conflict' : 'conflicts'} detected)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                    Action Recommended
                  </span>
                </div>
                <p className="text-xs text-amber-900/90 mt-0.5">
                  The following team members are currently assigned active shifts on <strong className="text-amber-950">{selectedDay} ({selectedDate})</strong> despite having approved PTO or absence records:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {dailyConflicts.map((c) => (
                    <span
                      key={c.employeeId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/90 border border-amber-300 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <strong className="text-amber-950">{c.employeeName}</strong>
                      <span className="text-[11px] text-slate-500">
                        (Shift: {c.scheduledShift?.start}-{c.scheduledShift?.end} vs {c.conflictType} &quot;{c.conflictingRecord?.reason}&quot;)
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex sm:flex-col lg:flex-row items-center gap-2 shrink-0 self-start md:self-center">
              <button
                onClick={() => setFilters(prev => ({ ...prev, statusFilter: 'conflict' }))}
                className="px-3 py-1.5 bg-amber-900 hover:bg-amber-950 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Conflicted ({dailyConflicts.length})</span>
              </button>

              <button
                onClick={handleAutoResolveAllConflicts}
                className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                title="Automatically sets conflicted employees to Scheduled Off for this day"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Auto-Set Shifts to Off</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hourly Staffing Density Curve */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>24-Hour Shift Coverage & Staffing Density ({selectedDay})</span>
            </h3>
            <p className="text-[11px] text-slate-500">Live headcount capacity per hour across all global tiers (excluding approved PTO/absences)</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-slate-600 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> &gt;15 Engineers (Peak)
            </span>
            <span className="flex items-center gap-1 text-slate-600 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-300" /> 6-15 Engineers
            </span>
            <span className="flex items-center gap-1 text-slate-600 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-100" /> Night / Weekend Tier
            </span>
          </div>
        </div>

        {/* Visual histogram bars */}
        <div className="grid grid-cols-24 gap-0.5 items-end h-16 pt-2 pb-1 border-b border-slate-200">
          {hourlyCoverage.map((count, hour) => {
            const heightPercent = Math.max(8, (count / maxCoverageCount) * 100);
            const isCurrentHour = currentTime.getHours() === hour;
            return (
              <div
                key={hour}
                className="flex flex-col items-center group relative h-full justify-end"
              >
                <div
                  className={`w-full rounded-t-xs transition-all ${
                    isCurrentHour
                      ? 'bg-indigo-600 ring-2 ring-indigo-400'
                      : count >= 15
                      ? 'bg-indigo-500 hover:bg-indigo-600'
                      : count >= 6
                      ? 'bg-indigo-300 hover:bg-indigo-400'
                      : 'bg-indigo-100 hover:bg-indigo-200'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                {/* Tooltip on hover */}
                <div className="hidden group-hover:block absolute bottom-full mb-1 z-30 bg-slate-900 text-white text-[10px] rounded-md px-2 py-1 whitespace-nowrap shadow-md pointer-events-none">
                  {hour.toString().padStart(2, '0')}:00 - {(hour + 1).toString().padStart(2, '0')}:00
                  <br />
                  <span className="font-bold text-indigo-300">{count} Engineers Active</span>
                </div>
              </div>
            );
          })}
        </div>
        {/* Hour markers row */}
        <div className="grid grid-cols-24 gap-0.5 mt-1 text-[10px] font-mono text-slate-400 text-center">
          {hoursArray.map((h) => (
            <span key={h} className={currentTime.getHours() === h ? 'text-indigo-600 font-bold' : ''}>
              {h % 3 === 0 ? `${h}` : '·'}
            </span>
          ))}
        </div>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="input-search-employees"
              type="text"
              placeholder="Search by engineer name, email, department..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-indigo-500"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Department */}
            <select
              id="select-filter-department"
              aria-label="Filter by department"
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {/* Country */}
            <select
              id="select-filter-country"
              aria-label="Filter by country"
              value={filters.country}
              onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Countries ({countries.length})</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Supervisor */}
            <select
              id="select-filter-supervisor"
              aria-label="Filter by supervisor"
              value={filters.supervisor}
              onChange={(e) => setFilters(prev => ({ ...prev, supervisor: e.target.value }))}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Supervisors ({supervisors.length})</option>
              {supervisors.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              id="select-filter-status"
              aria-label="Filter by status"
              value={filters.statusFilter}
              onChange={(e) => setFilters(prev => ({ ...prev, statusFilter: e.target.value as any }))}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="conflict">⚠️ Schedule Conflicts ({dailyConflicts.length})</option>
              <option value="working">🟢 Working Now</option>
              <option value="off">⬛ Scheduled Off</option>
              <option value="pto">🟡 On PTO</option>
              <option value="tardy">🔴 Late / Tardy</option>
              <option value="absent">🟠 Absent / Sick</option>
            </select>

            {/* Export PDF Button */}
            {onExportPdf && (
              <button
                id="btn-daily-timeline-export-pdf"
                onClick={onExportPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-2xs ml-auto cursor-pointer"
                title="Generate and print daily schedule PDF report"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-600" />
                <span>Export Daily PDF</span>
              </button>
            )}

            {/* Reset */}
            {(filters.search || filters.department !== 'all' || filters.country !== 'all' || filters.supervisor !== 'all' || filters.statusFilter !== 'all') && (
              <button
                onClick={() => setFilters({
                  search: '',
                  department: 'all',
                  country: 'all',
                  supervisor: 'all',
                  statusFilter: 'all',
                  dayOfWeek: selectedDay
                })}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{filteredEmployees.length}</strong> of {employees.length} team members for <strong className="text-indigo-600">{selectedDay}</strong> ({selectedDate})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[11px] text-slate-400">Red vertical needle marks current live time</span>
          </span>
        </div>
      </div>

      {/* 24-Hour Visual Schedule Gantt Timeline Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[960px]">
            {/* Timeline Header with Hours */}
            <div className="bg-slate-900 text-slate-200 px-4 py-3 flex items-center border-b border-slate-800 text-xs font-semibold">
              {/* Employee Info Header Column */}
              <div className="w-64 sm:w-72 shrink-0 pr-4 font-bold text-slate-100 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Team Member & Details</span>
              </div>

              {/* 24-Hour Scale Header with Vertical Time Markers */}
              <div className="flex-1 relative flex h-14">
                {hoursArray.map((hour) => {
                  const hourPadded = hour.toString().padStart(2, '0');
                  const isCurrent = currentTime.getHours() === hour;
                  return (
                    <div
                      key={hour}
                      className={`flex-1 flex flex-col items-center justify-center border-l border-slate-800/90 py-1 transition-colors ${
                        isCurrent ? 'bg-indigo-950/60 border-indigo-500/80 text-indigo-300' : 'text-slate-400'
                      }`}
                      title={`${hourPadded}:00`}
                    >
                      <div className="flex flex-col items-center leading-none tracking-tight">
                        <span className={`text-[10px] font-mono font-bold ${isCurrent ? 'text-indigo-300' : 'text-slate-300'}`}>
                          {hourPadded}
                        </span>
                        <span className={`text-[9px] font-mono opacity-60 ${isCurrent ? 'text-indigo-400' : 'text-slate-500'}`}>
                          :00
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions Column */}
              <div className="w-24 shrink-0 text-right pr-2 text-slate-400">
                Action
              </div>
            </div>

            {/* Timeline Body Rows with Live Needle */}
            <div className="relative divide-y divide-slate-100 min-h-[400px]">
              {/* Global Current Time Indicator Needle across all rows */}
              <div
                className="absolute top-0 bottom-0 z-10 pointer-events-none flex flex-col items-center"
                style={{
                  left: `calc(288px + (100% - 288px - 96px) * ${currentMarkerPercent / 100})`,
                }}
              >
                <div className="bg-rose-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs -translate-x-1/2 whitespace-nowrap z-20">
                  NOW {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="w-0.5 h-full bg-rose-500 shadow-xs opacity-80" />
              </div>

              {filteredEmployees.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-sm">No engineers match current filters</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting search or filter criteria</p>
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const shift = emp.schedule[selectedDay];
                  const isOff = !shift || shift.isOff;
                  const segments = getShiftBarSegments(shift?.start || 'Off', shift?.end || 'Off');
                  const shiftDuration = isOff ? 0 : calculateShiftDurationHours(shift.start, shift.end);

                  // Check Attendance records for today
                  const recordsToday = attendanceRecords.filter(r => {
                    if (r.employeeId !== emp.id) return false;
                    if (r.date === selectedDate) return true;
                    if (r.endDate && r.date <= selectedDate && r.endDate >= selectedDate) return true;
                    return false;
                  });

                  const ptoRecord = recordsToday.find(r => r.type === 'PTO');
                  const tardyRecord = recordsToday.find(r => r.type === 'Tardiness');
                  const absenceRecord = recordsToday.find(r => r.type === 'Absence' || r.type === 'Sick Leave');

                  // Shift conflict calculation
                  const conflict = checkShiftOverlapWithAttendance(emp, selectedDay, selectedDate, attendanceRecords);

                  // Status calculation
                  const isWorkingRightNow = !isOff && isWorkingAtHour(shift.start, shift.end, currentHourFloat) && !ptoRecord && !absenceRecord;
                  const isMyProfile = currentUser?.id === emp.id;

                  return (
                    <div
                      key={emp.id}
                      className={`flex items-center px-4 py-2.5 transition-colors group relative ${
                        conflict.hasConflict
                          ? 'bg-amber-50/60 border-l-4 border-amber-500 hover:bg-amber-100/40'
                          : isMyProfile
                          ? 'bg-indigo-50/40 font-medium hover:bg-indigo-50/60'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Employee Info Box */}
                      <div className="w-64 sm:w-72 shrink-0 pr-4 flex items-center justify-between">
                        <button
                          onClick={() => onSelectEmployee(emp)}
                          className="flex items-center gap-2.5 text-left hover:text-indigo-600 transition-colors truncate"
                        >
                          <div className={`w-8 h-8 rounded-full ${emp.avatarColor || 'bg-indigo-600'} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                            {emp.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1 truncate">
                              <span className="truncate">{emp.name}</span>
                              {isMyProfile && (
                                <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 text-[10px] rounded-sm font-semibold shrink-0">You</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {emp.department} • {emp.country}
                            </div>
                          </div>
                        </button>

                        {/* Status Pill Badge */}
                        <div className="shrink-0 text-right">
                          {conflict.hasConflict ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-950 border border-amber-400 shadow-2xs animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-amber-700" />
                              <span>Overlap: {conflict.conflictType}</span>
                            </span>
                          ) : ptoRecord ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Palmtree className="w-3 h-3" /> PTO
                            </span>
                          ) : absenceRecord ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertCircle className="w-3 h-3" /> {absenceRecord.type === 'Sick Leave' ? 'Sick' : 'Absent'}
                            </span>
                          ) : tardyRecord ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                              <Clock className="w-3 h-3" /> +{tardyRecord.minutesLate}m Tardy
                            </span>
                          ) : isWorkingRightNow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                            </span>
                          ) : isOff ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                              Off Day
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-mono text-slate-600 bg-slate-100">
                              {shift.start}-{shift.end}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 24-Hour Visual Schedule Bar Area */}
                      <div className="flex-1 relative h-9 flex items-center bg-slate-50/50 rounded-lg mx-2 border border-slate-100 overflow-hidden">
                        {/* Hourly vertical background grid lines */}
                        <div className="absolute inset-0 grid grid-cols-24 pointer-events-none">
                          {hoursArray.map((h) => (
                            <div key={h} className="border-r border-slate-200/40 h-full" />
                          ))}
                        </div>

                        {/* Shift Bar rendering */}
                        {isOff ? (
                          <div className="w-full text-center text-[11px] font-medium text-slate-400 italic">
                            Scheduled Off
                          </div>
                        ) : conflict.hasConflict ? (
                          /* Visual Conflict Overlap Bar */
                          <div className="w-full h-full flex items-center justify-between px-3 relative z-10 bg-amber-100/90 border border-amber-400 rounded-md">
                            <div className="flex items-center gap-2 truncate">
                              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                              <span className="text-xs font-bold text-amber-950 truncate">
                                ⚠️ Shift {shift.start} - {shift.end} overlaps with approved {conflict.conflictType} ({conflict.conflictingRecord?.reason})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateEmployeeSchedule(emp.id, selectedDay, 'Off', 'Off', true);
                                }}
                                className="px-2 py-0.5 bg-amber-800 hover:bg-amber-900 text-white rounded text-[10px] font-bold shadow-2xs transition-colors"
                                title="Set shift to Scheduled Off to resolve conflict"
                              >
                                Set Off
                              </button>
                            </div>
                          </div>
                        ) : ptoRecord ? (
                          <div className="w-full px-3 py-1 bg-amber-100/80 border border-amber-300 rounded-md text-amber-900 text-xs font-semibold flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Palmtree className="w-3.5 h-3.5 text-amber-700" />
                              <span>Approved PTO Leave: {ptoRecord.reason}</span>
                            </span>
                            <span className="text-[10px] text-amber-700 font-normal">
                              Approved by {ptoRecord.supervisorApprovedBy}
                            </span>
                          </div>
                        ) : absenceRecord ? (
                          <div className="w-full px-3 py-1 bg-rose-100/80 border border-rose-300 rounded-md text-rose-900 text-xs font-semibold flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                              <span>{absenceRecord.type}: {absenceRecord.reason}</span>
                            </span>
                            <span className="text-[10px] text-rose-700 font-normal">
                              Status: {absenceRecord.status}
                            </span>
                          </div>
                        ) : (
                          segments.map((seg, idx) => (
                            <div
                              key={idx}
                              className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-between text-white text-[11px] font-semibold shadow-2xs transition-transform hover:scale-y-105 cursor-pointer ${
                                isWorkingRightNow
                                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 ring-2 ring-emerald-300'
                                  : tardyRecord
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-600'
                                  : 'bg-gradient-to-r from-indigo-600 to-blue-600'
                              }`}
                              style={{
                                left: `${seg.left}%`,
                                width: `${Math.max(seg.width, 3)}%`,
                              }}
                              onClick={() => onSelectEmployee(emp)}
                              title={`${emp.name} (${emp.department})\nShift: ${shift.start} to ${shift.end} (${shiftDuration} hrs)\nSupervisor: ${emp.supervisor}`}
                            >
                              <span className="truncate font-mono text-[10px]">
                                {seg.label}
                              </span>
                              {seg.width > 12 && (
                                <span className="text-[9px] opacity-80 font-normal">
                                  {shiftDuration}h
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Quick Action Button */}
                      <div className="w-24 shrink-0 text-right">
                        <button
                          onClick={() => onLogAttendanceForEmployee(emp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors"
                          title="Log PTO, Absence or Tardiness for this employee"
                        >
                          <span>Track</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
