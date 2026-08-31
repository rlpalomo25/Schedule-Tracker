import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';
import { useTheme } from '../context/ThemeContext';
import { ViewTab, DayOfWeek, ThemeId } from '../types';
import {
  Clock,
  Calendar,
  User,
  LogIn,
  LogOut,
  SlidersHorizontal,
  FileSpreadsheet,
  PlusCircle,
  BarChart3,
  CalendarDays,
  ShieldCheck,
  Timer,
  Palette,
  Check,
  Moon,
  Sun,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
  onOpenLogin: () => void;
  onOpenLogAttendance: () => void;
  onOpenDriveSync: () => void;
  onOpenThemeModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenLogin,
  onOpenLogAttendance,
  onOpenDriveSync,
  onOpenThemeModal,
}) => {
  const { currentUser, logout, allEmployees, switchUser } = useAuth();
  const {
    currentTime,
    timezone,
    setTimezone,
    selectedDay,
    setSelectedDay,
    selectedDate,
    setSelectedDate,
    attendanceRecords,
    getCurrentTimeEntry,
  } = useSchedule();
  const { theme, setTheme, themes, currentThemeOption, isDark } = useTheme();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  // Timezone display
  const getTimeStringForTimezone = (date: Date, tz: string) => {
    try {
      if (tz === 'local') {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      return date.toLocaleTimeString([], {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return date.toLocaleTimeString();
    }
  };

  const daysList: { key: DayOfWeek; label: string }[] = [
    { key: 'Mon', label: 'Mon' },
    { key: 'Tue', label: 'Tue' },
    { key: 'Wed', label: 'Wed' },
    { key: 'Thu', label: 'Thu' },
    { key: 'Fri', label: 'Fri' },
    { key: 'Sat', label: 'Sat' },
    { key: 'Sun', label: 'Sun' },
  ];

  const todayTimeEntry = currentUser ? getCurrentTimeEntry(currentUser.id, selectedDate) : undefined;
  const todayClockStatus = todayTimeEntry?.status || 'not_clocked_in';

  // Quick stats for badge
  const pendingRecordsCount = attendanceRecords.filter(r => r.status === 'Pending').length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top utility row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3 border-b border-slate-100">
          {/* Logo & title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-sm ring-2 ring-indigo-50">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Team Schedule & Attendance Hub</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Live Operations
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Single Digits Escalations, UBF/BF, MDU & Senior Living Teams
              </p>
            </div>
          </div>

          {/* Timezone & Live Clock & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* World Timezone Switcher */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700">
              <Clock className="w-3.5 h-3.5 text-indigo-600 mr-1.5 shrink-0" />
              <select
                id="timezone-select"
                aria-label="Select timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="bg-transparent font-medium text-xs text-slate-800 focus:outline-hidden cursor-pointer pr-1"
              >
                <option value="local">Local System Time</option>
                <option value="America/Mexico_City">Mexico / Guatemala (CST)</option>
                <option value="Asia/Kolkata">India (IST)</option>
                <option value="Africa/Cairo">Egypt (EET)</option>
                <option value="Africa/Nairobi">Kenya (EAT)</option>
                <option value="America/New_York">US East (EDT/EST)</option>
                <option value="Asia/Manila">Philippines (PHT)</option>
              </select>
              <span className="ml-1.5 font-mono font-semibold text-indigo-700 border-l border-slate-200 pl-2">
                {getTimeStringForTimezone(currentTime, timezone)}
              </span>
            </div>

            {/* Google Drive Location Data Sync */}
            <button
              id="btn-drive-sync"
              onClick={onOpenDriveSync}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors"
              title="View Google Drive data source & export"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Drive Source</span>
            </button>

            {/* Dark Mode & Theme Switcher Button */}
            <div className="relative">
              <button
                id="btn-theme-selector-toggle"
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors"
                title={`Current theme: ${currentThemeOption.name} (${currentThemeOption.accentLabel}). Click to switch dark mode theme.`}
              >
                <div className="flex items-center gap-1">
                  {isDark ? (
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: currentThemeOption.accentHex }}
                  />
                </div>
                <span className="hidden md:inline font-semibold">{currentThemeOption.name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Theme Dropdown Menu */}
              {showThemeDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowThemeDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-900">Dark Mode & Themes</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">8 Styles</span>
                    </div>

                    <div className="p-1.5 max-h-72 overflow-y-auto space-y-1">
                      {themes.map((t) => {
                        const isSelected = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            id={`theme-btn-${t.id}`}
                            onClick={() => {
                              setTheme(t.id);
                              setShowThemeDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                              isSelected
                                ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200'
                                : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              {/* Swatch preview dots */}
                              <div className="flex items-center -space-x-1 shrink-0">
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs z-10"
                                  style={{ backgroundColor: t.bgHex }}
                                />
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs z-20"
                                  style={{ backgroundColor: t.accentHex }}
                                />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate">{t.name}</span>
                                  {t.isDark ? (
                                    <span className="text-[9px] px-1 py-0.2 bg-slate-800 text-slate-200 rounded font-normal shrink-0">
                                      Dark
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-800 rounded font-normal shrink-0">
                                      Light
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 font-normal truncate">
                                  {t.description}
                                </p>
                              </div>
                            </div>

                            {isSelected && (
                              <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[2.5]" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {onOpenThemeModal && (
                      <div className="px-2 pt-1.5 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setShowThemeDropdown(false);
                            onOpenThemeModal();
                          }}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>View Full Theme Palette Gallery</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Log Absence/PTO Button */}
            <button
              id="btn-log-attendance-header"
              onClick={onOpenLogAttendance}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Log PTO / Absence</span>
            </button>

            {/* User Profile / Login */}
            {currentUser ? (
              <div className="relative">
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <button
                    id="btn-user-profile-menu"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className={`w-8 h-8 rounded-full ${currentUser.avatarColor || 'bg-indigo-600'} text-white font-semibold text-xs flex items-center justify-center shadow-xs`}>
                      {currentUser.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="hidden lg:block text-left">
                      <div className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1">
                        {currentUser.name}
                        {currentUser.role === 'manager' && (
                          <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[10px] rounded-sm font-medium">Mgr</span>
                        )}
                        {currentUser.role === 'supervisor' && (
                          <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[10px] rounded-sm font-medium">Sup</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight">
                        {currentUser.department}
                      </div>
                    </div>
                  </button>

                  {/* Punch status pill */}
                  <button
                    id="btn-quick-punch-nav"
                    onClick={() => setCurrentTab('timecard')}
                    className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      todayClockStatus === 'clocked_in'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : todayClockStatus === 'on_break'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        : todayClockStatus === 'clocked_out'
                        ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      todayClockStatus === 'clocked_in' ? 'bg-emerald-500 animate-pulse' :
                      todayClockStatus === 'on_break' ? 'bg-amber-500' :
                      todayClockStatus === 'clocked_out' ? 'bg-slate-400' : 'bg-indigo-500'
                    }`} />
                    <span>
                      {todayClockStatus === 'clocked_in' ? 'Clocked In' :
                       todayClockStatus === 'on_break' ? 'On Break' :
                       todayClockStatus === 'clocked_out' ? 'Clocked Out' : 'Punch In'}
                    </span>
                  </button>
                </div>

                {/* Dropdown switch user / logout */}
                {showUserDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-medium text-slate-500">Signed in as</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-600">
                          <span>Supervisor: {currentUser.supervisor}</span>
                        </div>
                      </div>

                      <div className="px-2 py-1">
                        <button
                          onClick={() => {
                            setCurrentTab('timecard');
                            setShowUserDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg text-left"
                        >
                          <Timer className="w-4 h-4 text-indigo-600" />
                          <span>My Daily Timecard & Hours</span>
                        </button>
                      </div>

                      <div className="px-3 py-1.5 border-t border-slate-100">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Quick Switch Team Member (Demo)
                        </p>
                        <div className="max-h-40 overflow-y-auto space-y-0.5">
                          {allEmployees.slice(0, 10).map((emp) => (
                            <button
                              key={emp.id}
                              onClick={() => {
                                switchUser(emp.id);
                                setShowUserDropdown(false);
                              }}
                              className={`w-full flex items-center justify-between px-2 py-1 text-xs rounded-md text-left transition-colors ${
                                emp.id === currentUser.id
                                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <span className="truncate">{emp.name}</span>
                              <span className="text-[10px] text-slate-400 ml-1">{emp.department.split(' ')[0]}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="px-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            logout();
                            setShowUserDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg text-left transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                id="btn-login-header"
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-600" />
                <span>Employee Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs & Date / Day Selector Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 gap-3">
          {/* Main Navigation tabs with distinctive visual accents */}
          <nav className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0" aria-label="Tabs">
            {/* Daily Visual Timeline Tab */}
            <button
              id="tab-daily-timeline"
              onClick={() => setCurrentTab('daily_timeline')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 border cursor-pointer ${
                currentTab === 'daily_timeline'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20 ring-2 ring-blue-500/20'
                  : 'bg-white text-slate-700 hover:text-blue-700 hover:bg-blue-50/60 border-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${currentTab === 'daily_timeline' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className="tracking-tight">Daily Timeline</span>
              {currentTab === 'daily_timeline' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>

            {/* Weekly Schedule Matrix Tab */}
            <button
              id="tab-weekly-matrix"
              onClick={() => setCurrentTab('weekly_matrix')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 border cursor-pointer ${
                currentTab === 'weekly_matrix'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20 ring-2 ring-indigo-500/20'
                  : 'bg-white text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/60 border-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${currentTab === 'weekly_matrix' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                <CalendarDays className="w-3.5 h-3.5" />
              </div>
              <span className="tracking-tight">Weekly Schedule</span>
              {currentTab === 'weekly_matrix' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>

            {/* PTO, Absences & Tardiness Tab - Amber/Rose distinct accent */}
            <button
              id="tab-attendance-tracker"
              onClick={() => setCurrentTab('attendance_tracker')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 border cursor-pointer relative ${
                currentTab === 'attendance_tracker'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-500/20 ring-2 ring-amber-500/20'
                  : 'bg-white text-slate-700 hover:text-amber-800 hover:bg-amber-50/70 border-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${currentTab === 'attendance_tracker' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="tracking-tight">PTO & Absences</span>
              {pendingRecordsCount > 0 ? (
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                  currentTab === 'attendance_tracker' ? 'bg-white text-amber-800' : 'bg-amber-500 text-white'
                }`}>
                  {pendingRecordsCount}
                </span>
              ) : (
                currentTab === 'attendance_tracker' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )
              )}
            </button>

            {/* My Daily Hours & Clock-In Tab - Emerald green distinct accent */}
            <button
              id="tab-timecard"
              onClick={() => setCurrentTab('timecard')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 border cursor-pointer ${
                currentTab === 'timecard'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20 ring-2 ring-emerald-500/20'
                  : 'bg-white text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 border-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${currentTab === 'timecard' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                <Timer className="w-3.5 h-3.5" />
              </div>
              <span className="tracking-tight">Hours & Clock</span>
              {currentTab === 'timecard' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>

            {/* Coverage & Analytics Tab - Violet distinct accent */}
            <button
              id="tab-analytics"
              onClick={() => setCurrentTab('analytics')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 border cursor-pointer ${
                currentTab === 'analytics'
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-500/20 ring-2 ring-violet-500/20'
                  : 'bg-white text-slate-700 hover:text-violet-700 hover:bg-violet-50/60 border-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${currentTab === 'analytics' ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-700'}`}>
                <BarChart3 className="w-3.5 h-3.5" />
              </div>
              <span className="tracking-tight">Analytics</span>
              {currentTab === 'analytics' && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>
          </nav>

          {/* Quick Day of Week Switcher & Date Picker */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {daysList.map((d) => (
                <button
                  key={d.key}
                  id={`btn-day-${d.key}`}
                  onClick={() => setSelectedDay(d.key)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    selectedDay === d.key
                      ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-2xs">
              <input
                id="input-selected-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
                title="Select tracker date"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
