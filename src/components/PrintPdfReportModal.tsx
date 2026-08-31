import React, { useState, useMemo, useRef } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { Employee, DayOfWeek, AttendanceRecord } from '../types';
import { calculateShiftDurationHours, timeStringToMinutes } from '../data/teamData';
import { getDatesForWeek, isDateWithinRecord, getAllRosterConflictsForDate } from '../utils/conflictUtils';
import {
  X,
  Printer,
  FileText,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Palmtree,
  Clock,
  Download,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  Building,
  Globe,
  Users,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PrintPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'daily' | 'weekly';
}

const DAYS_OF_WEEK: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const PrintPdfReportModal: React.FC<PrintPdfReportModalProps> = ({
  isOpen,
  onClose,
  defaultView = 'daily',
}) => {
  const {
    employees,
    selectedDay: contextDay,
    selectedDate: contextDate,
    attendanceRecords,
    currentTime,
  } = useSchedule();

  const [reportType, setReportType] = useState<'daily' | 'weekly'>(defaultView);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(contextDay || 'Mon');
  const [selectedDate, setSelectedDate] = useState<string>(contextDate || '2026-08-31');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [includeCoverageChart, setIncludeCoverageChart] = useState<boolean>(true);
  const [includePTOSection, setIncludePTOSection] = useState<boolean>(true);
  const [includeExecutiveKPIs, setIncludeExecutiveKPIs] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [paperOrientation, setPaperOrientation] = useState<'landscape' | 'portrait'>('landscape');

  // Print container ref
  const reportRef = useRef<HTMLDivElement>(null);

  // Sync default view when opened
  React.useEffect(() => {
    if (isOpen) {
      setReportType(defaultView);
      if (contextDay) setSelectedDay(contextDay);
      if (contextDate) setSelectedDate(contextDate);
    }
  }, [isOpen, defaultView, contextDay, contextDate]);

  // Unique departments and countries
  const departments = useMemo(() => {
    return Array.from(new Set(employees.map((e) => e.department))).sort();
  }, [employees]);

  const countries = useMemo(() => {
    return Array.from(new Set(employees.map((e) => e.country))).sort();
  }, [employees]);

  // Calculate dates for the weekly report
  const weekDateMap = useMemo(() => {
    return getDatesForWeek(selectedDate);
  }, [selectedDate]);

  // Filtered employees based on selections
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (deptFilter !== 'all' && emp.department !== deptFilter) return false;
      if (countryFilter !== 'all' && emp.country !== countryFilter) return false;
      return true;
    });
  }, [employees, deptFilter, countryFilter]);

  // Daily Roster Calculations
  const dailyRosterData = useMemo(() => {
    let totalScheduledHours = 0;
    let onShiftCount = 0;
    let offCount = 0;
    let ptoCount = 0;
    let absenceCount = 0;

    const roster = filteredEmployees.map((emp) => {
      const shift = emp.schedule[selectedDay];
      const isOff = !shift || shift.isOff || shift.start.toLowerCase() === 'off';
      const durationHours = isOff ? 0 : calculateShiftDurationHours(shift.start, shift.end);

      // Check attendance records for this employee on selectedDate
      const matchingRecords = attendanceRecords.filter(
        (r) => r.employeeId === emp.id && isDateWithinRecord(selectedDate, r)
      );

      const ptoRecord = matchingRecords.find((r) => r.type === 'PTO' && r.status === 'Approved');
      const absenceRecord = matchingRecords.find((r) => r.type === 'Absence' || r.type === 'Sick Leave');
      const tardyRecord = matchingRecords.find((r) => r.type === 'Tardiness');

      let statusLabel = 'Off';
      let statusBadge = 'bg-slate-100 text-slate-600';
      let notes = '';

      if (ptoRecord) {
        statusLabel = 'Approved PTO';
        statusBadge = 'bg-amber-100 text-amber-800 border-amber-300';
        notes = ptoRecord.reason || 'Paid Time Off';
        ptoCount++;
      } else if (absenceRecord) {
        statusLabel = absenceRecord.type;
        statusBadge = 'bg-rose-100 text-rose-800 border-rose-300';
        notes = absenceRecord.reason || 'Unplanned Absence';
        absenceCount++;
      } else if (tardyRecord) {
        statusLabel = `Tardy (${tardyRecord.minutesLate || 15}m)`;
        statusBadge = 'bg-orange-100 text-orange-800 border-orange-300';
        notes = `Reported: ${tardyRecord.notes || 'Late arrival'}`;
        onShiftCount++;
        totalScheduledHours += durationHours;
      } else if (!isOff) {
        statusLabel = 'On Shift';
        statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
        onShiftCount++;
        totalScheduledHours += durationHours;
      } else {
        offCount++;
      }

      return {
        ...emp,
        shiftTime: isOff ? 'OFF' : `${shift.start} - ${shift.end}`,
        durationHours,
        isOff,
        statusLabel,
        statusBadge,
        notes,
        hasConflict: (ptoRecord || absenceRecord) && !isOff,
      };
    });

    return {
      roster,
      totalScheduledHours,
      onShiftCount,
      offCount,
      ptoCount,
      absenceCount,
      totalCount: filteredEmployees.length,
    };
  }, [filteredEmployees, selectedDay, selectedDate, attendanceRecords]);

  // Hourly coverage breakdown (00:00 to 23:00)
  const hourlyCoverage = useMemo(() => {
    const counts = new Array(24).fill(0);
    dailyRosterData.roster.forEach((emp) => {
      if (emp.isOff || emp.statusLabel === 'Approved PTO' || emp.statusLabel === 'Absence' || emp.statusLabel === 'Sick Leave') {
        return;
      }
      const shift = emp.schedule[selectedDay];
      if (!shift || shift.isOff) return;

      const startMins = timeStringToMinutes(shift.start);
      const endMins = timeStringToMinutes(shift.end);
      if (startMins === -1 || endMins === -1) return;

      for (let h = 0; h < 24; h++) {
        const checkMins = h * 60 + 30; // middle of the hour
        let isWorking = false;
        if (endMins > startMins) {
          isWorking = checkMins >= startMins && checkMins < endMins;
        } else {
          // Overnight
          isWorking = checkMins >= startMins || checkMins < endMins;
        }
        if (isWorking) counts[h]++;
      }
    });
    return counts;
  }, [dailyRosterData.roster, selectedDay]);

  const maxCoverage = Math.max(...hourlyCoverage, 1);

  // Daily Approved Leaves list
  const dailyLeaves = useMemo(() => {
    return attendanceRecords.filter((r) => isDateWithinRecord(selectedDate, r));
  }, [attendanceRecords, selectedDate]);

  // Weekly Matrix Totals & Calculations
  const weeklyRosterData = useMemo(() => {
    let grandTotalWeeklyHours = 0;
    const departmentHours: Record<string, number> = {};

    const roster = filteredEmployees.map((emp) => {
      let empWeeklyHours = 0;
      const dayShifts = DAYS_OF_WEEK.map((d) => {
        const shift = emp.schedule[d];
        const isOff = !shift || shift.isOff || shift.start.toLowerCase() === 'off';
        const dateForDay = weekDateMap[d];
        const hrs = isOff ? 0 : calculateShiftDurationHours(shift.start, shift.end);
        empWeeklyHours += hrs;

        // Check if on leave
        const matchingRecords = attendanceRecords.filter(
          (r) => r.employeeId === emp.id && isDateWithinRecord(dateForDay, r)
        );
        const pto = matchingRecords.find((r) => r.type === 'PTO' && r.status === 'Approved');
        const abs = matchingRecords.find((r) => r.type === 'Absence' || r.type === 'Sick Leave');

        return {
          day: d,
          date: dateForDay,
          label: isOff ? 'OFF' : `${shift.start}-${shift.end}`,
          hours: hrs,
          isOff,
          isPTO: !!pto,
          isAbsent: !!abs,
        };
      });

      grandTotalWeeklyHours += empWeeklyHours;
      departmentHours[emp.department] = (departmentHours[emp.department] || 0) + empWeeklyHours;

      return {
        ...emp,
        dayShifts,
        totalWeeklyHours: empWeeklyHours,
      };
    });

    return {
      roster,
      grandTotalWeeklyHours,
      avgHoursPerEmployee: roster.length > 0 ? (grandTotalWeeklyHours / roster.length).toFixed(1) : '0',
      departmentHours,
    };
  }, [filteredEmployees, weekDateMap, attendanceRecords]);

  // Weekly Leaves in the entire 7-day range
  const weeklyLeaves = useMemo(() => {
    const weekDates = DAYS_OF_WEEK.map((d) => weekDateMap[d]).filter(Boolean);
    return attendanceRecords.filter((r) => {
      return weekDates.some((d) => isDateWithinRecord(d, r));
    });
  }, [attendanceRecords, weekDateMap]);

  // Generate date range label for weekly view
  const weekDateRangeLabel = useMemo(() => {
    const mon = weekDateMap.Mon;
    const sun = weekDateMap.Sun;
    return `${mon} to ${sun}`;
  }, [weekDateMap]);

  // Trigger Browser Print Dialog
  const handlePrint = () => {
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Open Standalone Printable Document in New Window
  const handleOpenPrintWindow = () => {
    if (!reportRef.current) return;
    const printContent = reportRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=1100,height=850');
    if (!win) {
      alert('Popup blocker prevented opening print window. Please allow popups or use standard print.');
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Single Digits - ${reportType === 'daily' ? 'Daily Schedule Report' : 'Weekly Schedule Matrix'}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: ${paperOrientation};
            margin: 10mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 12px;
          }
          .no-print { display: none !important; }
          table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <div class="max-w-6xl mx-auto">
          <div class="mb-4 no-print flex items-center justify-between bg-slate-100 p-3 rounded-lg border border-slate-300">
            <span class="text-xs font-bold text-slate-700">Print Preview Window Ready</span>
            <button onclick="window.print()" class="px-4 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded shadow cursor-pointer">
              Print / Save PDF Now
            </button>
          </div>
          ${printContent}
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 500);
  };

  // Copy Executive Summary text
  const handleCopySummary = () => {
    let summaryText = '';
    if (reportType === 'daily') {
      summaryText = `📋 SINGLE DIGITS DAILY SCHEDULE & ROSTER REPORT
Date: ${selectedDate} (${selectedDay})
Department: ${deptFilter === 'all' ? 'All Departments' : deptFilter} | Country: ${countryFilter === 'all' ? 'All Locations' : countryFilter}
--------------------------------------------------
• Total Engineers: ${dailyRosterData.totalCount}
• On-Duty Scheduled: ${dailyRosterData.onShiftCount}
• Scheduled Off: ${dailyRosterData.offCount}
• Approved PTO: ${dailyRosterData.ptoCount}
• Absences / Sick: ${dailyRosterData.absenceCount}
• Total Scheduled Hours: ${dailyRosterData.totalScheduledHours} hrs
--------------------------------------------------
Generated at: ${new Date().toLocaleString()} (Single Digits Scheduling Portal)`;
    } else {
      summaryText = `📊 SINGLE DIGITS WEEKLY SCHEDULE MATRIX REPORT
Week Range: ${weekDateRangeLabel}
Department: ${deptFilter === 'all' ? 'All Departments' : deptFilter} | Country: ${countryFilter === 'all' ? 'All Locations' : countryFilter}
--------------------------------------------------
• Total Team Members: ${weeklyRosterData.roster.length}
• Total Weekly Hours: ${weeklyRosterData.grandTotalWeeklyHours} hrs
• Average Weekly Hours/Staff: ${weeklyRosterData.avgHoursPerEmployee} hrs
• Total Leave / PTO Events: ${weeklyLeaves.length}
--------------------------------------------------
Generated at: ${new Date().toLocaleString()} (Single Digits Scheduling Portal)`;
    }

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[94vh]">
        {/* Modal Top Header (Interactive Controls) */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Export Print-Friendly PDF Report</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  PDF / Print Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official single-view or weekly engineering schedule, coverage charts, and roster tables
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* View / Report Type Switcher */}
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Report View
              </label>
              <div className="flex rounded-lg bg-slate-200 p-0.5 border border-slate-300">
                <button
                  onClick={() => setReportType('daily')}
                  className={`flex-1 py-1.5 px-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    reportType === 'daily'
                      ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Daily Report</span>
                </button>
                <button
                  onClick={() => setReportType('weekly')}
                  className={`flex-1 py-1.5 px-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    reportType === 'weekly'
                      ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Weekly Matrix</span>
                </button>
              </div>
            </div>

            {/* Date & Day Selection */}
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                {reportType === 'daily' ? 'Report Date & Day' : 'Target Week Base Date'}
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-600 shadow-2xs"
                />
                {reportType === 'daily' && (
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
                    className="w-24 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-600 shadow-2xs"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Department Filter */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-600 shadow-2xs"
              >
                <option value="all">All Departments ({employees.length})</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Country Filter */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Country / Hub
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-600 shadow-2xs"
              >
                <option value="all">All Locations</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Layout Orientation */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Print Orientation
              </label>
              <select
                value={paperOrientation}
                onChange={(e) => setPaperOrientation(e.target.value as 'landscape' | 'portrait')}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-600 shadow-2xs"
              >
                <option value="landscape">Landscape (Recommended)</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>
          </div>

          {/* Additional Options Checkboxes */}
          <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-4 text-slate-700">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Sections to Include:
            </span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeExecutiveKPIs}
                onChange={(e) => setIncludeExecutiveKPIs(e.target.checked)}
                className="rounded-sm text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>Executive KPI Cards</span>
            </label>

            {reportType === 'daily' && (
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCoverageChart}
                  onChange={(e) => setIncludeCoverageChart(e.target.checked)}
                  className="rounded-sm text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span>24-Hour Coverage Breakdown Table</span>
              </label>
            )}

            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includePTOSection}
                onChange={(e) => setIncludePTOSection(e.target.checked)}
                className="rounded-sm text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>Approved PTO & Absence Log</span>
            </label>

            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={(e) => setIncludeSignatures(e.target.checked)}
                className="rounded-sm text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>Supervisor Approval Line</span>
            </label>
          </div>
        </div>

        {/* Scrollable Live Document Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/70">
          <div className="max-w-5xl mx-auto">
            {/* Paper Container */}
            <div
              id="printable-pdf-report"
              ref={reportRef}
              className="bg-white text-slate-900 rounded-xl shadow-lg border border-slate-300 p-8 sm:p-10 space-y-6 print:p-0 print:border-0 print:shadow-none"
            >
              {/* ========================================================================= */}
              {/* DOCUMENT HEADER BANNER                                                    */}
              {/* ========================================================================= */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-extrabold text-lg tracking-wider border border-slate-700 shrink-0">
                    SD
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                      SINGLE DIGITS, INC.
                    </h1>
                    <p className="text-xs font-bold text-indigo-700 tracking-wide uppercase">
                      {reportType === 'daily'
                        ? 'Global Engineering Daily Schedule & Coverage Report'
                        : 'Global Engineering Weekly Master Schedule Matrix'}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs text-slate-600 space-y-0.5 shrink-0">
                  <div className="font-bold text-slate-900">
                    {reportType === 'daily' ? (
                      <span>Date: <strong className="text-indigo-900">{selectedDate} ({selectedDay})</strong></span>
                    ) : (
                      <span>Week Range: <strong className="text-indigo-900">{weekDateRangeLabel}</strong></span>
                    )}
                  </div>
                  <div>Department Scope: <strong>{deptFilter === 'all' ? 'All Departments' : deptFilter}</strong></div>
                  <div>Location Scope: <strong>{countryFilter === 'all' ? 'All Hubs (USA, PH, IN, EG, KE)' : countryFilter}</strong></div>
                  <div className="text-[10px] text-slate-400">
                    Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* EXECUTIVE KPI SUMMARY CARDS                                               */}
              {/* ========================================================================= */}
              {includeExecutiveKPIs && (
                <div>
                  {reportType === 'daily' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Total Roster
                        </span>
                        <span className="text-xl font-black text-slate-900">
                          {dailyRosterData.totalCount}
                        </span>
                        <span className="text-[9px] text-slate-400 block">engineers</span>
                      </div>

                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                          On Shift Today
                        </span>
                        <span className="text-xl font-black text-emerald-900">
                          {dailyRosterData.onShiftCount}
                        </span>
                        <span className="text-[9px] text-emerald-700 block">scheduled active</span>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Scheduled Off
                        </span>
                        <span className="text-xl font-black text-slate-700">
                          {dailyRosterData.offCount}
                        </span>
                        <span className="text-[9px] text-slate-400 block">rest days</span>
                      </div>

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                          Approved PTO
                        </span>
                        <span className="text-xl font-black text-amber-900">
                          {dailyRosterData.ptoCount}
                        </span>
                        <span className="text-[9px] text-amber-700 block">vacation leaves</span>
                      </div>

                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-center">
                        <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
                          Total Hours
                        </span>
                        <span className="text-xl font-black text-indigo-900">
                          {dailyRosterData.totalScheduledHours}h
                        </span>
                        <span className="text-[9px] text-indigo-700 block">daily coverage capacity</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Total Engineers
                        </span>
                        <span className="text-xl font-black text-slate-900">
                          {weeklyRosterData.roster.length}
                        </span>
                        <span className="text-[9px] text-slate-400 block">in selected scope</span>
                      </div>

                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-center">
                        <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
                          Weekly Scheduled Hours
                        </span>
                        <span className="text-xl font-black text-indigo-900">
                          {weeklyRosterData.grandTotalWeeklyHours}h
                        </span>
                        <span className="text-[9px] text-indigo-700 block">cumulative capacity</span>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Avg Hours / Staff
                        </span>
                        <span className="text-xl font-black text-slate-900">
                          {weeklyRosterData.avgHoursPerEmployee}h
                        </span>
                        <span className="text-[9px] text-slate-400 block">scheduled per engineer</span>
                      </div>

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                          PTO / Leave Events
                        </span>
                        <span className="text-xl font-black text-amber-900">
                          {weeklyLeaves.length}
                        </span>
                        <span className="text-[9px] text-amber-700 block">recorded this week</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* 24-HOUR HOURLY COVERAGE HEATMAP & DENSITY TABLE (DAILY VIEW ONLY)          */}
              {/* ========================================================================= */}
              {reportType === 'daily' && includeCoverageChart && (
                <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>24-Hour Engineer Shift Coverage Distribution (00:00 - 23:00)</span>
                    </h3>
                    <span className="text-[10px] text-slate-500">
                      Peak on duty: <strong>{maxCoverage} engineers</strong>
                    </span>
                  </div>

                  {/* Hourly Matrix Bar */}
                  <div className="grid grid-cols-24 gap-0.5 border border-slate-200 rounded-lg bg-white p-1 shadow-2xs">
                    {hourlyCoverage.map((count, hour) => {
                      const pct = (count / maxCoverage) * 100;
                      return (
                        <div key={hour} className="flex flex-col items-center justify-end h-16 relative group">
                          {/* Bar */}
                          <div
                            className="w-full rounded-xs transition-all flex items-center justify-center text-[8px] font-bold"
                            style={{
                              height: `${Math.max(pct, 12)}%`,
                              backgroundColor: count > 0 ? (count >= maxCoverage * 0.7 ? '#4338ca' : '#6366f1') : '#e2e8f0',
                              color: count > 0 ? '#ffffff' : '#94a3b8',
                            }}
                          >
                            {count > 0 ? count : ''}
                          </div>
                          {/* Hour Label */}
                          <span className="text-[8px] font-mono text-slate-500 mt-1">
                            {hour.toString().padStart(2, '0')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* MAIN DATA TABLES: DAILY ROSTER OR WEEKLY MATRIX                            */}
              {/* ========================================================================= */}
              {reportType === 'daily' ? (
                /* DAILY ROSTER TABLE */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Employee Daily Roster & Shift Details ({dailyRosterData.roster.length} Staff)</span>
                    </h3>
                  </div>

                  <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-900 text-white font-bold border-b border-slate-700">
                          <th className="py-2 px-3">Emp ID</th>
                          <th className="py-2 px-3">Engineer Name</th>
                          <th className="py-2 px-3">Department</th>
                          <th className="py-2 px-3">Hub / Location</th>
                          <th className="py-2 px-3">Scheduled Shift</th>
                          <th className="py-2 px-3 text-center">Hours</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Supervisor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {dailyRosterData.roster.map((emp, idx) => (
                          <tr
                            key={emp.id}
                            className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}
                          >
                            <td className="py-2 px-3 font-mono text-slate-500 text-[10px]">{emp.id}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">
                              {emp.name}
                              {emp.hasConflict && (
                                <span className="ml-1 text-rose-600 font-normal text-[9px]">
                                  (Overlap Alert)
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-700 font-medium">{emp.department}</td>
                            <td className="py-2 px-3 text-slate-600">{emp.country}</td>
                            <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                              {emp.shiftTime}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-slate-900">
                              {emp.durationHours > 0 ? `${emp.durationHours}h` : '-'}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold border ${emp.statusBadge}`}
                              >
                                {emp.statusLabel}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 text-[10px]">{emp.supervisor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* WEEKLY MASTER MATRIX TABLE */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>7-Day Master Schedule Matrix ({weeklyRosterData.roster.length} Staff)</span>
                    </h3>
                  </div>

                  <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-slate-900 text-white font-bold border-b border-slate-700">
                          <th className="py-2 px-2.5">Name</th>
                          <th className="py-2 px-2">Dept</th>
                          <th className="py-2 px-2">Hub</th>
                          {DAYS_OF_WEEK.map((d) => (
                            <th key={d} className="py-2 px-1.5 text-center">
                              {d}
                              <span className="block text-[8px] font-normal text-slate-400">
                                {weekDateMap[d]?.substring(5) || ''}
                              </span>
                            </th>
                          ))}
                          <th className="py-2 px-2 text-center bg-indigo-950 text-indigo-200">Total Hrs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {weeklyRosterData.roster.map((emp, idx) => (
                          <tr
                            key={emp.id}
                            className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}
                          >
                            <td className="py-2 px-2.5 font-bold text-slate-900 whitespace-nowrap">
                              {emp.name}
                            </td>
                            <td className="py-2 px-2 text-slate-700 whitespace-nowrap">{emp.department}</td>
                            <td className="py-2 px-2 text-slate-600 whitespace-nowrap">{emp.country}</td>
                            {emp.dayShifts.map((shift) => (
                              <td
                                key={shift.day}
                                className={`py-2 px-1 text-center font-mono text-[9px] ${
                                  shift.isPTO
                                    ? 'bg-amber-100 text-amber-900 font-bold'
                                    : shift.isAbsent
                                    ? 'bg-rose-100 text-rose-900 font-bold'
                                    : shift.isOff
                                    ? 'bg-slate-100/70 text-slate-400'
                                    : 'text-slate-900 font-semibold'
                                }`}
                              >
                                {shift.isPTO ? 'PTO' : shift.isAbsent ? 'ABS' : shift.label}
                              </td>
                            ))}
                            <td className="py-2 px-2 text-center font-bold font-mono text-indigo-900 bg-indigo-50/50">
                              {emp.totalWeeklyHours}h
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* APPROVED PTO & ABSENCES LOG SECTION                                       */}
              {/* ========================================================================= */}
              {includePTOSection && (
                <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/70 space-y-2 page-break-inside-avoid">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Palmtree className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {reportType === 'daily'
                        ? `Approved Leaves & Attendance Exceptions for ${selectedDate}`
                        : `Weekly Approved Leaves & PTO Events (${weekDateRangeLabel})`}
                    </span>
                  </h3>

                  {(reportType === 'daily' ? dailyLeaves : weeklyLeaves).length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-1">
                      No PTO or absence exception records filed for this period.
                    </p>
                  ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-slate-200 text-slate-800 font-bold">
                            <th className="py-1.5 px-3">Employee</th>
                            <th className="py-1.5 px-3">Department</th>
                            <th className="py-1.5 px-3">Type</th>
                            <th className="py-1.5 px-3">Dates</th>
                            <th className="py-1.5 px-3">Reason / Justification</th>
                            <th className="py-1.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(reportType === 'daily' ? dailyLeaves : weeklyLeaves).map((rec) => (
                            <tr key={rec.id}>
                              <td className="py-1.5 px-3 font-bold text-slate-900">{rec.employeeName}</td>
                              <td className="py-1.5 px-3 text-slate-600">{rec.department}</td>
                              <td className="py-1.5 px-3">
                                <span className="font-semibold text-amber-800">{rec.type}</span>
                              </td>
                              <td className="py-1.5 px-3 font-mono text-[10px]">
                                {rec.date} {rec.endDate && rec.endDate !== rec.date ? `to ${rec.endDate}` : ''}
                              </td>
                              <td className="py-1.5 px-3 text-slate-700">{rec.reason}</td>
                              <td className="py-1.5 px-3 font-bold text-emerald-700">{rec.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* SIGNATURE & HR AUDIT COMPLIANCE FOOTER                                    */}
              {/* ========================================================================= */}
              {includeSignatures && (
                <div className="border-t border-slate-300 pt-6 mt-6 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-slate-600 page-break-inside-avoid">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-8">
                      Supervisor / Manager Sign-off:
                    </span>
                    <div className="border-b border-slate-400 w-full" />
                    <span className="text-[10px] text-slate-500 mt-1 block">Tom Hardy / Shift Supervisor</span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-8">
                      Workforce Ops Approval:
                    </span>
                    <div className="border-b border-slate-400 w-full" />
                    <span className="text-[10px] text-slate-500 mt-1 block">Engineering Resource Planning</span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 text-left sm:text-right">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Report Verification:
                    </span>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md font-bold text-[10px]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified Single Digits Schedule</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1">
                      Synced from Google Drive master roster
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Ready to print or save as vector PDF. Clean print styles remove all UI clutter automatically.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Copy Summary */}
            <button
              id="btn-copy-pdf-summary"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copied Summary!' : 'Copy Summary'}</span>
            </button>

            {/* Standalone Window Print */}
            <button
              id="btn-open-print-window"
              onClick={handleOpenPrintWindow}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              title="Open standalone print document in new tab"
            >
              <ExternalLink className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Open Standalone Tab</span>
            </button>

            {/* Print / Save PDF Main Button */}
            <button
              id="btn-trigger-pdf-print"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
