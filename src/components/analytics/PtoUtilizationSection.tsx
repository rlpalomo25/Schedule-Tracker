import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell
} from 'recharts';
import {
  Palmtree,
  Calendar,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  PlusCircle,
  Edit2,
  Clock,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { Employee, AttendanceRecord, AttendanceType } from '../../types';
import { useSchedule } from '../../context/ScheduleContext';

interface PtoUtilizationSectionProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  selectedDepartment: string;
  selectedSupervisor: string;
  onOpenLogAttendance?: (type?: AttendanceType, emp?: Employee) => void;
  onSelectEmployee?: (emp: Employee) => void;
}

// Calculate duration in days between two ISO YYYY-MM-DD dates
function calculateDaysCount(startDate: string, endDate?: string): number {
  if (!endDate || endDate === startDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(30, diffDays));
}

export const PtoUtilizationSection: React.FC<PtoUtilizationSectionProps> = ({
  employees,
  attendanceRecords,
  selectedDepartment,
  selectedSupervisor,
  onOpenLogAttendance,
  onSelectEmployee
}) => {
  const { updateEmployeePtoAllowance } = useSchedule();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'burnout' | 'high'>('all');
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [newAllowanceVal, setNewAllowanceVal] = useState<number>(20);

  // Compute per-employee PTO metrics
  const employeePtoData = useMemo(() => {
    return employees.map(emp => {
      const quota = emp.ptoAllowance || 20;

      // Approved PTO
      const approvedPtoRecords = attendanceRecords.filter(
        r => r.employeeId === emp.id && r.type === 'PTO' && r.status === 'Approved'
      );
      const usedDays = approvedPtoRecords.reduce((acc, r) => acc + calculateDaysCount(r.date, r.endDate), 0);

      // Pending PTO
      const pendingPtoRecords = attendanceRecords.filter(
        r => r.employeeId === emp.id && r.type === 'PTO' && r.status === 'Pending'
      );
      const pendingDays = pendingPtoRecords.reduce((acc, r) => acc + calculateDaysCount(r.date, r.endDate), 0);

      // Sick leave count (for context)
      const sickRecords = attendanceRecords.filter(
        r => r.employeeId === emp.id && r.type === 'Sick Leave' && r.status === 'Approved'
      );
      const sickDays = sickRecords.reduce((acc, r) => acc + calculateDaysCount(r.date, r.endDate), 0);

      const remainingDays = Math.max(0, quota - usedDays - pendingDays);
      const utilizationPct = quota > 0 ? Math.round((usedDays / quota) * 100) : 0;

      // Status classification
      let healthStatus: 'burnout' | 'healthy' | 'high' | 'exhausted' = 'healthy';
      if (usedDays <= 2) {
        healthStatus = 'burnout'; // High risk of burnout / under-utilized in September
      } else if (utilizationPct >= 90) {
        healthStatus = 'exhausted';
      } else if (utilizationPct >= 75) {
        healthStatus = 'high';
      }

      return {
        employee: emp,
        quota,
        usedDays,
        pendingDays,
        sickDays,
        remainingDays,
        utilizationPct,
        healthStatus,
        records: approvedPtoRecords
      };
    });
  }, [employees, attendanceRecords]);

  // Filtered by department / supervisor & search & status
  const filteredData = useMemo(() => {
    return employeePtoData.filter(item => {
      const emp = item.employee;
      if (selectedDepartment !== 'all' && emp.department !== selectedDepartment) return false;
      if (selectedSupervisor !== 'all' && emp.supervisor !== selectedSupervisor) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = emp.name.toLowerCase().includes(query);
        const matchDept = emp.department.toLowerCase().includes(query);
        const matchCountry = emp.country.toLowerCase().includes(query);
        if (!matchName && !matchDept && !matchCountry) return false;
      }

      if (statusFilter === 'burnout' && item.healthStatus !== 'burnout') return false;
      if (statusFilter === 'high' && !['high', 'exhausted'].includes(item.healthStatus)) return false;
      if (statusFilter === 'healthy' && item.healthStatus !== 'healthy') return false;

      return true;
    });
  }, [employeePtoData, selectedDepartment, selectedSupervisor, searchTerm, statusFilter]);

  // Aggregate stats across team
  const totalTeamQuota = employeePtoData.reduce((acc, i) => acc + i.quota, 0);
  const totalTeamUsed = employeePtoData.reduce((acc, i) => acc + i.usedDays, 0);
  const totalTeamPending = employeePtoData.reduce((acc, i) => acc + i.pendingDays, 0);
  const totalTeamRemaining = employeePtoData.reduce((acc, i) => acc + i.remainingDays, 0);
  const avgTeamUtilization = totalTeamQuota > 0 ? Math.round((totalTeamUsed / totalTeamQuota) * 100) : 0;
  const burnoutCount = employeePtoData.filter(i => i.healthStatus === 'burnout').length;
  const highUsageCount = employeePtoData.filter(i => ['high', 'exhausted'].includes(i.healthStatus)).length;

  // Department aggregate for chart
  const deptChartData = useMemo(() => {
    const deptMap: Record<string, { used: number; quota: number; count: number }> = {};
    employeePtoData.forEach(item => {
      const d = item.employee.department;
      if (!deptMap[d]) {
        deptMap[d] = { used: 0, quota: 0, count: 0 };
      }
      deptMap[d].used += item.usedDays;
      deptMap[d].quota += item.quota;
      deptMap[d].count += 1;
    });

    return Object.entries(deptMap).map(([dept, vals]) => {
      const avgUsed = Number((vals.used / vals.count).toFixed(1));
      const avgQuota = Number((vals.quota / vals.count).toFixed(1));
      const avgRemaining = Math.max(0, Number((avgQuota - avgUsed).toFixed(1)));
      const rate = vals.quota > 0 ? Math.round((vals.used / vals.quota) * 100) : 0;
      return {
        department: dept,
        avgUsed,
        avgRemaining,
        avgQuota,
        utilizationRate: rate,
        headcount: vals.count
      };
    }).sort((a, b) => b.utilizationRate - a.utilizationRate);
  }, [employeePtoData]);

  const handleSaveAllowance = (empId: string) => {
    updateEmployeePtoAllowance(empId, newAllowanceVal);
    setEditingEmpId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team PTO Pool</span>
            <Palmtree className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalTeamUsed}</span>
            <span className="text-xs text-slate-500 font-medium">/ {totalTeamQuota} total days</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full"
              style={{ width: `${avgTeamUtilization}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {avgTeamUtilization}% team utilization through Q3 2026
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remaining Days Reserve</span>
            <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-700">{totalTeamRemaining}</span>
            <span className="text-xs text-slate-500 font-medium">available days</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Plus {totalTeamPending} days currently in pending supervisor review
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Burnout Risk Alert</span>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">{burnoutCount}</span>
            <span className="text-xs text-slate-500 font-medium">engineers with ≤2 days</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Under-utilizing PTO late into the year; encourage scheduled breaks
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">High Usage / Near Cap</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-600">{highUsageCount}</span>
            <span className="text-xs text-slate-500 font-medium">engineers ≥75% quota</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Well-distributed vacation balances; balance upcoming Q4 coverage
          </p>
        </div>
      </div>

      {/* Department PTO Utilization Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Palmtree className="w-4 h-4 text-emerald-600" />
              <span>Department PTO Utilization & Average Balances</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Average days used vs. remaining per engineer across departments
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block" />
              <span>Avg Days Used</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-3 h-3 rounded-sm bg-slate-200 inline-block" />
              <span>Avg Days Remaining</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={deptChartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} unit="d" />
              <YAxis
                dataKey="department"
                type="category"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                width={130}
              />
              <Tooltip
                formatter={(val: any, name: string) => {
                  if (name === 'avgUsed') return [`${val} days`, 'Avg Used'];
                  if (name === 'avgRemaining') return [`${val} days`, 'Avg Remaining'];
                  return [val, name];
                }}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="avgUsed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="avgUsed" />
              <Bar dataKey="avgRemaining" stackId="a" fill="#e2e8f0" radius={[0, 4, 4, 0]} name="avgRemaining" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Individual Employee PTO Directory & Utilization Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Employee PTO Balance & Utilization Roster ({filteredData.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Annual allowance quota, days consumed YTD, upcoming pending requests, and balance health
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter Chips */}
              <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  All ({employeePtoData.length})
                </button>
                <button
                  onClick={() => setStatusFilter('healthy')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'healthy' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'hover:text-emerald-700'
                  }`}
                >
                  Healthy ({employeePtoData.filter(i => i.healthStatus === 'healthy').length})
                </button>
                <button
                  onClick={() => setStatusFilter('burnout')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'burnout' ? 'bg-white text-amber-700 shadow-2xs font-bold' : 'hover:text-amber-700'
                  }`}
                >
                  Burnout Risk ({burnoutCount})
                </button>
                <button
                  onClick={() => setStatusFilter('high')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'high' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'hover:text-blue-700'
                  }`}
                >
                  High Usage ({highUsageCount})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search engineer or dept..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 sm:w-56"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 font-bold text-slate-600">
                <th className="py-3 px-4">Engineer</th>
                <th className="py-3 px-4">Department & Supervisor</th>
                <th className="py-3 px-4 text-center">Annual Quota</th>
                <th className="py-3 px-4 text-center">Days Used YTD</th>
                <th className="py-3 px-4 text-center">Pending / Booked</th>
                <th className="py-3 px-4 text-center">Days Remaining</th>
                <th className="py-3 px-4 min-w-[180px]">Utilization & Health</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredData.map((item) => {
                const emp = item.employee;
                const isEditing = editingEmpId === emp.id;

                let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                let badgeText = 'Healthy';
                let barColor = 'bg-emerald-500';

                if (item.healthStatus === 'burnout') {
                  badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                  badgeText = 'Low Usage (Burnout Risk)';
                  barColor = 'bg-amber-500';
                } else if (item.healthStatus === 'high') {
                  badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                  badgeText = 'High Utilization';
                  barColor = 'bg-blue-500';
                } else if (item.healthStatus === 'exhausted') {
                  badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                  badgeText = 'Quota Exhausted';
                  barColor = 'bg-rose-500';
                }

                return (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Employee */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0 ${
                            emp.avatarColor || 'bg-indigo-600'
                          }`}
                        >
                          {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <button
                            onClick={() => onSelectEmployee && onSelectEmployee(emp)}
                            className="font-bold text-slate-900 hover:text-indigo-600 text-left transition-colors cursor-pointer flex items-center gap-1 group"
                          >
                            <span>{emp.name}</span>
                            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                          <span className="text-[11px] text-slate-400">{emp.country}</span>
                        </div>
                      </div>
                    </td>

                    {/* Department & Supervisor */}
                    <td className="py-3 px-4">
                      <span className="text-slate-800 font-semibold block">{emp.department}</span>
                      <span className="text-[11px] text-slate-500">Sup: {emp.supervisor}</span>
                    </td>

                    {/* Annual Quota (with inline edit) */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {isEditing ? (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={newAllowanceVal}
                            onChange={(e) => setNewAllowanceVal(Number(e.target.value))}
                            className="w-14 px-1.5 py-0.5 border border-indigo-300 rounded text-center text-xs font-bold focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() => handleSaveAllowance(emp.id)}
                            className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold hover:bg-indigo-700"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 group">
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {item.quota} d
                          </span>
                          <button
                            onClick={() => {
                              setEditingEmpId(emp.id);
                              setNewAllowanceVal(item.quota);
                            }}
                            className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                            title="Edit annual PTO allowance quota"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Days Used YTD */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-emerald-700 text-xs">
                        {item.usedDays} d
                      </span>
                    </td>

                    {/* Pending / Booked */}
                    <td className="py-3 px-4 text-center">
                      {item.pendingDays > 0 ? (
                        <span className="font-mono font-bold text-amber-700 text-xs bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {item.pendingDays} d
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">-</span>
                      )}
                    </td>

                    {/* Days Remaining */}
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono font-black text-xs ${
                        item.remainingDays <= 3 ? 'text-rose-600' : 'text-slate-900'
                      }`}>
                        {item.remainingDays} d
                      </span>
                    </td>

                    {/* Utilization Progress & Health Badge */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${badgeColor}`}>
                            {badgeText}
                          </span>
                          <span className="font-mono font-bold text-slate-700">{item.utilizationPct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                            style={{ width: `${Math.min(100, item.utilizationPct)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onOpenLogAttendance && onOpenLogAttendance('PTO', emp)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-2xs transition-colors cursor-pointer"
                        title="Log planned PTO for this employee"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Log PTO</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
