import React, { useState, useEffect } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { useAuth } from '../context/AuthContext';
import { Employee, AttendanceType, AttendanceStatus } from '../types';
import { X, ShieldCheck, Palmtree, Clock, AlertTriangle, UserCheck, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LogAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetEmployee?: Employee | null;
  defaultType?: AttendanceType;
}

export const LogAttendanceModal: React.FC<LogAttendanceModalProps> = ({
  isOpen,
  onClose,
  targetEmployee,
  defaultType = 'PTO',
}) => {
  const { employees, addAttendanceRecord, selectedDate } = useSchedule();
  const { currentUser } = useAuth();

  const [employeeId, setEmployeeId] = useState<string>(targetEmployee?.id || currentUser?.id || employees[0]?.id || '');
  const [type, setType] = useState<AttendanceType>(defaultType);
  const [date, setDate] = useState<string>(selectedDate);
  const [endDate, setEndDate] = useState<string>(selectedDate);
  const [status, setStatus] = useState<AttendanceStatus>('Approved');
  const [minutesLate, setMinutesLate] = useState<number>(15);
  const [scheduledTime, setScheduledTime] = useState<string>('09:00');
  const [actualTime, setActualTime] = useState<string>('09:15');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [supervisorApprovedBy, setSupervisorApprovedBy] = useState<string>('');

  useEffect(() => {
    if (targetEmployee) {
      setEmployeeId(targetEmployee.id);
      setSupervisorApprovedBy(targetEmployee.supervisor);
    } else if (currentUser) {
      setEmployeeId(currentUser.id);
      setSupervisorApprovedBy(currentUser.supervisor);
    }
  }, [targetEmployee, currentUser]);

  useEffect(() => {
    setType(defaultType);
    if (defaultType === 'Tardiness') {
      setStatus('Recorded');
    } else if (defaultType === 'PTO') {
      setStatus('Approved');
    } else {
      setStatus('Recorded');
    }
  }, [defaultType]);

  if (!isOpen) return null;

  const selectedEmp = employees.find(e => e.id === employeeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    addAttendanceRecord({
      employeeId: selectedEmp.id,
      employeeName: selectedEmp.name,
      department: selectedEmp.department,
      type,
      date,
      endDate: type === 'PTO' && endDate !== date ? endDate : undefined,
      status,
      minutesLate: type === 'Tardiness' ? Number(minutesLate) : undefined,
      scheduledTime: type === 'Tardiness' ? scheduledTime : undefined,
      actualTime: type === 'Tardiness' ? actualTime : undefined,
      reason: reason.trim() || (type === 'PTO' ? 'Paid Time Off' : type === 'Tardiness' ? 'Late Arrival' : 'Unplanned Absence'),
      supervisorApprovedBy: supervisorApprovedBy || selectedEmp.supervisor,
      notes: notes.trim() || undefined,
    });

    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Log Attendance / PTO / Tardiness</h2>
              <p className="text-xs text-slate-400">Single Digits Team Attendance Record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Employee Select */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Team Member
            </label>
            <select
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value);
                const found = employees.find(emp => emp.id === e.target.value);
                if (found) setSupervisorApprovedBy(found.supervisor);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:border-indigo-600"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.department} • {emp.country})
                </option>
              ))}
            </select>
          </div>

          {/* Record Type Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Attendance Event Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setType('PTO'); setStatus('Approved'); }}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  type === 'PTO'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Palmtree className="w-3.5 h-3.5" />
                <span>PTO Leave</span>
              </button>

              <button
                type="button"
                onClick={() => { setType('Tardiness'); setStatus('Recorded'); }}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  type === 'Tardiness'
                    ? 'bg-orange-500 text-white border-orange-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Tardiness</span>
              </button>

              <button
                type="button"
                onClick={() => { setType('Absence'); setStatus('Recorded'); }}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  type === 'Absence' || type === 'Sick Leave'
                    ? 'bg-rose-500 text-white border-rose-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Absence / Sick</span>
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {type === 'PTO' ? 'Start Date' : 'Event Date'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:border-indigo-600"
                required
              />
            </div>

            {type === 'PTO' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  End Date (For Multi-Day)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:border-indigo-600"
                />
              </div>
            )}
          </div>

          {/* Tardiness Specific Fields */}
          {type === 'Tardiness' && (
            <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-orange-950 mb-1">
                    Scheduled Start
                  </label>
                  <input
                    type="text"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    placeholder="09:00"
                    className="w-full px-2.5 py-1.5 bg-white border border-orange-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-orange-950 mb-1">
                    Actual Arrival
                  </label>
                  <input
                    type="text"
                    value={actualTime}
                    onChange={(e) => setActualTime(e.target.value)}
                    placeholder="09:18"
                    className="w-full px-2.5 py-1.5 bg-white border border-orange-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-orange-950 mb-1">
                    Minutes Late
                  </label>
                  <input
                    type="number"
                    value={minutesLate}
                    onChange={(e) => setMinutesLate(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-orange-300 rounded-lg text-slate-900 font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason / Justification
            </label>
            <input
              type="text"
              placeholder={
                type === 'PTO'
                  ? 'e.g. Annual vacation, family travel, personal leave'
                  : type === 'Tardiness'
                  ? 'e.g. Heavy traffic, commute delay, internet outage, transit strike'
                  : 'e.g. Flu symptoms, family emergency, power outage'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:border-indigo-600"
              required
            />
          </div>

          {/* Approval & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Record Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:border-indigo-600"
              >
                <option value="Approved">Approved</option>
                <option value="Recorded">Recorded</option>
                <option value="Excused">Excused</option>
                <option value="Unexcused">Unexcused</option>
                <option value="Pending">Pending Manager Review</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Supervisor Approval
              </label>
              <input
                type="text"
                value={supervisorApprovedBy}
                onChange={(e) => setSupervisorApprovedBy(e.target.value)}
                placeholder="Supervisor Name"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Internal Notes / Coverage Peer (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Coverage handled by Karlo Jimenez; Slack notification sent"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-hidden focus:border-indigo-600"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Save Attendance Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
