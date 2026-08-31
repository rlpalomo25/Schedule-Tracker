import React, { useState, useMemo } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { useAuth } from '../context/AuthContext';
import { AttendanceRecord, AttendanceType, AttendanceStatus, Employee } from '../types';
import {
  ShieldCheck,
  PlusCircle,
  Clock,
  Palmtree,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Trash2,
  Filter,
  Search,
  Calendar,
  Sparkles,
  ArrowUpDown,
  Download,
  CalendarRange
} from 'lucide-react';
import { MonthlyExportModal } from './MonthlyExportModal';

interface AttendanceTrackerProps {
  onOpenLogModal: (defaultType?: AttendanceType) => void;
  onSelectEmployee: (emp: Employee) => void;
}

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  onOpenLogModal,
  onSelectEmployee,
}) => {
  const {
    attendanceRecords,
    updateAttendanceStatus,
    deleteAttendanceRecord,
    employees,
  } = useSchedule();
  const { isManagerOrSupervisor, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'PTO' | 'Tardiness' | 'Absence' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [isMonthlyExportOpen, setIsMonthlyExportOpen] = useState(false);

  const departments = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.department))).sort();
  }, [employees]);

  // Extract unique available months from records
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    attendanceRecords.forEach(r => {
      if (r.date && r.date.length >= 7) monthSet.add(r.date.substring(0, 7));
      if (r.endDate && r.endDate.length >= 7) monthSet.add(r.endDate.substring(0, 7));
    });
    // Add current month if empty
    const now = new Date();
    const curYm = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    monthSet.add(curYm);
    return Array.from(monthSet).sort().reverse();
  }, [attendanceRecords]);

  const formatMonthLabel = (ym: string) => {
    const [year, month] = ym.split('-').map(Number);
    if (!year || !month) return ym;
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Aggregate stats
  const stats = useMemo(() => {
    const ptoCount = attendanceRecords.filter(r => r.type === 'PTO').length;
    const tardyCount = attendanceRecords.filter(r => r.type === 'Tardiness').length;
    const absenceCount = attendanceRecords.filter(r => r.type === 'Absence' || r.type === 'Sick Leave').length;
    const pendingCount = attendanceRecords.filter(r => r.status === 'Pending').length;

    const totalTardyMinutes = attendanceRecords
      .filter(r => r.type === 'Tardiness' && r.minutesLate)
      .reduce((sum, r) => sum + (r.minutesLate || 0), 0);

    return {
      total: attendanceRecords.length,
      ptoCount,
      tardyCount,
      absenceCount,
      pendingCount,
      totalTardyMinutes,
    };
  }, [attendanceRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      // Tab filter
      if (activeTab === 'PTO' && record.type !== 'PTO') return false;
      if (activeTab === 'Tardiness' && record.type !== 'Tardiness') return false;
      if (activeTab === 'Absence' && record.type !== 'Absence' && record.type !== 'Sick Leave') return false;
      if (activeTab === 'pending' && record.status !== 'Pending') return false;

      // Status filter
      if (filterStatus !== 'all' && record.status !== filterStatus) return false;

      // Department filter
      if (filterDepartment !== 'all' && record.department !== filterDepartment) return false;

      // Month filter
      if (filterMonth !== 'all') {
        const startMonth = record.date.substring(0, 7);
        const endMonth = record.endDate ? record.endDate.substring(0, 7) : startMonth;
        if (startMonth !== filterMonth && endMonth !== filterMonth) return false;
      }

      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const matchName = record.employeeName.toLowerCase().includes(q);
        const matchReason = record.reason.toLowerCase().includes(q);
        const matchDept = record.department.toLowerCase().includes(q);
        if (!matchName && !matchReason && !matchDept) return false;
      }

      return true;
    });
  }, [attendanceRecords, activeTab, filterStatus, filterDepartment, filterMonth, search]);

  // Export CSV report for attendance
  const handleExportCSV = () => {
    const headers = ['Record ID', 'Employee Name', 'Department', 'Type', 'Date', 'End Date', 'Status', 'Minutes Late', 'Scheduled', 'Actual', 'Reason', 'Supervisor Signature', 'Notes'];
    const rows = filteredRecords.map(r => [
      r.id,
      r.employeeName,
      r.department,
      r.type,
      r.date,
      r.endDate || '',
      r.status,
      r.minutesLate || 0,
      r.scheduledTime || '',
      r.actualTime || '',
      `"${(r.reason || '').replace(/"/g, '""')}"`,
      r.supervisorApprovedBy || '',
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_PTO_Tardiness_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action Buttons */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">PTO, Absences & Tardiness Command Center</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Audit & Compliance Tracker
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track planned vacations (PTO), unplanned sick leaves, tardiness minutes, and excuse authorizations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export by Month Action */}
          <button
            onClick={() => setIsMonthlyExportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
            title="Export PTO and absences by specific month"
          >
            <CalendarRange className="w-4 h-4" />
            <span>Export by Month</span>
          </button>

          <button
            onClick={() => onOpenLogModal('PTO')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors shadow-2xs cursor-pointer"
          >
            <Palmtree className="w-4 h-4 text-amber-600" />
            <span>Request / Log PTO</span>
          </button>

          <button
            onClick={() => onOpenLogModal('Tardiness')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors shadow-2xs cursor-pointer"
          >
            <Clock className="w-4 h-4 text-orange-600" />
            <span>Record Tardiness</span>
          </button>

          <button
            onClick={() => onOpenLogModal('Absence')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Log Absence / Sick</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            title="Download CSV report for current active view"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Table</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Approved PTO */}
        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">PTO Requests</span>
            <Palmtree className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-800">{stats.ptoCount}</span>
            <span className="text-xs text-amber-700">scheduled leaves</span>
          </div>
        </div>

        {/* Tardiness Logged */}
        <div className="bg-orange-50/60 p-4 rounded-xl border border-orange-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-900">Tardiness Incidents</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-orange-800">{stats.tardyCount}</span>
            <span className="text-xs text-orange-700">({stats.totalTardyMinutes} min total)</span>
          </div>
        </div>

        {/* Absences */}
        <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900">Absences & Sick</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-800">{stats.absenceCount}</span>
            <span className="text-xs text-rose-700">unplanned days</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900">Pending Review</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-800">{stats.pendingCount}</span>
            <span className="text-xs text-indigo-700">requires manager action</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records ({attendanceRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('PTO')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'PTO'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Palmtree className="w-3.5 h-3.5" />
              <span>PTO ({stats.ptoCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('Tardiness')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'Tardiness'
                  ? 'bg-white text-orange-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Tardiness ({stats.tardyCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('Absence')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'Absence'
                  ? 'bg-white text-rose-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Absences ({stats.absenceCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                activeTab === 'pending'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pending Review ({stats.pendingCount})</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:bg-white focus:border-indigo-500"
              />
            </div>

            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Dates / Months</option>
              {availableMonths.map(ym => (
                <option key={ym} value={ym}>
                  {formatMonthLabel(ym)}
                </option>
              ))}
            </select>

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Recorded">Recorded</option>
              <option value="Excused">Excused</option>
              <option value="Unexcused">Unexcused</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-slate-200 border-b border-slate-800">
              <th className="py-3 px-4 font-semibold">Employee</th>
              <th className="py-3 px-3 font-semibold">Type</th>
              <th className="py-3 px-3 font-semibold">Date / Duration</th>
              <th className="py-3 px-3 font-semibold">Details & Reason</th>
              <th className="py-3 px-3 font-semibold">Status</th>
              <th className="py-3 px-3 font-semibold">Supervisor Approval</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-sm">No attendance records found</p>
                  <p className="text-xs text-slate-400">Try changing your tab or filter selections</p>
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => {
                const emp = employees.find(e => e.id === record.employeeId);
                return (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Employee */}
                    <td className="py-3 px-4">
                      {emp ? (
                        <button
                          onClick={() => onSelectEmployee(emp)}
                          className="flex items-center gap-2 text-left hover:text-indigo-600"
                        >
                          <div className={`w-7 h-7 rounded-full ${emp.avatarColor || 'bg-indigo-600'} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                            {emp.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{record.employeeName}</p>
                            <p className="text-[10px] text-slate-400">{record.department}</p>
                          </div>
                        </button>
                      ) : (
                        <div>
                          <p className="font-bold text-slate-900">{record.employeeName}</p>
                          <p className="text-[10px] text-slate-400">{record.department}</p>
                        </div>
                      )}
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3">
                      {record.type === 'PTO' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Palmtree className="w-3.5 h-3.5 text-amber-600" /> PTO
                        </span>
                      ) : record.type === 'Tardiness' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                          <Clock className="w-3.5 h-3.5 text-orange-600" /> Tardiness
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> {record.type}
                        </span>
                      )}
                    </td>

                    {/* Date / Duration */}
                    <td className="py-3 px-3 font-mono font-medium text-slate-700">
                      <div>
                        <span>{record.date}</span>
                        {record.endDate && record.endDate !== record.date && (
                          <span className="text-slate-400 text-[10px] block">to {record.endDate}</span>
                        )}
                      </div>
                      {record.type === 'Tardiness' && record.minutesLate && (
                        <span className="text-orange-700 font-bold text-[11px] block mt-0.5">
                          +{record.minutesLate} mins late
                        </span>
                      )}
                    </td>

                    {/* Details & Reason */}
                    <td className="py-3 px-3 max-w-xs">
                      <p className="font-semibold text-slate-800 line-clamp-1">{record.reason}</p>
                      {record.notes && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 italic mt-0.5">{record.notes}</p>
                      )}
                      {record.scheduledTime && record.actualTime && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Sched: {record.scheduledTime} | Arrival: {record.actualTime}
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        record.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        record.status === 'Excused' ? 'bg-blue-100 text-blue-800' :
                        record.status === 'Recorded' ? 'bg-slate-100 text-slate-700' :
                        record.status === 'Pending' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>

                    {/* Supervisor Approval */}
                    <td className="py-3 px-3 text-slate-600">
                      <span className="font-medium text-slate-800">{record.supervisorApprovedBy || 'Tom Hardy'}</span>
                      <span className="text-[10px] text-slate-400 block">
                        {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : ''}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Manager approval toggles */}
                        {record.status === 'Pending' && (
                          <button
                            onClick={() => updateAttendanceStatus(record.id, 'Approved')}
                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50"
                            title="Approve Record"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {record.type === 'Tardiness' && record.status === 'Recorded' && (
                          <button
                            onClick={() => updateAttendanceStatus(record.id, 'Excused')}
                            className="px-2 py-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md"
                            title="Mark as Excused Tardy"
                          >
                            Excuse
                          </button>
                        )}
                        <button
                          onClick={() => deleteAttendanceRecord(record.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Monthly PTO & Absence Exporter Modal */}
      <MonthlyExportModal
        isOpen={isMonthlyExportOpen}
        onClose={() => setIsMonthlyExportOpen(false)}
        initialMonth={filterMonth !== 'all' ? filterMonth : undefined}
      />
    </div>
  );
};
