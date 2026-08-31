import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';
import { calculateShiftDurationHours, timeStringToMinutes, formatTimeDisplay } from '../data/teamData';
import {
  Timer,
  Play,
  Pause,
  Square,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  User,
  LogIn,
  Sparkles,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TimeClockPortalProps {
  onOpenLogin: () => void;
}

export const TimeClockPortal: React.FC<TimeClockPortalProps> = ({ onOpenLogin }) => {
  const { currentUser, allEmployees, switchUser } = useAuth();
  const {
    selectedDate,
    selectedDay,
    currentTime,
    clockIn,
    clockOut,
    toggleBreak,
    getCurrentTimeEntry,
    getTimeEntriesForEmployee,
  } = useSchedule();

  const [shiftNote, setShiftNote] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const currentEntry = currentUser ? getCurrentTimeEntry(currentUser.id, selectedDate) : undefined;
  const clockStatus = currentEntry?.status || 'not_clocked_in';
  const historyEntries = currentUser ? getTimeEntriesForEmployee(currentUser.id) : [];

  // Today's scheduled shift for current user
  const todayShift = currentUser ? currentUser.schedule[selectedDay] : null;
  const isOffToday = !todayShift || todayShift.isOff;
  const scheduledHours = isOffToday ? 0 : calculateShiftDurationHours(todayShift.start, todayShift.end);

  // Live timer for active shift
  useEffect(() => {
    if (clockStatus === 'clocked_in' && currentEntry?.clockInTime) {
      const calculateElapsed = () => {
        const [h, m, s] = currentEntry.clockInTime.split(':').map(Number);
        const clockInDate = new Date();
        clockInDate.setHours(h, m, s || 0, 0);

        const now = new Date();
        const diffMs = Math.max(0, now.getTime() - clockInDate.getTime());
        const totalSecs = Math.floor(diffMs / 1000) - (currentEntry.totalBreakMinutes || 0) * 60;
        setElapsedSeconds(Math.max(0, totalSecs));
      };

      calculateElapsed();
      const interval = setInterval(calculateElapsed, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedSeconds(0);
    }
  }, [clockStatus, currentEntry]);

  const formatElapsedTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClockIn = () => {
    if (!currentUser) return;
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    clockIn(currentUser.id, shiftNote);
    setShiftNote('');
  };

  const handleClockOut = () => {
    if (!currentUser) return;
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.5 } });
    clockOut(currentUser.id, shiftNote);
    setShiftNote('');
  };

  const handleToggleBreak = () => {
    if (!currentUser) return;
    toggleBreak(currentUser.id);
  };

  // Weekly calculations for timesheet
  const totalWeeklyHours = historyEntries.reduce((sum, e) => sum + (e.totalHoursWorked || 0), 0);
  const totalWeeklyScheduled = 40; // baseline 40h workweek

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto">
            <Timer className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Daily Employee Hours & Punch Clock</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Log in with your Single Digits username or work email to clock in/out every day and track your hours.
          </p>
          <button
            onClick={onOpenLogin}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Log In with Username & Password</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with User Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${currentUser.avatarColor || 'bg-indigo-600'} text-white font-bold text-sm flex items-center justify-center shadow-xs`}>
            {currentUser.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{currentUser.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {currentUser.department}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {currentUser.email} • Supervisor: <strong className="text-slate-700">{currentUser.supervisor}</strong>
            </p>
          </div>
        </div>

        {/* Demo Switcher */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Switch Profile:</span>
          <select
            value={currentUser.id}
            onChange={(e) => switchUser(e.target.value)}
            className="bg-transparent text-xs font-bold text-indigo-700 focus:outline-hidden cursor-pointer"
          >
            {allEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.department.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Daily Punch Station */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Clock & Action Card */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
            {/* Background accent badge */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Daily Punch Station</span>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedDay}, {selectedDate}
                </p>
              </div>

              {/* Status Pill */}
              <div>
                {clockStatus === 'clocked_in' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Clocked In (Active)
                  </span>
                )}
                {clockStatus === 'on_break' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <Pause className="w-3 h-3" />
                    On Break
                  </span>
                )}
                {clockStatus === 'clocked_out' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                    <CheckCircle2 className="w-3 h-3" />
                    Shift Completed
                  </span>
                )}
                {clockStatus === 'not_clocked_in' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Clock className="w-3 h-3" />
                    Ready to Clock In
                  </span>
                )}
              </div>
            </div>

            {/* Shift Scheduled Info */}
            <div className="my-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Today's Scheduled Shift</span>
                  <p className="text-sm font-bold text-slate-900 font-mono">
                    {isOffToday ? 'Scheduled Off' : `${todayShift?.start} - ${todayShift?.end} (${scheduledHours} hrs)`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Supervisor</span>
                <span className="text-xs font-semibold text-slate-800">{currentUser.supervisor}</span>
              </div>
            </div>

            {/* Large Digital Clock & Active Elapsed Timer */}
            <div className="text-center py-4 bg-slate-950 rounded-2xl text-white shadow-inner my-4">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                {clockStatus === 'clocked_in' ? 'Elapsed Shift Duration' : 'Current Time'}
              </span>
              <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-white mt-1">
                {clockStatus === 'clocked_in'
                  ? formatElapsedTimer(elapsedSeconds)
                  : currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              {clockStatus === 'clocked_in' && currentEntry && (
                <p className="text-xs text-emerald-400 mt-1 font-mono">
                  Clocked in at {currentEntry.clockInTime}
                </p>
              )}
            </div>

            {/* Tardiness Notification Banner if logged late */}
            {currentEntry?.isTardy && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 text-xs flex items-start gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Tardiness Logged: </strong>
                  Clocked in {currentEntry.minutesTardy} minutes past scheduled start time ({todayShift?.start}). A note has been automatically appended to your attendance card.
                </div>
              </div>
            )}

            {/* Work / Shift Note Input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Daily Work Note / Task Summary (Optional)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Working on CALA escalation tickets, ticket backlog review..."
                  value={shiftNote}
                  onChange={(e) => setShiftNote(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Punch Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {clockStatus === 'not_clocked_in' ? (
                <button
                  onClick={handleClockIn}
                  className="sm:col-span-3 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Clock In for {selectedDay}</span>
                </button>
              ) : clockStatus === 'clocked_out' ? (
                <button
                  onClick={handleClockIn}
                  className="sm:col-span-3 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Re-Clock In / Extra Shift</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleToggleBreak}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 ${
                      clockStatus === 'on_break'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    <Pause className="w-4 h-4" />
                    <span>{clockStatus === 'on_break' ? 'End Break' : 'Start Break'}</span>
                  </button>

                  <button
                    onClick={handleClockOut}
                    className="sm:col-span-2 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Square className="w-4 h-4" />
                    <span>Clock Out & Submit Shift</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Weekly Hours & Shift Breakdown */}
        <div className="lg:col-span-6 space-y-4">
          {/* Hours Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span>Weekly Hours Tracked Summary</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </h3>

            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium block">Total Worked</span>
                <span className="text-xl font-extrabold text-slate-900 font-mono">
                  {totalWeeklyHours.toFixed(1)}h
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium block">Scheduled</span>
                <span className="text-xl font-extrabold text-indigo-600 font-mono">
                  {totalWeeklyScheduled}h
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium block">Weekly Target</span>
                <span className="text-xl font-extrabold text-emerald-600 font-mono">
                  {Math.min(100, Math.round((totalWeeklyHours / totalWeeklyScheduled) * 100))}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalWeeklyHours / totalWeeklyScheduled) * 100)}%` }}
              />
            </div>
          </div>

          {/* Timesheet History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
              <span>My Recent Timecard Entries</span>
              <span className="text-slate-400 font-normal">{historyEntries.length} logged shifts</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {historyEntries.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No previous time entries recorded for {currentUser.name}. Clock in above to create today's first log!
                </div>
              ) : (
                historyEntries.map((entry) => (
                  <div key={entry.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{entry.dayOfWeek}, {entry.date}</span>
                        {entry.isTardy && (
                          <span className="px-1.5 py-0.2 rounded-sm bg-orange-100 text-orange-800 text-[10px] font-bold">
                            +{entry.minutesTardy}m Late
                          </span>
                        )}
                        <span className={`px-1.5 py-0.2 rounded-sm text-[10px] font-medium ${
                          entry.status === 'clocked_out' ? 'bg-emerald-100 text-emerald-800' :
                          entry.status === 'clocked_in' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        In: {entry.clockInTime} {entry.clockOutTime ? `| Out: ${entry.clockOutTime}` : '| Active'}
                        {entry.totalBreakMinutes > 0 ? ` (Break: ${entry.totalBreakMinutes}m)` : ''}
                      </p>
                      {entry.notes && (
                        <p className="text-[11px] text-slate-600 italic mt-0.5 line-clamp-1">{entry.notes}</p>
                      )}
                    </div>

                    <div className="text-right font-mono font-bold text-slate-900">
                      <span>{entry.totalHoursWorked > 0 ? `${entry.totalHoursWorked} hrs` : 'In Progress'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
