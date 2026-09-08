import React, { useState, useMemo } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { Employee, DayOfWeek } from '../types';
import {
  calculateShiftDurationHours,
  formatTimeDisplay,
  isWorkingAtHour,
} from '../data/teamData';
import { DayOfWeekNavigator } from './DayOfWeekNavigator';
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Clock,
  Palmtree,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Layers,
  Building,
  Globe,
  Grid,
  ListFilter,
  BarChart3,
  CalendarDays,
  Flame
} from 'lucide-react';

interface SupervisorCoverageViewProps {
  onSelectEmployee: (emp: Employee) => void;
  onEditShift?: (emp: Employee, day: DayOfWeek) => void;
}

export const SupervisorCoverageView: React.FC<SupervisorCoverageViewProps> = ({
  onSelectEmployee,
  onEditShift,
}) => {
  const {
    employees,
    selectedDay,
    selectedDate,
    attendanceRecords,
    currentTime,
  } = useSchedule();

  // Filters & layout state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupervisorFilter, setSelectedSupervisorFilter] = useState('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

  // Current hour decimal for live indicator
  const currentTotalMins = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentHourFloat = currentTotalMins / 60;
  const currentHourInt = currentTime.getHours();

  // All unique supervisors & departments
  const allSupervisors = useMemo(() => {
    const set = new Set(employees.map(e => e.supervisor || 'Unassigned'));
    return Array.from(set).sort();
  }, [employees]);

  const allDepartments = useMemo(() => {
    const set = new Set(employees.map(e => e.department));
    return Array.from(set).sort();
  }, [employees]);

  // Aggregate supervisor data
  const supervisorGroups = useMemo(() => {
    const groupsMap: Record<
      string,
      {
        supervisorName: string;
        managerName: string;
        departments: Set<string>;
        countries: Set<string>;
        members: {
          employee: Employee;
          shift: { start: string; end: string; isOff: boolean };
          hasPTO: boolean;
          hasAbsence: boolean;
          hasTardy: boolean;
          isWorkingNow: boolean;
          shiftDuration: number;
        }[];
      }
    > = {};

    employees.forEach(emp => {
      const sup = emp.supervisor || 'Unassigned';
      if (!groupsMap[sup]) {
        groupsMap[sup] = {
          supervisorName: sup,
          managerName: emp.manager || 'Operations Management',
          departments: new Set(),
          countries: new Set(),
          members: [],
        };
      }

      groupsMap[sup].departments.add(emp.department);
      groupsMap[sup].countries.add(emp.country);

      const shift = emp.schedule[selectedDay] || { start: 'Off', end: 'Off', isOff: true };

      const records = attendanceRecords.filter(r => {
        if (r.employeeId !== emp.id) return false;
        if (r.date === selectedDate) return true;
        if (r.endDate && r.date <= selectedDate && r.endDate >= selectedDate) return true;
        return false;
      });

      const hasPTO = records.some(r => r.type === 'PTO' && r.status === 'Approved');
      const hasAbsence = records.some(r => r.type === 'Absence' || r.type === 'Sick Leave');
      const hasTardy = records.some(r => r.type === 'Tardiness');
      const isOff = shift.isOff || shift.start === 'Off';
      const isWorkingNow = !isOff && !hasPTO && !hasAbsence && isWorkingAtHour(shift.start, shift.end, currentHourFloat);
      const shiftDuration = isOff ? 0 : calculateShiftDurationHours(shift.start, shift.end);

      groupsMap[sup].members.push({
        employee: emp,
        shift,
        hasPTO,
        hasAbsence,
        hasTardy,
        isWorkingNow,
        shiftDuration,
      });
    });

    return Object.values(groupsMap).map(group => {
      const totalEngineers = group.members.length;
      const onShiftMembers = group.members.filter(m => !m.shift.isOff && !m.hasPTO && !m.hasAbsence);
      const offMembers = group.members.filter(m => m.shift.isOff);
      const ptoMembers = group.members.filter(m => m.hasPTO);
      const absenceMembers = group.members.filter(m => m.hasAbsence);
      const activeNowMembers = group.members.filter(m => m.isWorkingNow);
      const onShiftCount = onShiftMembers.length;
      const coverageRate = totalEngineers > 0 ? Math.round((onShiftCount / totalEngineers) * 100) : 0;
      const totalShiftHours = onShiftMembers.reduce((acc, m) => acc + m.shiftDuration, 0);

      // Hourly coverage for this supervisor (0..23)
      const hourlyCoverage = new Array(24).fill(0);
      onShiftMembers.forEach(m => {
        for (let h = 0; h < 24; h++) {
          if (isWorkingAtHour(m.shift.start, m.shift.end, h + 0.5)) {
            hourlyCoverage[h]++;
          }
        }
      });

      const maxHourly = Math.max(...hourlyCoverage, 1);
      const gapHours: number[] = [];
      hourlyCoverage.forEach((count, h) => {
        if (count === 0) gapHours.push(h);
      });

      // Sort members: Active now first, then working today by start time, then off/PTO
      const sortedMembers = [...group.members].sort((a, b) => {
        if (a.isWorkingNow && !b.isWorkingNow) return -1;
        if (!a.isWorkingNow && b.isWorkingNow) return 1;
        if (!a.shift.isOff && b.shift.isOff) return -1;
        if (a.shift.isOff && !b.shift.isOff) return 1;
        return a.employee.name.localeCompare(b.employee.name);
      });

      return {
        ...group,
        totalEngineers,
        onShiftCount,
        offCount: offMembers.length,
        ptoCount: ptoMembers.length,
        absenceCount: absenceMembers.length,
        activeNowCount: activeNowMembers.length,
        coverageRate,
        totalShiftHours,
        hourlyCoverage,
        maxHourly,
        gapHours,
        sortedMembers,
      };
    }).sort((a, b) => b.totalEngineers - a.totalEngineers);
  }, [employees, selectedDay, selectedDate, attendanceRecords, currentHourFloat]);

  // Overall statistics across all supervisors
  const overallStats = useMemo(() => {
    let totalRoster = 0;
    let totalOnShift = 0;
    let totalActiveNow = 0;
    let totalPTO = 0;
    let totalOff = 0;
    let teamsWithGaps = 0;

    supervisorGroups.forEach(g => {
      totalRoster += g.totalEngineers;
      totalOnShift += g.onShiftCount;
      totalActiveNow += g.activeNowCount;
      totalPTO += g.ptoCount;
      totalOff += g.offCount;
      if (g.gapHours.length > 0) teamsWithGaps++;
    });

    const averageCoverageRate = totalRoster > 0 ? Math.round((totalOnShift / totalRoster) * 100) : 0;

    return {
      totalSupervisors: supervisorGroups.length,
      totalRoster,
      totalOnShift,
      totalActiveNow,
      totalPTO,
      totalOff,
      averageCoverageRate,
      teamsWithGaps,
    };
  }, [supervisorGroups]);

  // Filter supervisor groups based on user search and dropdowns
  const filteredSupervisorGroups = useMemo(() => {
    return supervisorGroups.filter(g => {
      if (selectedSupervisorFilter !== 'all' && g.supervisorName !== selectedSupervisorFilter) {
        return false;
      }

      if (selectedDeptFilter !== 'all' && !g.departments.has(selectedDeptFilter)) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchSupervisor = g.supervisorName.toLowerCase().includes(query);
        const matchManager = g.managerName.toLowerCase().includes(query);
        const matchMembers = g.sortedMembers.some(m =>
          m.employee.name.toLowerCase().includes(query) ||
          m.employee.email.toLowerCase().includes(query) ||
          m.employee.department.toLowerCase().includes(query)
        );
        if (!matchSupervisor && !matchManager && !matchMembers) return false;
      }

      return true;
    });
  }, [supervisorGroups, selectedSupervisorFilter, selectedDeptFilter, searchQuery]);

  const toggleExpandTeam = (supervisorName: string) => {
    setExpandedTeams(prev => ({
      ...prev,
      [supervisorName]: prev[supervisorName] === undefined ? false : !prev[supervisorName],
    }));
  };

  const expandAll = () => {
    const allExp: Record<string, boolean> = {};
    supervisorGroups.forEach(g => { allExp[g.supervisorName] = true; });
    setExpandedTeams(allExp);
  };

  const collapseAll = () => {
    const allCol: Record<string, boolean> = {};
    supervisorGroups.forEach(g => { allCol[g.supervisorName] = false; });
    setExpandedTeams(allCol);
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Day of Week Navigator */}
      <DayOfWeekNavigator />

      {/* Coverage Overview Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Supervisor Teams</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{overallStats.totalSupervisors}</span>
            <span className="text-xs text-slate-500 font-medium">supervisors</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Managing {overallStats.totalRoster} total engineers
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Scheduled On-Shift</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-700">{overallStats.totalOnShift}</span>
            <span className="text-xs text-slate-500 font-medium">({overallStats.averageCoverageRate}%)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {overallStats.totalOff} off, {overallStats.totalPTO} on PTO today
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Duty Right Now</span>
            <Flame className="w-4 h-4 text-emerald-600 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600">{overallStats.totalActiveNow}</span>
            <span className="text-xs text-emerald-700 font-semibold">working now</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across active shifts at {formatTimeDisplay(`${currentHourInt}:00`)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Coverage Gaps</span>
            <AlertTriangle className={`w-4 h-4 ${overallStats.teamsWithGaps > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold ${overallStats.teamsWithGaps > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {overallStats.teamsWithGaps}
            </span>
            <span className="text-xs text-slate-500 font-medium">teams w/ gaps</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {overallStats.teamsWithGaps > 0 ? 'Hours with zero team coverage' : 'Continuous 24h staffing'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Selected Day</span>
            <CalendarDays className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-teal-700">{selectedDay}</span>
            <span className="text-xs text-slate-600 font-semibold">{selectedDate}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Synced with portal calendar filter
          </p>
        </div>
      </div>

      {/* Control Bar: Search, Filters, View Mode & Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            <input
              id="input-search-supervisor-coverage"
              type="text"
              placeholder="Search by supervisor, engineer name, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
            />
          </div>

          {/* Supervisor filter dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              id="select-supervisor-filter"
              aria-label="Filter by supervisor"
              value={selectedSupervisorFilter}
              onChange={(e) => setSelectedSupervisorFilter(e.target.value)}
              className="px-3 py-2 min-h-[44px] sm:min-h-[38px] bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="all">All Supervisors ({allSupervisors.length})</option>
              {allSupervisors.map(sup => (
                <option key={sup} value={sup}>{sup}</option>
              ))}
            </select>

            {/* Department filter dropdown */}
            <select
              id="select-supervisor-dept-filter"
              aria-label="Filter by department"
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="px-3 py-2 min-h-[44px] sm:min-h-[38px] bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="all">All Departments ({allDepartments.length})</option>
              {allDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {/* View Mode Toggle: Cards vs 24h Matrix */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 min-h-[44px] sm:min-h-[38px]">
              <button
                id="btn-supervisor-view-cards"
                type="button"
                onClick={() => setViewMode('cards')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Detailed supervisor team cards with 24h staffing ribbons"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Team Cards</span>
              </button>
              <button
                id="btn-supervisor-view-matrix"
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="24-hour side-by-side supervisor staffing heatmap"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>24h Heatmap</span>
              </button>
            </div>

            {/* Expand / Collapse All (when in cards view) */}
            {viewMode === 'cards' && (
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Expand all teams roster details"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Collapse all teams roster details"
                >
                  Collapse All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(selectedSupervisorFilter !== 'all' || selectedDeptFilter !== 'all' || searchQuery.trim()) && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span className="font-semibold">Active filters:</span>
            {selectedSupervisorFilter !== 'all' && (
              <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-full font-medium">
                Supervisor: {selectedSupervisorFilter}
              </span>
            )}
            {selectedDeptFilter !== 'all' && (
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full font-medium">
                Dept: {selectedDeptFilter}
              </span>
            )}
            {searchQuery.trim() && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-full font-medium">
                "{searchQuery}"
              </span>
            )}
            <button
              onClick={() => {
                setSelectedSupervisorFilter('all');
                setSelectedDeptFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-teal-700 hover:underline font-bold ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: Detailed Supervisor Team Cards */}
      {viewMode === 'cards' && (
        <div className="space-y-5">
          {filteredSupervisorGroups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No supervisor teams match your filters</h3>
              <p className="text-xs text-slate-500 mt-1">Try clearing your search query or selecting "All Supervisors".</p>
            </div>
          ) : (
            filteredSupervisorGroups.map(group => {
              const isExpanded = expandedTeams[group.supervisorName] !== false; // default true

              return (
                <div
                  key={group.supervisorName}
                  id={`supervisor-card-${group.supervisorName.toLowerCase().replace(/\s+/g, '-')}`}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                >
                  {/* Card Header: Supervisor Name, Manager, Team Badges, Coverage Rate & 24h Ribbon */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 bg-linear-to-r from-slate-50/70 to-white">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Supervisor Info */}
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                          {group.supervisorName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">
                              {group.supervisorName}
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              Manager: {group.managerName}
                            </span>
                            {group.gapHours.length === 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                24h Continuous
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200" title={`Coverage gap between: ${group.gapHours.map(h => `${h}:00`).join(', ')}`}>
                                <AlertTriangle className="w-3 h-3" />
                                {group.gapHours.length}h Unstaffed
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                            <span>
                              <strong className="text-slate-800">{group.totalEngineers}</strong> engineers in team
                            </span>
                            <span>•</span>
                            <span>
                              Depts: <strong className="text-slate-700">{Array.from(group.departments).join(', ')}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Countries: <strong className="text-slate-700">{Array.from(group.countries).join(', ')}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Coverage Badges & Accordion Toggle */}
                      <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                        {/* On Shift Badge */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-bold text-indigo-800">{group.onShiftCount}</span>
                          <span className="text-indigo-600 text-[11px]">on shift</span>
                        </div>

                        {/* Active Now Badge */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-bold text-emerald-800">{group.activeNowCount}</span>
                          <span className="text-emerald-700 text-[11px]">active now</span>
                        </div>

                        {/* Scheduled Off Badge */}
                        {group.offCount > 0 && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs">
                            <span className="font-bold text-slate-700">{group.offCount}</span>
                            <span className="text-slate-500 text-[11px]">off</span>
                          </div>
                        )}

                        {/* PTO Badge */}
                        {group.ptoCount > 0 && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs">
                            <Palmtree className="w-3.5 h-3.5 text-amber-600" />
                            <span className="font-bold text-amber-800">{group.ptoCount}</span>
                            <span className="text-amber-700 text-[11px]">PTO</span>
                          </div>
                        )}

                        {/* Coverage % Meter */}
                        <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center gap-2">
                          <span className="text-slate-500 font-medium">Coverage:</span>
                          <span className={`font-black ${group.coverageRate >= 75 ? 'text-teal-700' : group.coverageRate >= 50 ? 'text-blue-700' : 'text-amber-700'}`}>
                            {group.coverageRate}%
                          </span>
                        </div>

                        {/* Accordion Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleExpandTeam(group.supervisorName)}
                          className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          aria-label={isExpanded ? `Collapse ${group.supervisorName} roster` : `Expand ${group.supervisorName} roster`}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* 24-Hour Coverage Heatmap Ribbon */}
                    <div className="mt-4 pt-3 border-t border-slate-200/80">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-teal-600" />
                          <span>24h Staffing Coverage Distribution</span>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {group.totalShiftHours} total scheduled hours today • Peak: {group.maxHourly} on duty
                        </span>
                      </div>

                      {/* 24 Columns (00:00 to 23:00) */}
                      <div className="grid grid-cols-24 gap-0.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                        {group.hourlyCoverage.map((count, h) => {
                          const isCurrentHour = h === currentHourInt;
                          let bgClass = 'bg-slate-200 text-slate-400';
                          if (count === 0) bgClass = 'bg-rose-100 text-rose-500 font-bold';
                          else if (count === 1) bgClass = 'bg-teal-100 text-teal-800 font-semibold';
                          else if (count === 2) bgClass = 'bg-teal-300 text-teal-950 font-bold';
                          else bgClass = 'bg-teal-600 text-white font-black';

                          return (
                            <div
                              key={h}
                              className={`relative flex flex-col items-center justify-center py-1.5 rounded-sm text-[9px] transition-all group ${bgClass} ${
                                isCurrentHour ? 'ring-2 ring-emerald-500 ring-offset-1 z-10' : ''
                              }`}
                              title={`${h}:00 - ${h + 1}:00: ${count} engineer(s) on shift ${isCurrentHour ? '(Current Hour)' : ''}`}
                            >
                              <span>{count}</span>
                              <span className="text-[7px] opacity-70 group-hover:opacity-100">{h}h</span>
                              {isCurrentHour && (
                                <span className="absolute -top-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-slate-600 mt-1 px-1 font-medium">
                        <span>12am (00:00)</span>
                        <span>06:00</span>
                        <span>12pm (Noon)</span>
                        <span>18:00</span>
                        <span>11pm (23:00)</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded: Team Members Roster */}
                  {isExpanded && (
                    <div className="divide-y divide-slate-100">
                      <div className="bg-slate-50/90 px-4 py-2 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <span className="w-64">Team Member</span>
                        <span className="w-36 text-center">Scheduled Shift</span>
                        <span className="w-28 text-center">Status</span>
                        <span className="w-32 hidden md:block">Department</span>
                        <span className="w-24 hidden lg:block text-right">Location</span>
                      </div>

                      {group.sortedMembers.map(({ employee, shift, hasPTO, hasAbsence, isWorkingNow, shiftDuration }) => {
                        const isOff = shift.isOff || shift.start === 'Off';

                        return (
                          <div
                            key={employee.id}
                            className="px-4 py-3 flex items-center justify-between text-xs hover:bg-slate-50/80 transition-colors"
                          >
                            {/* Member info with button to view details */}
                            <button
                              onClick={() => onSelectEmployee(employee)}
                              className="flex items-center gap-2.5 text-left w-64 hover:text-teal-700 transition-colors cursor-pointer group"
                              title={`View profile and schedule history for ${employee.name}`}
                            >
                              <div className={`w-8 h-8 rounded-full ${employee.avatarColor || 'bg-teal-600'} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                                {employee.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="truncate">
                                <div className="font-bold text-slate-900 group-hover:text-teal-700 truncate">
                                  {employee.name}
                                </div>
                                <div className="text-[11px] text-slate-600 truncate">
                                  {employee.email}
                                </div>
                              </div>
                            </button>

                            {/* Scheduled Shift */}
                            <div className="w-36 text-center">
                              {isOff ? (
                                <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200">
                                  Scheduled Off
                                </span>
                              ) : (
                                <div className="inline-flex flex-col items-center">
                                  <span className="font-mono font-bold text-slate-900 text-xs">
                                    {formatTimeDisplay(shift.start)} - {formatTimeDisplay(shift.end)}
                                  </span>
                                  <span className="text-[10px] text-slate-600 font-medium">
                                    {shiftDuration} hours
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Live Status Badge */}
                            <div className="w-28 flex justify-center">
                              {hasPTO ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300">
                                  <Palmtree className="w-3 h-3" />
                                  Approved PTO
                                </span>
                              ) : hasAbsence ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300">
                                  <AlertTriangle className="w-3 h-3" />
                                  Absence / Sick
                                </span>
                              ) : isWorkingNow ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Active Duty
                                </span>
                              ) : !isOff ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200">
                                  <Clock className="w-3 h-3" />
                                  Upcoming
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-600 font-medium">
                                  Rest Day
                                </span>
                              )}
                            </div>

                            {/* Department */}
                            <div className="w-32 hidden md:block text-slate-600 truncate">
                              {employee.department}
                            </div>

                            {/* Location */}
                            <div className="w-24 hidden lg:block text-right text-slate-500 font-medium">
                              {employee.country}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW MODE 2: 24-Hour Supervisor Comparison Heatmap Matrix */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                <span>24-Hour Side-by-Side Supervisor Staffing Heatmap</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison of staffed engineers per hour across all supervisor teams for {selectedDay} ({selectedDate}).
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-rose-100 border border-rose-300 inline-block" />
                <span>0 Gap</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-teal-100 border border-teal-300 inline-block" />
                <span>1 Staffed</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-teal-400 inline-block" />
                <span>2 Staffed</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-xs bg-teal-700 inline-block" />
                <span>3+ Staffed</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-xs">
              <thead>
                <tr className="bg-slate-900 text-slate-200 border-b border-slate-800">
                  <th className="py-3 px-4 text-left font-bold w-64 sticky left-0 z-20 bg-slate-900 shadow-[2px_0_6px_-1px_rgba(0,0,0,0.3)]">
                    Supervisor & Team
                  </th>
                  <th className="py-3 px-2 text-center font-bold w-20">On Duty</th>
                  {Array.from({ length: 24 }).map((_, h) => (
                    <th
                      key={h}
                      className={`py-3 px-1 text-center font-mono text-[11px] ${
                        h === currentHourInt ? 'bg-emerald-800 text-white font-bold' : ''
                      }`}
                    >
                      {h}h
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center font-bold w-24">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSupervisorGroups.map(group => (
                  <tr key={group.supervisorName} className="hover:bg-slate-50 transition-colors">
                    {/* Supervisor name column (sticky) */}
                    <td className="py-3 px-4 sticky left-0 z-10 bg-white group-hover:bg-slate-50 font-semibold text-slate-900 border-r border-slate-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {group.supervisorName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{group.supervisorName}</div>
                          <div className="text-[10px] text-slate-500">{group.totalEngineers} engineers</div>
                        </div>
                      </div>
                    </td>

                    {/* On-shift summary count */}
                    <td className="py-3 px-2 text-center font-bold text-slate-800">
                      {group.onShiftCount}/{group.totalEngineers}
                    </td>

                    {/* 24-hour cells */}
                    {group.hourlyCoverage.map((count, h) => {
                      const isCurrent = h === currentHourInt;
                      let cellClass = 'bg-slate-50 text-slate-400';
                      if (count === 0) cellClass = 'bg-rose-50 text-rose-600 font-bold';
                      else if (count === 1) cellClass = 'bg-teal-50 text-teal-800 font-semibold';
                      else if (count === 2) cellClass = 'bg-teal-200 text-teal-950 font-bold';
                      else cellClass = 'bg-teal-600 text-white font-black';

                      return (
                        <td
                          key={h}
                          className={`py-3 px-1 text-center font-mono text-[11px] border-r border-slate-100 transition-colors ${cellClass} ${
                            isCurrent ? 'ring-2 ring-emerald-500 z-1' : ''
                          }`}
                          title={`${group.supervisorName} at ${h}:00 - ${h + 1}:00: ${count} engineer(s)`}
                        >
                          {count}
                        </td>
                      );
                    })}

                    {/* Overall Coverage % */}
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        group.coverageRate >= 75
                          ? 'bg-teal-100 text-teal-800'
                          : group.coverageRate >= 50
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {group.coverageRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
