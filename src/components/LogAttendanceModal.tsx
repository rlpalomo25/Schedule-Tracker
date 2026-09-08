import React, { useState, useEffect, useMemo } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { useAuth } from '../context/AuthContext';
import { Employee, AttendanceType, AttendanceStatus } from '../types';
import { X, ShieldCheck, Palmtree, Clock, AlertTriangle, UserCheck, Calendar, Ban } from 'lucide-react';
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
  const { employees, attendanceRecords, addAttendanceRecord, selectedDate } = useSchedule();
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
  const [validationError, setValidationError] = useState<string | null>(null);

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

  useEffect(() => {
    if (isOpen) {
      setDate(selectedDate);
      setEndDate(selectedDate);
      setValidationError(null);
    }
  }, [isOpen, selectedDate]);

  // Validation step: Check if the employee already has an attendance entry for the selected date/range
  const duplicateRecords = useMemo(() => {
    if (!employeeId || !date) return [];
    const targetEnd = (type === 'PTO' && endDate && endDate >= date) ? endDate : date;

    return attendanceRecords.filter(record => {
      if (record.employeeId !== employeeId) return false;
      const recStart = record.date;
      const recEnd = record.endDate && record.endDate >= record.date ? record.endDate : record.date;
      // Overlap condition: existing record span overlaps requested span
      return recStart <= targetEnd && recEnd >= date;
    });
  }, [employeeId, date, endDate, type, attendanceRecords]);

  const hasDuplicate = duplicateRecords.length > 0;
  const primaryDuplicate = duplicateRecords[0];

  if (!isOpen) return null;

  const selectedEmp = employees.find(e => e.id === employeeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    if (hasDuplicate && primaryDuplicate) {
      setValidationError(
        `Validation Failed: A duplicate ${primaryDuplicate.type} log already exists for ${selectedEmp.name} on ${date}.`
      );
      return;
    }

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
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {type === 'PTO' ? 'Start Date' : 'Event Date'}
                </label>
                <input
                  id="attendance-log-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setValidationError(null);
                  }}
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-slate-900 font-medium focus:outline-hidden transition-colors ${
                    hasDuplicate
                      ? 'border-rose-400 bg-rose-50/20 text-rose-950 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                  }`}
                  required
                />
              </div>

              {type === 'PTO' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    End Date (For Multi-Day)
                  </label>
                  <input
                    id="attendance-log-end-date-input"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setValidationError(null);
                    }}
                    className={`w-full px-3 py-2 bg-white border rounded-xl text-slate-900 font-medium focus:outline-hidden transition-colors ${
                      hasDuplicate
                        ? 'border-rose-400 bg-rose-50/20 text-rose-950 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Duplicate Date Validation Banner */}
            {hasDuplicate && primaryDuplicate && (
              <div
                id="duplicate-attendance-alert"
                role="alert"
                className="mt-2.5 p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 animate-in fade-in duration-150"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                    <Ban className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-rose-900 text-sm">Duplicate Attendance Log Detected</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800 uppercase tracking-wide">
                        Already Logged
                      </span>
                    </div>
                    <p className="mt-1 text-rose-800 leading-relaxed">
                      <strong className="text-rose-950">{selectedEmp?.name}</strong> already has an existing{' '}
                      <span className="font-bold uppercase tracking-wider text-rose-950 px-1.5 py-0.5 bg-white rounded border border-rose-300 inline-block shadow-2xs">
                        {primaryDuplicate.type}
                      </span>{' '}
                      entry recorded for <span className="font-semibold underline">{primaryDuplicate.date}{primaryDuplicate.endDate && primaryDuplicate.endDate !== primaryDuplicate.date ? ` to ${primaryDuplicate.endDate}` : ''}</span>.
                    </p>

                    <div className="mt-2 pt-2 border-t border-rose-200/80 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-rose-800 bg-white/60 p-2 rounded-lg border border-rose-200/60">
                      <div>
                        <span className="text-rose-600 font-medium">Record Status: </span>
                        <span className="font-bold text-rose-900">{primaryDuplicate.status}</span>
                      </div>
                      <div>
                        <span className="text-rose-600 font-medium">Supervisor: </span>
                        <span className="font-semibold text-rose-900">{primaryDuplicate.supervisorApprovedBy || 'Supervisor'}</span>
                      </div>
                      <div className="col-span-2 truncate">
                        <span className="text-rose-600 font-medium">Recorded Reason: </span>
                        <span className="font-medium text-rose-900">{primaryDuplicate.reason || 'None specified'}</span>
                      </div>
                      {primaryDuplicate.minutesLate ? (
                        <div className="col-span-2">
                          <span className="text-rose-600 font-medium">Delay: </span>
                          <span className="font-bold text-rose-900">{primaryDuplicate.minutesLate} minutes late ({primaryDuplicate.scheduledTime} → {primaryDuplicate.actualTime})</span>
                        </div>
                      ) : null}
                    </div>

                    <p className="mt-2 text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      Duplicate logs for the same date are prevented. Please select an alternate date or modify the existing log.
                    </p>
                  </div>
                </div>
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

          {/* Validation Error Alert */}
          {validationError && (
            <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl text-xs text-rose-900 font-semibold flex items-center gap-2 animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              id="btn-save-attendance-record"
              type="submit"
              disabled={hasDuplicate}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 ${
                hasDuplicate
                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-[0.99]'
              }`}
            >
              {hasDuplicate ? (
                <>
                  <Ban className="w-4 h-4 text-rose-500" />
                  <span>Cannot Save — Duplicate Entry for Selected Date</span>
                </>
              ) : (
                'Save Attendance Record'
              )}
            </button>
            {hasDuplicate && (
              <p className="mt-1.5 text-center text-[11px] text-slate-500">
                Change the selected date or choose another team member to enable saving.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
