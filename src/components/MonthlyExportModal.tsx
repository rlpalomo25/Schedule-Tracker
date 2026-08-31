import React, { useState, useMemo } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { AttendanceRecord, AttendanceType } from '../types';
import {
  X,
  Calendar,
  Download,
  Copy,
  Check,
  Palmtree,
  AlertTriangle,
  Clock,
  Filter,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MonthlyExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMonth?: string; // Format: 'YYYY-MM'
}

export const MonthlyExportModal: React.FC<MonthlyExportModalProps> = ({
  isOpen,
  onClose,
  initialMonth,
}) => {
  const { attendanceRecords, employees } = useSchedule();

  // Current year & month default (e.g. 2026-08)
  const currentDefaultMonth = useMemo(() => {
    if (initialMonth) return initialMonth;
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  }, [initialMonth]);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentDefaultMonth);
  const [includePTO, setIncludePTO] = useState(true);
  const [includeAbsence, setIncludeAbsence] = useState(true);
  const [includeTardiness, setIncludeTardiness] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  // Extract unique departments
  const departments = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department))).sort();
  }, [employees]);

  // Extract available months from records or list a rolling 12-month window
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    
    // Add months from existing records
    attendanceRecords.forEach(r => {
      if (r.date && r.date.length >= 7) {
        monthSet.add(r.date.substring(0, 7));
      }
      if (r.endDate && r.endDate.length >= 7) {
        monthSet.add(r.endDate.substring(0, 7));
      }
    });

    // Add current, previous and future months
    const baseDate = new Date();
    for (let i = -6; i <= 6; i++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      const ym = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      monthSet.add(ym);
    }

    return Array.from(monthSet).sort().reverse();
  }, [attendanceRecords]);

  // Helper to format Month Name (e.g. "August 2026")
  const formatMonthLabel = (ym: string) => {
    const [year, month] = ym.split('-').map(Number);
    if (!year || !month) return ym;
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Filter records matching the selected month and criteria
  const monthlyRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      // Check month match (start date in month or end date in month)
      const recordMonth = record.date.substring(0, 7);
      const recordEndMonth = record.endDate ? record.endDate.substring(0, 7) : recordMonth;
      const isInMonth = recordMonth === selectedMonth || recordEndMonth === selectedMonth;
      if (!isInMonth) return false;

      // Type filter
      if (record.type === 'PTO' && !includePTO) return false;
      if ((record.type === 'Absence' || record.type === 'Sick Leave') && !includeAbsence) return false;
      if (record.type === 'Tardiness' && !includeTardiness) return false;

      // Department filter
      if (selectedDepartment !== 'all' && record.department !== selectedDepartment) return false;

      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [attendanceRecords, selectedMonth, includePTO, includeAbsence, includeTardiness, selectedDepartment]);

  // Aggregated monthly statistics
  const monthlyStats = useMemo(() => {
    const ptoRecords = monthlyRecords.filter(r => r.type === 'PTO');
    const absenceRecords = monthlyRecords.filter(r => r.type === 'Absence' || r.type === 'Sick Leave');
    const tardyRecords = monthlyRecords.filter(r => r.type === 'Tardiness');

    const uniqueEmployees = new Set(monthlyRecords.map(r => r.employeeId)).size;
    const totalTardyMinutes = tardyRecords.reduce((sum, r) => sum + (r.minutesLate || 0), 0);

    return {
      totalRecords: monthlyRecords.length,
      ptoCount: ptoRecords.length,
      absenceCount: absenceRecords.length,
      tardyCount: tardyRecords.length,
      uniqueEmployees,
      totalTardyMinutes,
    };
  }, [monthlyRecords]);

  // Generate CSV text
  const generateCSV = () => {
    const monthLabel = formatMonthLabel(selectedMonth);
    const headers = [
      'Report Month',
      'Employee ID',
      'Employee Name',
      'Department',
      'Event Type',
      'Start Date',
      'End Date',
      'Status',
      'Reason / Justification',
      'Minutes Late',
      'Supervisor Approved By',
      'Notes'
    ];

    const rows = monthlyRecords.map(r => {
      return [
        `"${monthLabel}"`,
        `"${r.employeeId}"`,
        `"${(r.employeeName || '').replace(/"/g, '""')}"`,
        `"${(r.department || '').replace(/"/g, '""')}"`,
        `"${r.type}"`,
        `"${r.date}"`,
        `"${r.endDate || r.date}"`,
        `"${r.status}"`,
        `"${(r.reason || '').replace(/"/g, '""')}"`,
        r.minutesLate ? r.minutesLate : 0,
        `"${(r.supervisorApprovedBy || '').replace(/"/g, '""')}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ];
    });

    return [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  };

  const handleDownloadCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + generateCSV();
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeMonthName = formatMonthLabel(selectedMonth).replace(/\s+/g, '_');
    link.setAttribute('download', `SingleDigits_PTO_and_Absences_${safeMonthName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
  };

  const handleCopyCSV = () => {
    navigator.clipboard.writeText(generateCSV());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Monthly PTO & Absence Exporter</h2>
              <p className="text-xs text-slate-400">Generate monthly audit sheets for payroll, scheduling & HR compliance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Controls Bar: Month Picker & Category Toggles */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Month Selection */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600 cursor-pointer shadow-2xs"
              >
                {availableMonths.map(ym => (
                  <option key={ym} value={ym}>
                    {formatMonthLabel(ym)} ({ym})
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="md:col-span-3 space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-indigo-600 cursor-pointer shadow-2xs"
              >
                <option value="all">All Departments</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Include Checkboxes */}
            <div className="md:col-span-5 space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Include in Report
              </label>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePTO}
                    onChange={(e) => setIncludePTO(e.target.checked)}
                    className="rounded-sm text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <span className="font-semibold text-amber-800 flex items-center gap-1">
                    <Palmtree className="w-3.5 h-3.5 text-amber-600" /> PTO
                  </span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAbsence}
                    onChange={(e) => setIncludeAbsence(e.target.checked)}
                    className="rounded-sm text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <span className="font-semibold text-rose-800 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Absences / Sick
                  </span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTardiness}
                    onChange={(e) => setIncludeTardiness(e.target.checked)}
                    className="rounded-sm text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <span className="font-semibold text-orange-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-orange-600" /> Tardiness
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Quick Stats Summary for Selected Month */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
              <div className="flex items-center justify-between text-amber-900 font-bold text-[11px]">
                <span>PTO Leaves</span>
                <Palmtree className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <p className="text-xl font-extrabold text-amber-900 mt-1">{monthlyStats.ptoCount}</p>
              <span className="text-[10px] text-amber-700">scheduled vacation events</span>
            </div>

            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl">
              <div className="flex items-center justify-between text-rose-900 font-bold text-[11px]">
                <span>Absences / Sick</span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <p className="text-xl font-extrabold text-rose-900 mt-1">{monthlyStats.absenceCount}</p>
              <span className="text-[10px] text-rose-700">unplanned exception events</span>
            </div>

            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl">
              <div className="flex items-center justify-between text-indigo-900 font-bold text-[11px]">
                <span>Engineers Affected</span>
                <Users className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <p className="text-xl font-extrabold text-indigo-900 mt-1">{monthlyStats.uniqueEmployees}</p>
              <span className="text-[10px] text-indigo-700">unique team members</span>
            </div>

            <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between text-slate-800 font-bold text-[11px]">
                <span>Total Month Records</span>
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
              </div>
              <p className="text-xl font-extrabold text-slate-900 mt-1">{monthlyStats.totalRecords}</p>
              <span className="text-[10px] text-slate-500">ready for export</span>
            </div>
          </div>

          {/* Records Preview Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>Month Preview: {formatMonthLabel(selectedMonth)}</span>
                <span className="text-slate-400 font-normal">({monthlyRecords.length} records)</span>
              </h3>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-200">
                    <th className="py-2.5 px-3 font-semibold">Employee</th>
                    <th className="py-2.5 px-3 font-semibold">Department</th>
                    <th className="py-2.5 px-3 font-semibold">Type</th>
                    <th className="py-2.5 px-3 font-semibold">Date(s)</th>
                    <th className="py-2.5 px-3 font-semibold">Reason</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Supervisor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <Calendar className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <p className="font-semibold text-xs">No records found for {formatMonthLabel(selectedMonth)}</p>
                        <p className="text-[11px] text-slate-400">Try selecting another month or adjust your checkboxes above</p>
                      </td>
                    </tr>
                  ) : (
                    monthlyRecords.map(record => (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-bold text-slate-900">{record.employeeName}</td>
                        <td className="py-2 px-3 text-slate-600">{record.department}</td>
                        <td className="py-2 px-3">
                          {record.type === 'PTO' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Palmtree className="w-3 h-3 text-amber-600" /> PTO
                            </span>
                          ) : record.type === 'Tardiness' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                              <Clock className="w-3 h-3 text-orange-600" /> Tardiness
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> {record.type}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono font-medium text-slate-700">
                          {record.date}
                          {record.endDate && record.endDate !== record.date && (
                            <span className="text-slate-400 text-[10px] block">to {record.endDate}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-700 max-w-xs truncate">{record.reason}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            record.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            record.status === 'Excused' ? 'bg-blue-100 text-blue-800' :
                            record.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">{record.supervisorApprovedBy || 'Tom Hardy'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Exporting <strong className="text-slate-800">{monthlyRecords.length} records</strong> for <strong className="text-slate-800">{formatMonthLabel(selectedMonth)}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCSV}
              disabled={monthlyRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copied CSV!' : 'Copy to Clipboard'}</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              disabled={monthlyRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download {formatMonthLabel(selectedMonth)} CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
