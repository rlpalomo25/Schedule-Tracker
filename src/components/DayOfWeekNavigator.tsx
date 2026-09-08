import React, { useMemo } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { DayOfWeek } from '../types';
import { DAYS_OF_WEEK, getDatesForWeek } from '../utils/conflictUtils';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Users,
  AlertTriangle,
} from 'lucide-react';

const DAY_FULL_NAMES: Record<DayOfWeek, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export const DayOfWeekNavigator: React.FC = () => {
  const {
    selectedDay,
    setSelectedDay,
    selectedDate,
    setSelectedDate,
    employees,
    dailyConflicts,
  } = useSchedule();

  // Get date for each day of the current selected week
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

  // Today's real day of week
  const todayDayOfWeek = useMemo((): DayOfWeek => {
    const d = new Date();
    const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[d.getDay()];
  }, []);

  // On-shift count per day
  const dailyShiftStats = useMemo(() => {
    const stats: Record<DayOfWeek, { onShift: number; scheduledOff: number }> = {
      Mon: { onShift: 0, scheduledOff: 0 },
      Tue: { onShift: 0, scheduledOff: 0 },
      Wed: { onShift: 0, scheduledOff: 0 },
      Thu: { onShift: 0, scheduledOff: 0 },
      Fri: { onShift: 0, scheduledOff: 0 },
      Sat: { onShift: 0, scheduledOff: 0 },
      Sun: { onShift: 0, scheduledOff: 0 },
    };

    employees.forEach((emp) => {
      DAYS_OF_WEEK.forEach((day) => {
        const shift = emp.schedule[day];
        const isOff = !shift || shift.isOff || shift.start.toLowerCase() === 'off';
        if (isOff) {
          stats[day].scheduledOff++;
        } else {
          stats[day].onShift++;
        }
      });
    });

    return stats;
  }, [employees]);

  // Navigate back 1 day
  const handlePrevDay = () => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() - 1);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  // Navigate forward 1 day
  const handleNextDay = () => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + 1);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  // Jump to today
  const handleToday = () => {
    setSelectedDate(todayDateStr);
  };

  // Format the week range label (e.g. "Sep 7 – Sep 13, 2026")
  const weekRangeLabel = useMemo(() => {
    const mondayStr = weekDates['Mon'];
    const sundayStr = weekDates['Sun'];
    if (!mondayStr || !sundayStr) return '';

    const monDate = new Date(mondayStr + 'T12:00:00');
    const sunDate = new Date(sundayStr + 'T12:00:00');

    const monFormatted = monDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const sunFormatted = sunDate.toLocaleDateString(undefined, {
      month: monDate.getMonth() === sunDate.getMonth() ? undefined : 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return `${monFormatted} – ${sunFormatted}`;
  }, [weekDates]);

  // Formatted active day display
  const activeDateFormatted = useMemo(() => {
    try {
      const d = new Date(selectedDate + 'T12:00:00');
      return d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const isCurrentSelectionToday = selectedDate === todayDateStr;

  return (
    <section
      id="day-of-week-navigator"
      aria-label="Day of week selector"
      className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 transition-all"
    >
      {/* Top Banner: Date context & Quick Navigation Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        {/* Left: Day & Date Heading */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {activeDateFormatted}
              </h2>
              {isCurrentSelectionToday ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Today (Live)
                </span>
              ) : (
                <span className="text-xs text-slate-400 font-medium">
                  Viewing Schedule
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>Week: <strong className="text-slate-700">{weekRangeLabel}</strong></span>
              <span>•</span>
              <span className="text-indigo-600 font-medium">
                {dailyShiftStats[selectedDay].onShift} engineers on shift
              </span>
            </p>
          </div>
        </div>

        {/* Right: Step Navigation & Date Picker */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Previous Day Button */}
          <button
            id="btn-nav-prev-day"
            type="button"
            onClick={handlePrevDay}
            className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] sm:min-h-[38px] rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            title="Go to previous day"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev Day</span>
          </button>

          {/* Jump to Today Button */}
          <button
            id="btn-nav-jump-today"
            type="button"
            onClick={handleToday}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] sm:min-h-[38px] rounded-lg text-xs font-bold transition-all cursor-pointer border active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
              isCurrentSelectionToday
                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-default'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 shadow-2xs'
            }`}
            title="Jump back to current live day"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Today</span>
            {!isCurrentSelectionToday && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            )}
          </button>

          {/* Next Day Button */}
          <button
            id="btn-nav-next-day"
            type="button"
            onClick={handleNextDay}
            className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] sm:min-h-[38px] rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            title="Go to next day"
          >
            <span className="hidden sm:inline">Next Day</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7 Spacious Days of the Week Grid (Google Touch Target & Accessibility Standards) */}
      <div
        role="radiogroup"
        aria-label="Select day of the week"
        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-2.5"
      >
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDay === day;
          const dayDateStr = weekDates[day];
          const isToday = dayDateStr === todayDateStr;
          const shiftStat = dailyShiftStats[day];

          // Format day date for card (e.g. "Sep 7")
          let cardDateText = '';
          try {
            if (dayDateStr) {
              const d = new Date(dayDateStr + 'T12:00:00');
              cardDateText = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }
          } catch {
            cardDateText = '';
          }

          return (
            <button
              key={day}
              id={`day-card-${day}`}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              type="button"
              onClick={() => {
                setSelectedDay(day);
                if (dayDateStr) {
                  setSelectedDate(dayDateStr);
                }
              }}
              className={`relative flex flex-col p-3.5 min-h-[96px] rounded-xl text-left transition-all cursor-pointer border active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/30'
                  : 'bg-slate-50/70 hover:bg-slate-100/90 text-slate-700 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Card Top: Day abbreviation & Full Name & Today Badge */}
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`text-xs font-black tracking-wider uppercase ${isSelected ? 'text-indigo-100' : 'text-slate-600'}`}>
                  {day}
                </span>

                {isToday && (
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-white text-indigo-700'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    Today
                  </span>
                )}
              </div>

              {/* Day Full Name & Date Number */}
              <div className="flex items-baseline justify-between mt-0.5">
                <span className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {DAY_FULL_NAMES[day]}
                </span>
              </div>

              {/* Calendar Date e.g. "Sep 7" */}
              <div className={`text-xs font-semibold mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-600'}`}>
                {cardDateText || day}
              </div>

              {/* Shift Headcount Status Badge */}
              <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1">
                  <Users className={`w-3 h-3 ${isSelected ? 'text-indigo-200' : 'text-indigo-600'}`} />
                  <span className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                    {shiftStat.onShift} on shift
                  </span>
                </div>
                <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {shiftStat.scheduledOff} off
                </span>
              </div>

              {/* Selected indicator bottom pill */}
              {isSelected && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-white shadow-xs" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
