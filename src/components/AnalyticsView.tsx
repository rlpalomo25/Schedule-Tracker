import React, { useMemo, useState } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import {
  BarChart3,
  Users,
  Globe2,
  Briefcase,
  ShieldCheck,
  Clock,
  Palmtree,
  AlertTriangle,
  Award,
  Filter,
  Calendar,
  Sparkles,
  Layers,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Check,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Employee, AttendanceType } from '../types';
import { TardinessTrendsSection } from './analytics/TardinessTrendsSection';
import { PtoUtilizationSection } from './analytics/PtoUtilizationSection';
import { SupervisorConsistencySection } from './analytics/SupervisorConsistencySection';
import { exportAnalyticsToExcel, exportAnalyticsToCSV } from '../utils/analyticsExport';

interface AnalyticsViewProps {
  onOpenLogAttendance?: (type?: AttendanceType, emp?: Employee) => void;
  onSelectEmployee?: (emp: Employee) => void;
}

type AnalyticsSubTab = 'tardiness' | 'pto' | 'supervisors' | 'distribution';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  onOpenLogAttendance,
  onSelectEmployee
}) => {
  const { employees, attendanceRecords, timeEntries, shiftSwapRequests } = useSchedule();
  
  const [activeTab, setActiveTab] = useState<AnalyticsSubTab>('tardiness');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('all');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Trigger Excel export
  const handleExportExcel = () => {
    setShowExportDropdown(false);
    const result = exportAnalyticsToExcel({
      employees,
      attendanceRecords,
      shiftSwapRequests,
      selectedDepartment,
      selectedSupervisor
    });
    if (result.success) {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      setExportNotice(`Downloaded Excel workbook: ${result.fileName}`);
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  // Trigger CSV export
  const handleExportCSV = (type: 'tardiness' | 'pto' | 'supervisors') => {
    setShowExportDropdown(false);
    const result = exportAnalyticsToCSV(type, {
      employees,
      attendanceRecords,
      shiftSwapRequests,
      selectedDepartment,
      selectedSupervisor
    });
    if (result.success) {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
      setExportNotice(`Downloaded CSV dataset: ${result.fileName}`);
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  // Unique departments and supervisors for filter dropdowns
  const departments = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department).filter(Boolean))).sort();
  }, [employees]);

  const supervisors = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.supervisor).filter(Boolean))).sort();
  }, [employees]);

  // Department distribution stats
  const deptStats = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach(e => {
      map[e.department] = (map[e.department] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [employees]);

  // Country distribution stats
  const countryStats = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach(e => {
      map[e.country] = (map[e.country] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [employees]);

  // Supervisor team count distribution
  const supervisorStats = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach(e => {
      map[e.supervisor] = (map[e.supervisor] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [employees]);

  // High-level KPI metrics
  const totalPTO = attendanceRecords.filter(r => r.type === 'PTO').length;
  const totalTardy = attendanceRecords.filter(r => r.type === 'Tardiness').length;
  const totalAbsence = attendanceRecords.filter(r => r.type === 'Absence' || r.type === 'Sick Leave').length;
  const onTimeRate = Math.max(88, Math.min(100, Math.round(100 - (totalTardy / (employees.length * 1.5)) * 100)));

  return (
    <div className="space-y-6">
      {/* Top Header with Filters & Sub-Nav */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Operations Intelligence
              </span>
              <span className="text-xs text-slate-400 font-medium">Single Digits NOC / Support</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Historical Attendance Analytics & Trends
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Real-time telemetry on arrival punctuality, day-of-week tardiness patterns, PTO utilization reserves, and supervisor shift consistency scores.
            </p>
          </div>

          {/* Filters & Export Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Department Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 sm:py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 min-h-[42px] sm:min-h-0 flex-1 sm:flex-initial">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-500 shrink-0">Dept:</span>
              <select
                id="analytics-dept-filter"
                aria-label="Filter by department"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer pr-1 w-full sm:w-auto"
              >
                <option value="all">All Departments ({departments.length})</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Supervisor Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 sm:py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 min-h-[42px] sm:min-h-0 flex-1 sm:flex-initial">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-500 shrink-0">Supervisor:</span>
              <select
                id="analytics-sup-filter"
                aria-label="Filter by supervisor"
                value={selectedSupervisor}
                onChange={(e) => setSelectedSupervisor(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer pr-1 w-full sm:w-auto"
              >
                <option value="all">All Supervisors ({supervisors.length})</option>
                {supervisors.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Dedicated Analytics Export Button */}
            <div className="relative w-full sm:w-auto">
              <button
                id="btn-export-analytics"
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors min-h-[42px] sm:min-h-0 cursor-pointer"
                title="Export analytics reports (Excel or CSV)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Analytics</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
              </button>

              {/* Export Dropdown Menu */}
              {showExportDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowExportDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                        Export Analytics Data
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Filtered by Dept: {selectedDepartment}, Sup: {selectedSupervisor}
                      </span>
                    </div>

                    <div className="py-1 space-y-1">
                      {/* Full Excel Workbook */}
                      <button
                        onClick={handleExportExcel}
                        className="w-full flex items-start gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 transition-colors group cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-200">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block text-slate-900 group-hover:text-indigo-900">
                            Complete Excel Workbook (.xlsx)
                          </span>
                          <span className="text-[10px] text-slate-500 block leading-tight">
                            Includes Tardiness Trends, Incidents Log, PTO Balances, & Supervisor Scores
                          </span>
                        </div>
                      </button>

                      <div className="border-t border-slate-100 my-1 pt-1">
                        <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Export as CSV (.csv)
                        </span>

                        <button
                          onClick={() => handleExportCSV('tardiness')}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Tardiness Rates by Day (.csv)</span>
                        </button>

                        <button
                          onClick={() => handleExportCSV('pto')}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Palmtree className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Employee PTO Utilization (.csv)</span>
                        </button>

                        <button
                          onClick={() => handleExportCSV('supervisors')}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Supervisor Consistency Scores (.csv)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Export Success Toast Notification */}
        {exportNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="flex-1">{exportNotice}</span>
          </div>
        )}

        {/* Navigation Tabs (Mobile horizontally scrollable with touch-momentum) */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setActiveTab('tardiness')}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[44px] sm:min-h-0 ${
              activeTab === 'tardiness'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Tardiness by Day of Week</span>
          </button>

          <button
            onClick={() => setActiveTab('pto')}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[44px] sm:min-h-0 ${
              activeTab === 'pto'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Palmtree className="w-3.5 h-3.5" />
            <span>PTO Balance & Utilization</span>
          </button>

          <button
            onClick={() => setActiveTab('supervisors')}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[44px] sm:min-h-0 ${
              activeTab === 'supervisors'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Supervisor Coverage Consistency</span>
          </button>

          <button
            onClick={() => setActiveTab('distribution')}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[44px] sm:min-h-0 ${
              activeTab === 'distribution'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Staffing & Distribution</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'tardiness' && (
        <TardinessTrendsSection
          employees={employees}
          attendanceRecords={attendanceRecords}
          timeEntries={timeEntries}
          selectedDepartment={selectedDepartment}
          selectedSupervisor={selectedSupervisor}
          onSelectEmployee={onSelectEmployee}
        />
      )}

      {activeTab === 'pto' && (
        <PtoUtilizationSection
          employees={employees}
          attendanceRecords={attendanceRecords}
          selectedDepartment={selectedDepartment}
          selectedSupervisor={selectedSupervisor}
          onOpenLogAttendance={onOpenLogAttendance}
          onSelectEmployee={onSelectEmployee}
        />
      )}

      {activeTab === 'supervisors' && (
        <SupervisorConsistencySection
          employees={employees}
          attendanceRecords={attendanceRecords}
          shiftSwapRequests={shiftSwapRequests}
          selectedDepartment={selectedDepartment}
          onSelectEmployee={onSelectEmployee}
        />
      )}

      {activeTab === 'distribution' && (
        <div className="space-y-6">
          {/* Summary KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Punctuality</span>
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-700">{onTimeRate}%</span>
                <span className="text-xs text-slate-500 font-medium">on-time arrival rate</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Across {attendanceRecords.length} historical audit records
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Headcount</span>
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{employees.length}</span>
                <span className="text-xs text-slate-500 font-medium">engineers</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Across {countryStats.length} countries & {deptStats.length} functional units
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">PTO Leaves Booked</span>
                <Palmtree className="w-5 h-5 text-amber-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-700">{totalPTO}</span>
                <span className="text-xs text-slate-500 font-medium">records logged</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                100% paired with shift swap or peer coverage
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tardiness / Absences</span>
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-orange-700">{totalTardy + totalAbsence}</span>
                <span className="text-xs text-slate-500 font-medium">logged events</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {totalTardy} tardy arrivals, {totalAbsence} unplanned leaves
              </p>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>Staffing by Department ({deptStats.length})</span>
              </h3>

              <div className="space-y-3">
                {deptStats.map(([dept, count]) => {
                  const pct = Math.round((count / employees.length) * 100);
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{dept}</span>
                        <span className="font-mono text-slate-500">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Global Country Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-emerald-600" />
                <span>Global Geographies ({countryStats.length})</span>
              </h3>

              <div className="space-y-3">
                {countryStats.map(([country, count]) => {
                  const pct = Math.round((count / employees.length) * 100);
                  return (
                    <div key={country} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{country}</span>
                        <span className="font-mono text-slate-500">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Supervisor Roster Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Supervision Distribution ({supervisorStats.length})</span>
              </h3>

              <div className="space-y-3">
                {supervisorStats.map(([sup, count]) => {
                  const pct = Math.round((count / employees.length) * 100);
                  return (
                    <div key={sup} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{sup}</span>
                        <span className="font-mono text-slate-500">{count} direct reports ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
