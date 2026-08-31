import React, { useState, useMemo } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { Employee, DayOfWeek } from '../types';
import { calculateShiftDurationHours } from '../data/teamData';
import { checkShiftOverlapWithAttendance, ShiftConflictInfo } from '../utils/conflictUtils';
import { Search, Filter, Calendar, Edit3, CheckCircle2, UserCheck, Shield, AlertTriangle, Printer } from 'lucide-react';

interface WeeklyMatrixProps {
  onSelectEmployee: (emp: Employee) => void;
  onEditShift: (emp: Employee, day: DayOfWeek) => void;
  onExportPdf?: () => void;
}

export const WeeklyMatrix: React.FC<WeeklyMatrixProps> = ({
  onSelectEmployee,
  onEditShift,
  onExportPdf,
}) => {
  const { employees, selectedDay, setSelectedDay, selectedDate, attendanceRecords } = useSchedule();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');

  const days: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const departments = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department))).sort();
  }, [employees]);

  const countries = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.country))).sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
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
  }, [employees, search, selectedDept, selectedCountry]);

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
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Weekly Master Schedule Matrix (7 Days)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Complete team roster from Google Drive sheet with shift start/end hours and days off
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search roster..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:bg-white focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Countries</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Export PDF Button */}
          {onExportPdf && (
            <button
              id="btn-weekly-matrix-export-pdf"
              onClick={onExportPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-2xs cursor-pointer ml-auto"
              title="Generate and print weekly matrix schedule PDF report"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export Weekly PDF</span>
            </button>
          )}
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
              {days.map(day => (
                <th
                  key={day}
                  className={`py-3 px-3 font-semibold text-center cursor-pointer transition-colors ${
                    selectedDay === day ? 'bg-indigo-900/60 text-white font-bold' : 'hover:bg-slate-800'
                  }`}
                  onClick={() => setSelectedDay(day)}
                  title={`Click to view ${day} in Daily Timeline`}
                >
                  <div className="flex flex-col items-center">
                    <span>{day}</span>
                    {selectedDay === day && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-0.5" />
                    )}
                  </div>
                </th>
              ))}
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
