import React from 'react';
import { Employee, DayOfWeek } from '../types';
import { useSchedule } from '../context/ScheduleContext';
import { calculateShiftDurationHours } from '../data/teamData';
import {
  X,
  Calendar,
  Clock,
  Mail,
  MapPin,
  Shield,
  UserCheck,
  Palmtree,
  AlertTriangle,
  PlusCircle
} from 'lucide-react';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onLogAttendance: (emp: Employee) => void;
  onEditShift: (emp: Employee, day: DayOfWeek) => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  isOpen,
  onClose,
  employee,
  onLogAttendance,
  onEditShift,
}) => {
  const { attendanceRecords, timeEntries, selectedDay } = useSchedule();

  if (!isOpen || !employee) return null;

  const days: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const empAttendance = attendanceRecords.filter(r => r.employeeId === employee.id);
  const empTimeEntries = timeEntries.filter(t => t.employeeId === employee.id);

  const weeklyHours = days.reduce((total, d) => {
    const s = employee.schedule[d];
    if (!s || s.isOff) return total;
    return total + calculateShiftDurationHours(s.start, s.end);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Banner */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl ${employee.avatarColor || 'bg-indigo-600'} text-white font-extrabold text-base flex items-center justify-center shadow-md ring-2 ring-white/20`}>
              {employee.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{employee.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-400/40">
                  {employee.department}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {employee.email}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {employee.country}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
          {/* Key Info Bar */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Supervisor</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{employee.supervisor}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Manager</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{employee.manager}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Weekly Hours</span>
              <p className="font-bold text-indigo-700 text-sm font-mono mt-0.5">{weeklyHours} hrs ({employee.daysOffCount} Days Off)</p>
            </div>
          </div>

          {/* 7-Day Weekly Schedule Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Weekly Schedule Matrix (Click to Edit)</span>
              </h3>
              <span className="text-[11px] text-slate-400">Current day: {selectedDay}</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {days.map(d => {
                const shift = employee.schedule[d];
                const isOff = !shift || shift.isOff;
                const duration = isOff ? 0 : calculateShiftDurationHours(shift.start, shift.end);
                const isToday = selectedDay === d;

                return (
                  <button
                    key={d}
                    onClick={() => onEditShift(employee, d)}
                    className={`p-2.5 rounded-xl text-center border transition-all hover:scale-102 ${
                      isToday
                        ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-indigo-50/50'
                    }`}
                  >
                    <span className={`font-bold block ${isToday ? 'text-indigo-700' : 'text-slate-700'}`}>{d}</span>
                    {isOff ? (
                      <span className="inline-block mt-1 text-[10px] font-medium text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded-sm">
                        Off
                      </span>
                    ) : (
                      <>
                        <span className="block mt-1 font-mono font-bold text-[10px] text-slate-800">
                          {shift.start}
                        </span>
                        <span className="block font-mono text-[9px] text-slate-500">
                          {shift.end}
                        </span>
                        <span className="block text-[9px] text-indigo-600 font-medium mt-0.5">
                          {duration}h
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Attendance & PTO History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Attendance, PTO & Tardiness History ({empAttendance.length})</span>
              </h3>
              <button
                onClick={() => onLogAttendance(employee)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
            </div>

            {empAttendance.length === 0 ? (
              <p className="text-slate-400 py-3 text-center italic bg-slate-50 rounded-xl border border-slate-100">
                No recorded attendance exceptions (clean record)
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {empAttendance.map(record => (
                  <div key={record.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          record.type === 'PTO' ? 'bg-amber-100 text-amber-800' :
                          record.type === 'Tardiness' ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {record.type}
                        </span>
                        <span className="font-semibold text-slate-800">{record.date}</span>
                        {record.minutesLate && (
                          <span className="text-orange-700 font-bold">+{record.minutesLate}m late</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{record.reason}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Status: {record.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">Single Digits Employee ID: {employee.id}</span>
          <button
            onClick={() => onLogAttendance(employee)}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-colors"
          >
            Log PTO or Tardiness
          </button>
        </div>
      </div>
    </div>
  );
};
