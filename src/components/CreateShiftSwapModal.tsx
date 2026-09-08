import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowLeftRight,
  UserCheck,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
  Send,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { useAuth } from '../context/AuthContext';
import { Employee, DayOfWeek, SwapRequestType } from '../types';
import { calculateShiftDurationHours } from '../data/teamData';

interface CreateShiftSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedEmployee?: Employee | null;
  preselectedDay?: DayOfWeek;
}

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const COMMON_REASONS = [
  'Doctor / Medical appointment',
  'Family commitment / Event',
  'Childcare or school conflict',
  'Travel / Flight schedule',
  'Academic / University exam',
  'Personal emergency'
];

export const CreateShiftSwapModal: React.FC<CreateShiftSwapModalProps> = ({
  isOpen,
  onClose,
  preselectedEmployee,
  preselectedDay = 'Mon'
}) => {
  const { employees, createShiftSwapRequest, selectedDate } = useSchedule();
  const { currentUser, isManagerOrSupervisor } = useAuth();

  // Selected requester (defaults to currentUser or preselectedEmployee or first employee)
  const [requesterId, setRequesterId] = useState<string>(() => {
    return preselectedEmployee?.id || currentUser?.id || employees[0]?.id || '';
  });

  const [requestType, setRequestType] = useState<SwapRequestType>('swap');
  const [requesterDay, setRequesterDay] = useState<DayOfWeek>(preselectedDay);
  
  // Target colleague selection
  const [isOpenPool, setIsOpenPool] = useState(false);
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>('');
  const [targetDay, setTargetDay] = useState<DayOfWeek>(preselectedDay);

  const [reason, setReason] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Sync state if modal reopens or preselected props change
  React.useEffect(() => {
    if (isOpen) {
      const defaultId = preselectedEmployee?.id || currentUser?.id || employees[0]?.id || '';
      setRequesterId(defaultId);
      setRequesterDay(preselectedDay || 'Mon');
      setTargetDay(preselectedDay || 'Mon');
      setSubmittedSuccess(false);
      setReason('');
      setCustomNote('');
      setIsOpenPool(false);
    }
  }, [isOpen, preselectedEmployee, currentUser, preselectedDay, employees]);

  const requester = useMemo(() => {
    return employees.find(e => e.id === requesterId) || employees[0];
  }, [employees, requesterId]);

  // Colleagues available for swap (exclude requester)
  const eligibleColleagues = useMemo(() => {
    if (!requester) return [];
    return employees.filter(e => e.id !== requester.id);
  }, [employees, requester]);

  // Default target employee if not set
  React.useEffect(() => {
    if (eligibleColleagues.length > 0 && !targetEmployeeId) {
      // Pick someone from the same department if possible
      const sameDept = eligibleColleagues.find(c => c.department === requester?.department);
      setTargetEmployeeId(sameDept ? sameDept.id : eligibleColleagues[0].id);
    }
  }, [eligibleColleagues, targetEmployeeId, requester]);

  const targetColleague = useMemo(() => {
    if (isOpenPool) return null;
    return employees.find(e => e.id === targetEmployeeId) || null;
  }, [employees, targetEmployeeId, isOpenPool]);

  // Shifts
  const requesterShift = requester?.schedule[requesterDay] || { start: '9:00', end: '18:00', isOff: false };
  const targetShift = targetColleague?.schedule[targetDay] || { start: '9:00', end: '18:00', isOff: false };

  // Calculate durations
  const requesterHours = requesterShift.isOff
    ? 0
    : calculateShiftDurationHours(requesterShift.start, requesterShift.end);

  const targetHours = targetColleague && !targetShift.isOff
    ? calculateShiftDurationHours(targetShift.start, targetShift.end)
    : 0;

  // Department match check
  const isSameDepartment = targetColleague ? requester?.department === targetColleague.department : true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requester) return;

    if (!reason.trim()) {
      alert('Please enter or select a reason for the shift swap request.');
      return;
    }

    if (requestType === 'swap' && !isOpenPool && !targetColleague) {
      alert('Please select a colleague to trade shifts with.');
      return;
    }

    const fullReason = customNote.trim() ? `${reason.trim()} (${customNote.trim()})` : reason.trim();

    createShiftSwapRequest({
      requestType,
      requesterId: requester.id,
      requesterName: requester.name,
      requesterDepartment: requester.department,
      requesterSupervisor: requester.supervisor,
      requesterDay,
      requesterDate: selectedDate,
      requesterShift: { ...requesterShift },
      isOpenPool: requestType === 'coverage' && isOpenPool,
      targetEmployeeId: isOpenPool ? undefined : targetColleague?.id,
      targetEmployeeName: isOpenPool ? undefined : targetColleague?.name,
      targetDay: requestType === 'swap' ? targetDay : undefined,
      targetDate: selectedDate,
      targetShift: requestType === 'swap' && targetColleague ? { ...targetShift } : undefined,
      reason: fullReason
    });

    setSubmittedSuccess(true);
    setTimeout(() => {
      onClose();
      setSubmittedSuccess(false);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="swap-modal-title"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs text-white">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 id="swap-modal-title" className="text-base font-bold text-white">
                Propose Shift Swap / Coverage
              </h2>
              <p className="text-xs text-indigo-100">
                Peer-to-peer shift trade with supervisor one-click approval
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-100 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Shift Request Submitted!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              {requestType === 'swap'
                ? `Swap invitation sent to ${targetColleague?.name}. Once accepted, it will be forwarded to ${requester?.supervisor} for supervisor sign-off.`
                : isOpenPool
                ? `Coverage request posted to the open team pool for ${requester?.department}. Any available teammate can claim it.`
                : `Coverage request sent to ${targetColleague?.name} and forwarded to ${requester?.supervisor}.`}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Request Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Request Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRequestType('swap');
                    setIsOpenPool(false);
                  }}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    requestType === 'swap'
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 text-indigo-900'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${requestType === 'swap' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">2-Way Shift Swap</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Trade your scheduled shift for a colleague's shift on another day.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType('coverage')}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    requestType === 'coverage'
                      ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/20 text-teal-900'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${requestType === 'coverage' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">1-Way Shift Coverage</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Find a colleague or team volunteer to cover your shift.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Requester & Their Shift Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  1. My Shift (Giving Away / Trading)
                </span>
                <span className="text-[11px] text-slate-500">Supervisor: {requester?.supervisor}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Employee Selector (if manager/supervisor or demo user switching) */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Requester Employee
                  </label>
                  <select
                    value={requesterId}
                    onChange={(e) => setRequesterId(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Day of week */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Scheduled Day
                  </label>
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {DAYS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setRequesterDay(d)}
                        className={`flex-1 min-w-[36px] py-1.5 text-center text-xs font-bold rounded-lg border transition-all ${
                          requesterDay === d
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Requester Shift Preview Card */}
              <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold text-slate-700">Scheduled Hours:</span>
                  {requesterShift.isOff ? (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-md">
                      Off Day
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md">
                      {requesterShift.start} – {requesterShift.end} ({requesterHours}h)
                    </span>
                  )}
                </div>
                {requesterShift.isOff && (
                  <span className="text-[11px] text-amber-600 font-medium">
                    Note: Currently scheduled Off on {requesterDay}
                  </span>
                )}
              </div>
            </div>

            {/* Target Partner / Coverage Recipient Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-600" />
                  2. {requestType === 'swap' ? 'Trading Partner Shift' : 'Coverage Volunteer'}
                </span>

                {requestType === 'coverage' && (
                  <label className="flex items-center gap-1.5 text-xs text-indigo-700 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOpenPool}
                      onChange={(e) => setIsOpenPool(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Post to Open Department Pool</span>
                  </label>
                )}
              </div>

              {isOpenPool && requestType === 'coverage' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Broadcasting to {requester?.department}</div>
                    <div className="text-[11px] text-blue-700 mt-0.5">
                      This shift will be placed on the Open Coverage Board. Any qualified colleague on the team can click to claim it, which automatically submits it for supervisor sign-off.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Select Colleague */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Select Colleague
                    </label>
                    <select
                      value={targetEmployeeId}
                      onChange={(e) => setTargetEmployeeId(e.target.value)}
                      className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <optgroup label={`Same Department (${requester?.department})`}>
                        {eligibleColleagues
                          .filter(c => c.department === requester?.department)
                          .map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.department})
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Other Departments">
                        {eligibleColleagues
                          .filter(c => c.department !== requester?.department)
                          .map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.department})
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* For 2-Way Swap: Target Day */}
                  {requestType === 'swap' ? (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Colleague's Shift Day
                      </label>
                      <div className="flex gap-1 overflow-x-auto pb-1">
                        {DAYS.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setTargetDay(d)}
                            className={`flex-1 min-w-[36px] py-1.5 text-center text-xs font-bold rounded-lg border transition-all ${
                              targetDay === d
                                ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-xs text-slate-600 pt-5">
                      <span className="text-slate-500">
                        {targetColleague?.name} will cover your shift on {requesterDay}.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Target Shift Preview & Department alignment alert */}
              {targetColleague && requestType === 'swap' && (
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span className="font-semibold text-slate-700">{targetColleague.name}'s Shift:</span>
                    {targetShift.isOff ? (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-md">
                        Off Day
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 font-bold rounded-md">
                        {targetShift.start} – {targetShift.end} ({targetHours}h)
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isSameDepartment ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isSameDepartment ? 'Same Department' : 'Cross-Department'}
                  </span>
                </div>
              )}
            </div>

            {/* Reason & Notes Section */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Reason for Trade / Request *
              </label>

              {/* Common Reason Quick Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {COMMON_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                      reason === r
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Or specify custom reason..."
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />

              <div className="mt-2">
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Additional note to colleague or supervisor (optional)..."
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Shift Rules & One-Click Approval Explainer Callout */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Workflow Notice: </span>
                Once submitted, this request goes to your colleague to accept. Once accepted by both peers, it automatically notifies{' '}
                <span className="font-bold text-amber-950">{requester?.supervisor}</span> for 1-click supervisor approval. Upon approval, both teammates' schedules are automatically updated on the Daily Timeline and Weekly Matrix.
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-submit-shift-swap"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Request</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
