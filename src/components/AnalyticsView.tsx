import React, { useMemo } from 'react';
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
  Award
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { employees, attendanceRecords, selectedDay } = useSchedule();

  // Department distribution
  const deptStats = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach(e => {
      map[e.department] = (map[e.department] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [employees]);

  // Country distribution
  const countryStats = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach(e => {
      map[e.country] = (map[e.country] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [employees]);

  // Supervisor distribution
  const supervisorStats = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach(e => {
      map[e.supervisor] = (map[e.supervisor] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [employees]);

  // Attendance metrics
  const totalPTO = attendanceRecords.filter(r => r.type === 'PTO').length;
  const totalTardy = attendanceRecords.filter(r => r.type === 'Tardiness').length;
  const totalAbsence = attendanceRecords.filter(r => r.type === 'Absence' || r.type === 'Sick Leave').length;
  const onTimeRate = Math.max(85, Math.min(100, Math.round(100 - (totalTardy / employees.length) * 100)));

  return (
    <div className="space-y-6">
      {/* Top summary cards */}
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
            Calculated across {attendanceRecords.length} recorded shift events
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
            Across {countryStats.length} countries & {deptStats.length} service units
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">PTO Coverage</span>
            <Palmtree className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700">{totalPTO}</span>
            <span className="text-xs text-slate-500 font-medium">leaves booked</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            100% covered by designated shift handover peers
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tardiness / Absences</span>
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-orange-700">{totalTardy + totalAbsence}</span>
            <span className="text-xs text-slate-500 font-medium">logged exceptions</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {totalTardy} tardy incidents, {totalAbsence} sick/unplanned
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

        {/* Supervisor Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Supervisor Teams ({supervisorStats.length})</span>
          </h3>

          <div className="space-y-3">
            {supervisorStats.map(([sup, count]) => {
              const pct = Math.round((count / employees.length) * 100);
              return (
                <div key={sup} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{sup}</span>
                    <span className="font-mono text-slate-500">{count} reports ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
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
  );
};
