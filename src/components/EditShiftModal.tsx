import React, { useState, useEffect } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { Employee, DayOfWeek } from '../types';
import { X, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EditShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  day: DayOfWeek;
}

export const EditShiftModal: React.FC<EditShiftModalProps> = ({
  isOpen,
  onClose,
  employee,
  day,
}) => {
  const { updateEmployeeSchedule } = useSchedule();

  const currentShift = employee?.schedule[day];
  const [isOff, setIsOff] = useState(currentShift?.isOff ?? false);
  const [start, setStart] = useState(currentShift?.start ?? '9:00');
  const [end, setEnd] = useState(currentShift?.end ?? '18:00');

  useEffect(() => {
    if (employee && day) {
      const s = employee.schedule[day];
      setIsOff(s?.isOff ?? false);
      setStart(s?.start === 'Off' ? '9:00' : (s?.start || '9:00'));
      setEnd(s?.end === 'Off' ? '18:00' : (s?.end || '18:00'));
    }
  }, [employee, day]);

  if (!isOpen || !employee) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmployeeSchedule(employee.id, day, start, end, isOff);
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
    onClose();
  };

  const commonShifts = [
    { label: '09:00 - 18:00 (Standard)', start: '9:00', end: '18:00' },
    { label: '08:00 - 17:00 (Morning)', start: '8:00', end: '17:00' },
    { label: '07:00 - 16:00 (Early)', start: '7:00', end: '16:00' },
    { label: '10:00 - 19:00 (Mid-Day)', start: '10:00', end: '19:00' },
    { label: '12:00 - 21:00 (Late)', start: '12:00', end: '21:00' },
    { label: '16:00 - 01:00 (Night)', start: '16:00', end: '1:00' },
    { label: '23:00 - 08:00 (Graveyard)', start: '23:00', end: '8:00' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Edit Shift Schedule</h2>
              <p className="text-xs text-slate-400">{employee.name} • {day}</p>
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
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {/* Day Off Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 text-sm">Scheduled Day Off</span>
              <p className="text-[11px] text-slate-500">Mark {day} as a rest day for this engineer</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isOff}
                onChange={(e) => setIsOff(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {!isOff && (
            <>
              {/* Preset Shift Templates */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Quick Shift Presets
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {commonShifts.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setStart(preset.start);
                        setEnd(preset.end);
                      }}
                      className="px-2 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-left text-[11px] text-slate-700 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom start / end inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Shift Start Time
                  </label>
                  <input
                    type="text"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    placeholder="9:00"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm focus:outline-hidden focus:border-indigo-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Shift End Time
                  </label>
                  <input
                    type="text"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    placeholder="18:00"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm focus:outline-hidden focus:border-indigo-600"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Update Shift Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
