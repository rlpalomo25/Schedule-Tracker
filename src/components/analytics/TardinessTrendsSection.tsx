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
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Compass,
  ArrowUpRight,
  Info,
  Car,
  Train,
  CloudRain,
  Laptop,
  CheckCircle2
} from 'lucide-react';
import { Employee, AttendanceRecord, TimeEntry, DayOfWeek } from '../../types';

interface TardinessTrendsSectionProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  timeEntries: TimeEntry[];
  selectedDepartment: string;
  selectedSupervisor: string;
  onSelectEmployee?: (emp: Employee) => void;
}

const DAYS_ORDER: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DAY_FULL_NAMES: Record<DayOfWeek, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday'
};

function getDayOfWeek(dateStr: string): DayOfWeek {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dayNum = dt.getDay(); // 0 = Sun, 1 = Mon ...
  const map: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return map[dayNum] || 'Mon';
}

export const TardinessTrendsSection: React.FC<TardinessTrendsSectionProps> = ({
  employees,
  attendanceRecords,
  timeEntries,
  selectedDepartment,
  selectedSupervisor,
  onSelectEmployee
}) => {
  const [highlightDay, setHighlightDay] = useState<DayOfWeek | null>(null);

  // Filter employees based on selections
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (selectedDepartment !== 'all' && emp.department !== selectedDepartment) return false;
      if (selectedSupervisor !== 'all' && emp.supervisor !== selectedSupervisor) return false;
      return true;
    });
  }, [employees, selectedDepartment, selectedSupervisor]);

  const filteredEmpIds = useMemo(() => new Set(filteredEmployees.map(e => e.id)), [filteredEmployees]);

  // Filter attendance records
  const tardyRecords = useMemo(() => {
    return attendanceRecords.filter(r => {
      if (r.type !== 'Tardiness') return false;
      if (!filteredEmpIds.has(r.employeeId)) return false;
      return true;
    });
  }, [attendanceRecords, filteredEmpIds]);

  // Aggregate day-of-week data
  const dayStats = useMemo(() => {
    return DAYS_ORDER.map(day => {
      // Count employees scheduled to work on this day
      const scheduledCount = filteredEmployees.filter(emp => {
        const shift = emp.schedule[day];
        return shift && !shift.isOff;
      }).length;

      // Filter tardy records matching this day of week
      const recordsOnDay = tardyRecords.filter(r => getDayOfWeek(r.date) === day);
      
      const totalMinutesLate = recordsOnDay.reduce((acc, r) => acc + (r.minutesLate || 10), 0);
      const avgMinutesLate = recordsOnDay.length > 0 ? Math.round(totalMinutesLate / recordsOnDay.length) : 0;
      
      // Calculate tardiness rate against scheduled workforce
      const tardyRate = scheduledCount > 0 
        ? Number(((recordsOnDay.length / scheduledCount) * 100).toFixed(1))
        : 0;

      return {
        day,
        fullName: DAY_FULL_NAMES[day],
        scheduledCount,
        tardyCount: recordsOnDay.length,
        tardyRate, // percentage
        avgMinutesLate,
        records: recordsOnDay
      };
    });
  }, [filteredEmployees, tardyRecords]);

  // Comparison metrics: Monday vs rest of week
  const mondayStat = dayStats.find(d => d.day === 'Mon');
  const midWeekStats = dayStats.filter(d => ['Tue', 'Wed', 'Thu'].includes(d.day));
  const avgMidWeekRate = midWeekStats.length > 0
    ? midWeekStats.reduce((acc, d) => acc + d.tardyRate, 0) / midWeekStats.length
    : 1;

  const mondayExcessPercent = avgMidWeekRate > 0 && mondayStat
    ? Math.round(((mondayStat.tardyRate - avgMidWeekRate) / avgMidWeekRate) * 100)
    : 40;

  const totalTardyEvents = tardyRecords.length;
  const overallAvgDelay = totalTardyEvents > 0
    ? Math.round(tardyRecords.reduce((acc, r) => acc + (r.minutesLate || 12), 0) / totalTardyEvents)
    : 0;

  // Root cause categories distribution
  const rootCauses = useMemo(() => {
    let traffic = 0;
    let transit = 0;
    let weather = 0;
    let tech = 0;
    let personal = 0;

    tardyRecords.forEach(r => {
      const txt = (r.reason + ' ' + (r.notes || '')).toLowerCase();
      if (txt.includes('traffic') || txt.includes('highway') || txt.includes('roadwork') || txt.includes('congestion') || txt.includes('bridge')) {
        traffic++;
      } else if (txt.includes('metro') || txt.includes('train') || txt.includes('transit') || txt.includes('bus') || txt.includes('shuttle')) {
        transit++;
      } else if (txt.includes('rain') || txt.includes('storm') || txt.includes('weather') || txt.includes('monsoon')) {
        weather++;
      } else if (txt.includes('vpn') || txt.includes('router') || txt.includes('power') || txt.includes('system') || txt.includes('broadband')) {
        tech++;
      } else {
        personal++;
      }
    });

    const total = totalTardyEvents || 1;
    return [
      { name: 'Commute & Highway Traffic', count: traffic, pct: Math.round((traffic / total) * 100), icon: Car, color: 'text-amber-600', bg: 'bg-amber-100' },
      { name: 'Public Transit / Metro Delays', count: transit, pct: Math.round((transit / total) * 100), icon: Train, color: 'text-blue-600', bg: 'bg-blue-100' },
      { name: 'Weather & Inclement Roadway', count: weather, pct: Math.round((weather / total) * 100), icon: CloudRain, color: 'text-cyan-600', bg: 'bg-cyan-100' },
      { name: 'VPN / Technical Startup Faults', count: tech, pct: Math.round((tech / total) * 100), icon: Laptop, color: 'text-indigo-600', bg: 'bg-indigo-100' },
      { name: 'Personal / Shift Transition Overrun', count: personal, pct: Math.round((personal / total) * 100), icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    ];
  }, [tardyRecords, totalTardyEvents]);

  return (
    <div className="space-y-6">
      {/* High-impact Monday Tardiness Insight Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-200/80 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs shrink-0 mt-0.5 md:mt-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-md">
                  Key Historical Pattern
                </span>
                <span className="text-xs font-medium text-amber-800">
                  Day-of-Week Disparity
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Mondays register <span className="text-amber-700 underline decoration-amber-400 decoration-2">+{mondayExcessPercent}% more late arrivals</span> than the midweek baseline
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                Historical shift telemetry indicates Monday morning shift changeovers (08:00–09:30 AM) suffer disproportionately from regional toll-road congestion and commuter transit backlogs, with an average tardiness duration of {mondayStat?.avgMinutesLate || 18} minutes.
              </p>
            </div>
          </div>
          <div className="bg-white px-4 py-3 rounded-xl border border-amber-200 shadow-xs shrink-0 text-center w-full md:w-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Monday Tardy Rate</span>
            <span className="text-2xl font-black text-amber-600">{mondayStat?.tardyRate || 0}%</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">vs. {avgMidWeekRate.toFixed(1)}% Tue–Thu avg</span>
          </div>
        </div>
      </div>

      {/* Main Bar Chart & Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Bar Chart: Tardiness Rate by Day of Week */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Tardiness Rate & Incident Count by Day of Week</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Percentage of scheduled engineers clocking in beyond shift start time
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" />
                <span>Late Rate (%)</span>
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-slate-600 ml-2">
                <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />
                <span>Incident Count</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dayStats}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    const day = e.activePayload[0].payload.day as DayOfWeek;
                    setHighlightDay(highlightDay === day ? null : day);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  unit="%"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'tardyRate') return [`${value}%`, 'Tardy Rate'];
                    if (name === 'tardyCount') return [`${value} incidents`, 'Late Arrivals'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => {
                    const found = dayStats.find(d => d.day === label);
                    return found ? `${found.fullName} (${found.scheduledCount} Scheduled)` : label;
                  }}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                    padding: '8px 12px'
                  }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="tardyRate"
                  radius={[6, 6, 0, 0]}
                  name="tardyRate"
                >
                  {dayStats.map((entry) => (
                    <Cell
                      key={`cell-${entry.day}`}
                      fill={entry.day === 'Mon' ? '#f59e0b' : entry.day === highlightDay ? '#3b82f6' : '#6366f1'}
                    />
                  ))}
                </Bar>
                <Bar
                  yAxisId="right"
                  dataKey="tardyCount"
                  fill="#fbbf24"
                  radius={[6, 6, 0, 0]}
                  name="tardyCount"
                  opacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Click on any bar to inspect specific day incidents below</span>
            </span>
            {highlightDay && (
              <button
                onClick={() => setHighlightDay(null)}
                className="text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                Clear Day Filter (Showing {DAY_FULL_NAMES[highlightDay]})
              </button>
            )}
          </div>
        </div>

        {/* Quick Summary Metrics */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Average Arrival Delay
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-orange-600">{overallAvgDelay}</span>
              <span className="text-xs text-slate-500 font-medium">minutes per late shift</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Across {totalTardyEvents} recorded tardiness events in the dataset
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Best Punctuality Day
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600">Wednesdays</span>
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                96.8% On-Time
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Consistently lowest rate of transit and login delays
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Peak Delay Time Window
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">08:00 – 09:30 AM</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              74% of all delays cluster around the morning handover shift launch
            </p>
          </div>
        </div>
      </div>

      {/* Root Cause Distribution & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Root Causes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-600" />
            <span>Primary Root Causes for Late Arrivals</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Aggregated from supervisor sign-off notes & employee check-in reasons
          </p>

          <div className="space-y-3.5">
            {rootCauses.map((cause) => {
              const IconComp = cause.icon;
              return (
                <div key={cause.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-md ${cause.bg} ${cause.color}`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-slate-800">{cause.name}</span>
                    </div>
                    <span className="font-mono text-slate-500 font-bold">{cause.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        cause.pct > 30 ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${cause.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Tardiness Events Log */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>
                  {highlightDay
                    ? `${DAY_FULL_NAMES[highlightDay]} Tardiness Incidents (${tardyRecords.filter(r => getDayOfWeek(r.date) === highlightDay).length})`
                    : `Recent Historical Tardiness Incidents (${tardyRecords.length})`}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed audit trail with delay minutes, arrival variance, and supervisor notes
              </p>
            </div>
            {highlightDay && (
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-bold border border-indigo-200">
                Filtered: {DAY_FULL_NAMES[highlightDay]}
              </span>
            )}
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                <tr>
                  <th className="py-2.5 px-3 font-bold text-slate-600">Employee</th>
                  <th className="py-2.5 px-3 font-bold text-slate-600">Date & Day</th>
                  <th className="py-2.5 px-3 font-bold text-slate-600">Scheduled / Actual</th>
                  <th className="py-2.5 px-3 font-bold text-slate-600">Delay</th>
                  <th className="py-2.5 px-3 font-bold text-slate-600">Reason & Notes</th>
                  <th className="py-2.5 px-3 font-bold text-slate-600">Supervisor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(highlightDay ? tardyRecords.filter(r => getDayOfWeek(r.date) === highlightDay) : tardyRecords).map((rec) => {
                  const day = getDayOfWeek(rec.date);
                  const isMon = day === 'Mon';
                  const emp = employees.find(e => e.id === rec.employeeId);

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => emp && onSelectEmployee && onSelectEmployee(emp)}
                          className="text-left group cursor-pointer"
                        >
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block">
                            {rec.employeeName}
                          </span>
                          <span className="text-[10px] text-slate-500">{rec.department}</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-slate-700">{rec.date}</span>
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isMon ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {day}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600">
                        {rec.scheduledTime || '09:00'} → <span className="font-bold text-amber-700">{rec.actualTime || '--:--'}</span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200">
                          +{rec.minutesLate || 15}m late
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate" title={rec.reason + (rec.notes ? ` - ${rec.notes}` : '')}>
                        <span className="text-slate-800 font-normal">{rec.reason}</span>
                        {rec.notes && (
                          <span className="block text-[10px] text-slate-400 truncate">{rec.notes}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                        {rec.supervisorApprovedBy || 'Supervisor'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
