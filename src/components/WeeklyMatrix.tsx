import React, { useState, useMemo } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { Employee, DayOfWeek } from '../types';
import { calculateShiftDurationHours, timeStringToMinutes } from '../data/teamData';
import { checkShiftOverlapWithAttendance, ShiftConflictInfo, getDatesForWeek } from '../utils/conflictUtils';
import {
  Search,
  Filter,
  Calendar,
  Edit3,
  CheckCircle2,
  UserCheck,
  Shield,
  AlertTriangle,
  Clock,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface WeeklyMatrixProps {
  onSelectEmployee: (emp: Employee) => void;
  onEditShift: (emp: Employee, day: DayOfWeek) => void;
}

export const WeeklyMatrix: React.FC<WeeklyMatrixProps> = ({
  onSelectEmployee,
  onEditShift,
}) => {
  const { employees, selectedDay, setSelectedDay, selectedDate, setSelectedDate, attendanceRecords } = useSchedule();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [sortByStartTime, setSortByStartTime] = useState<'none' | 'early' | 'late'>('none');

  const days: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const weekDates = useMemo(() => {
    return getDatesForWeek(selectedDate);
  }, [selectedDate]);

  // Today's real date string YYYY-MM-DD
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const handlePrevWeek = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const handleThisWeek = () => {
    setSelectedDate(todayDateStr);
  };

  const weekRangeLabel = useMemo(() => {
    const monStr = weekDates['Mon'];
    const sunStr = weekDates['Sun'];
    if (!monStr || !sunStr) return '';
    const m = new Date(monStr + 'T12:00:00');
    const s = new Date(sunStr + 'T12:00:00');
    return `${m.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [weekDates]);

  const departments = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department))).sort();
  }, [employees]);

  const countries = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.country))).sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const list = employees.filter(emp => {
      if (search) {
        const q = search.toLowerCase();
        if (!emp.name.toLowerCase().includes(q) && !emp.email.toLowerCase().includes(q) && !emp.department.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (selectedDept !== 'all' && emp.department !== selectedDept) return false;
      if (selectedCountry !== 'all' && emp.country !== selectedCountry) return false;
      return true;
    });

    if (sortByStartTime === 'none') {
      return list;
    }

    return [...list].sort((a, b) => {
      const shiftA = a.schedule[selectedDay];
      const shiftB = b.schedule[selectedDay];

      const onShiftA = Boolean(shiftA && !shiftA.isOff && shiftA.start && shiftA.start.toLowerCase() !== 'off');
      const onShiftB = Boolean(shiftB && !shiftB.isOff && shiftB.start && shiftB.start.toLowerCase() !== 'off');

      if (onShiftA && !onShiftB) return -1;
      if (!onShiftA && onShiftB) return 1;
      if (!onShiftA && !onShiftB) {
        return a.name.localeCompare(b.name);
      }

      const startMinsA = timeStringToMinutes(shiftA.start);
      const startMinsB = timeStringToMinutes(shiftB.start);

      if (startMinsA !== startMinsB) {
        return sortByStartTime === 'early' 
          ? startMinsA - startMinsB 
          : startMinsB - startMinsA;
      }

      const endMinsA = timeStringToMinutes(shiftA.end);
      const endMinsB = timeStringToMinutes(shiftB.end);
      if (endMinsA !== endMinsB) {
        return endMinsA - endMinsB;
      }

      return a.name.localeCompare(b.name);
    });
  }, [employees, search, selectedDept, selectedCountry, selectedDay, sortByStartTime]);

  // Calculate total weekly scheduled hours for an employee
  const getWeeklyTotalHours = (emp: Employee) => {
    return days.reduce((total, day) => {
      const shift = emp.schedule[day];
      if (!shift || shift.isOff) return total;
      return total + calculateShiftDurationHours(shift.start, shift.end);
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Weekly Master Schedule Matrix</span>
            </h2>
            <p className="text-xs text-slate-500">
              Complete team roster from Google Drive sheet with shift start/end hours and days off
            </p>
          </div>

          {/* Week Navigation Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700">
              <span className="font-semibold text-slate-900">Week:</span>
              <span className="font-bold text-indigo-700">{weekRangeLabel}</span>
            </div>

            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1.5 rounded-lg text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleThisWeek}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
              title="Current Week"
            >
              This Week
            </button>

            <button
              type="button"
              onClick={handleNextWeek}
              className="p-2 min-h-[44px] min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] flex items-center justify-center rounded-lg text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters and Sorting Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search roster..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          <select
            aria-label="Filter by department"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 min-h-[44px] sm:min-h-[38px] bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            aria-label="Filter by country"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-2 min-h-[44px] sm:min-h-[38px] bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Countries</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Sort by Shift Start Time Button Group */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              id="btn-weekly-matrix-sort-early"
              type="button"
              onClick={() => setSortByStartTime(prev => (prev === 'early' ? 'none' : 'early'))}
              className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[42px] sm:min-h-[36px] rounded-md text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                sortByStartTime === 'early'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
              }`}
              title={`Sort on-shift engineers from early start time to late start time for ${selectedDay}`}
            >
              <Clock className={`w-3.5 h-3.5 ${sortByStartTime === 'early' ? 'text-white' : 'text-indigo-600'}`} />
              <ArrowDownWideNarrow className="w-3.5 h-3.5" />
              <span>{sortByStartTime === 'early' ? `Early → Late (${selectedDay}) ✓` : 'Early → Late'}</span>
              {sortByStartTime === 'early' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              )}
            </button>
            <button
              id="btn-weekly-matrix-sort-late"
              type="button"
              onClick={() => setSortByStartTime(prev => (prev === 'late' ? 'none' : 'late'))}
              className={`inline-flex items-center gap-1 px-2.5 py-2 min-h-[42px] sm:min-h-[36px] rounded-md text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                sortByStartTime === 'late'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
              }`}
              title={`Sort on-shift engineers from late start time to early start time for ${selectedDay}`}
            >
              <ArrowUpNarrowWide className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Late → Early</span>
            </button>
          </div>

          {/* Reset / Clear */}
          {(search || selectedDept !== 'all' || selectedCountry !== 'all' || sortByStartTime !== 'none') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedDept('all');
                setSelectedCountry('all');
                setSortByStartTime('none');
              }}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>

      {/* Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-slate-200 border-b border-slate-800">
              <th className="py-3 px-4 font-semibold sticky left-0 bg-slate-900 z-10 w-60">
                Employee & Role
              </th>
              <th className="py-3 px-3 font-semibold">Department</th>
              <th className="py-3 px-3 font-semibold">Country</th>
              <th className="py-3 px-3 font-semibold">Supervisor</th>
              {days.map(day => {
                const dateStr = weekDates[day];
                let formattedDayDate = '';
                try {
                  if (dateStr) {
                    const d = new Date(dateStr + 'T12:00:00');
                    formattedDayDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  }
                } catch {
                  formattedDayDate = '';
                }

                return (
                  <th
                    key={day}
                    className={`py-3 px-3 font-semibold text-center cursor-pointer transition-colors ${
                      selectedDay === day ? 'bg-indigo-900/80 text-white font-bold' : 'hover:bg-slate-800'
                    }`}
                    onClick={() => {
                      setSelectedDay(day);
                      if (dateStr) setSelectedDate(dateStr);
                    }}
                    title={`Click to select ${day} (${dateStr})`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-xs">{day}</span>
                      <span className={`text-[10px] font-medium ${selectedDay === day ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {formattedDayDate}
                      </span>
                      {selectedDay === day && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-0.5" />
                      )}
                    </div>
                  </th>
                );
              })}
              <th className="py-3 px-3 font-semibold text-center">Days Off</th>
              <th className="py-3 px-4 font-semibold text-right">Weekly Hrs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEmployees.map((emp, index) => {
              const weeklyHours = getWeeklyTotalHours(emp);
              return (
                <tr
                  key={emp.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Employee Name */}
                  <td className="py-2.5 px-4 font-medium text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 shadow-2xs">
                    <button
                      onClick={() => onSelectEmployee(emp)}
                      className="flex items-center gap-2.5 text-left hover:text-indigo-600"
                    >
                      <div className={`w-7 h-7 rounded-full ${emp.avatarColor || 'bg-indigo-600'} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-900 truncate">{emp.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{emp.email}</p>
                      </div>
                    </button>
                  </td>

                  {/* Department */}
                  <td className="py-2.5 px-3 text-slate-600">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700">
                      {emp.department}
                    </span>
                  </td>

                  {/* Country */}
                  <td className="py-2.5 px-3 text-slate-600 font-medium">
                    {emp.country}
                  </td>

                  {/* Supervisor */}
                  <td className="py-2.5 px-3 text-slate-600">
                    <span className="text-[11px]">{emp.supervisor}</span>
                  </td>

                  {/* Day Columns */}
                  {days.map(day => {
                    const shift = emp.schedule[day];
                    const isOff = !shift || shift.isOff;
                    const duration = isOff ? 0 : calculateShiftDurationHours(shift.start, shift.end);
                    const isSelected = selectedDay === day;

                    // Check for conflict on this day
                    const isTodayColumn = day === selectedDay;
                    const conflict = isTodayColumn
                      ? checkShiftOverlapWithAttendance(emp, day, selectedDate, attendanceRecords)
                      : checkShiftOverlapWithAttendance(emp, day, selectedDate, attendanceRecords);

                    return (
                      <td
                        key={day}
                        onClick={() => onEditShift(emp, day)}
                        className={`py-2 px-2 text-center cursor-pointer transition-all hover:bg-indigo-50/80 ${
                          conflict.hasConflict
                            ? 'bg-amber-100/60 ring-1 ring-amber-400 font-semibold'
                            : isSelected
                            ? 'bg-indigo-50/40 font-semibold'
                            : ''
                        }`}
                        title={
                          conflict.hasConflict
                            ? `⚠️ Schedule Conflict on ${day}: Shift ${shift?.start}-${shift?.end} overlaps with approved ${conflict.conflictType} (${conflict.conflictingRecord?.reason}). Click to edit.`
                            : `Click to edit ${emp.name}'s shift for ${day}`
                        }
                      >
                        {isOff ? (
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-400 bg-slate-100">
                            Off
                          </span>
                        ) : conflict.hasConflict ? (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-950 font-bold bg-amber-200 px-1.5 py-0.5 rounded-md border border-amber-400 shadow-2xs">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                              <span>{shift.start}-{shift.end}</span>
                            </span>
                            <span className="text-[9px] text-amber-700 font-bold mt-0.5">
                              {conflict.conflictType} overlap
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="font-mono text-[11px] text-indigo-950 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100 group-hover:border-indigo-300">
                              {shift.start}-{shift.end}
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5">
                              {duration}h
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Days off check */}
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                      {emp.daysOffCount}
                    </span>
                  </td>

                  {/* Total Weekly Hours */}
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                    {weeklyHours}h
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
