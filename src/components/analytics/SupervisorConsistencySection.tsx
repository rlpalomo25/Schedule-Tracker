import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  ShieldCheck,
  Award,
  Users,
  CheckCircle2,
  Clock,
  Sun,
  Moon,
  Sunset,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import { Employee, AttendanceRecord, ShiftSwapRequest } from '../../types';

interface SupervisorConsistencySectionProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  shiftSwapRequests: ShiftSwapRequest[];
  selectedDepartment: string;
  onSelectEmployee?: (emp: Employee) => void;
}

interface SupervisorScore {
  name: string;
  supervisorEmp?: Employee;
  teamSize: number;
  departments: string[];
  totalShiftsAssigned: number;
  tardyCount: number;
  absenceCount: number;
  adherenceRate: number; // 0-100%
  coverageFillRate: number; // 0-100%
  swapResolutionRate: number; // 0-100%
  compositeScore: number; // 0-100
  letterGrade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-';
  morningConsistency: number;
  swingConsistency: number;
  nightConsistency: number;
  keyStrength: string;
}

export const SupervisorConsistencySection: React.FC<SupervisorConsistencySectionProps> = ({
  employees,
  attendanceRecords,
  shiftSwapRequests,
  selectedDepartment,
  onSelectEmployee
}) => {
  // Extract all supervisors from the dataset
  const supervisorScores = useMemo<SupervisorScore[]>(() => {
    // Unique supervisors
    const supervisorNames = Array.from(
      new Set(employees.map(e => e.supervisor).filter(Boolean))
    );

    return supervisorNames.map(supName => {
      const supervisorEmp = employees.find(e => e.name === supName);
      const supervisees = employees.filter(e => {
        if (e.supervisor !== supName) return false;
        if (selectedDepartment !== 'all' && e.department !== selectedDepartment) return false;
        return true;
      });

      const teamSize = supervisees.length;
      const superviseeIds = new Set(supervisees.map(e => e.id));
      const depts = Array.from(new Set(supervisees.map(e => e.department)));

      // Count scheduled shifts across standard week (assuming 5 shifts per employee)
      const totalShiftsAssigned = supervisees.reduce((acc, emp) => {
        const workingDays = Object.values(emp.schedule).filter((s: any) => !s?.isOff).length;
        return acc + workingDays * 4; // monthly proxy
      }, 0) || 20;

      // Count tardiness records for this supervisor's team
      const tardyRecords = attendanceRecords.filter(
        r => superviseeIds.has(r.employeeId) && r.type === 'Tardiness'
      );
      const tardyCount = tardyRecords.length;

      // Count unexcused absences
      const absenceRecords = attendanceRecords.filter(
        r => superviseeIds.has(r.employeeId) && r.type === 'Absence'
      );
      const absenceCount = absenceRecords.length;

      // Shift Adherence Rate: on-time rate
      const onTimeShifts = Math.max(0, totalShiftsAssigned - tardyCount);
      const adherenceRate = Math.min(100, Math.round((onTimeShifts / totalShiftsAssigned) * 100));

      // Coverage Fill Rate: scheduled shifts that didn't have uncovered absences
      const coveredShifts = Math.max(0, totalShiftsAssigned - absenceCount);
      const coverageFillRate = Math.min(100, Math.round((coveredShifts / totalShiftsAssigned) * 100));

      // Swap and Coverage Request Responsiveness
      const swapsForTeam = shiftSwapRequests.filter(
        s => superviseeIds.has(s.requesterId) || (s.targetEmployeeId && superviseeIds.has(s.targetEmployeeId))
      );
      const resolvedSwaps = swapsForTeam.filter(s => ['approved', 'rejected', 'cancelled'].includes(s.status));
      const swapResolutionRate = swapsForTeam.length > 0
        ? Math.round((resolvedSwaps.length / swapsForTeam.length) * 100)
        : 95;

      // Shift Tier breakdown modeling
      // Morning (starts 07:00 - 11:00)
      // Swing (starts 12:00 - 17:00)
      // Night (starts 18:00 - 05:00)
      let morningTardy = 0;
      let swingTardy = 0;
      let nightTardy = 0;

      tardyRecords.forEach(r => {
        const time = r.scheduledTime || '09:00';
        const hour = parseInt(time.split(':')[0], 10);
        if (hour >= 6 && hour < 12) morningTardy++;
        else if (hour >= 12 && hour < 18) swingTardy++;
        else nightTardy++;
      });

      const morningConsistency = Math.max(75, Math.min(99, 98 - morningTardy * 2));
      const swingConsistency = Math.max(80, Math.min(99, 99 - swingTardy * 2));
      const nightConsistency = Math.max(82, Math.min(100, 99 - nightTardy * 1.5));

      // Handover stability (weighted average of shift tiers)
      const handoverStability = Math.round((morningConsistency + swingConsistency + nightConsistency) / 3);

      // Composite Consistency Index:
      // 40% Schedule Adherence + 30% Coverage Fill + 15% Swap Responsiveness + 15% Handover Stability
      const compositeScore = Math.min(100, Math.round(
        adherenceRate * 0.40 +
        coverageFillRate * 0.30 +
        swapResolutionRate * 0.15 +
        handoverStability * 0.15
      ));

      let letterGrade: SupervisorScore['letterGrade'] = 'A';
      if (compositeScore >= 95) letterGrade = 'A+';
      else if (compositeScore >= 91) letterGrade = 'A';
      else if (compositeScore >= 87) letterGrade = 'A-';
      else if (compositeScore >= 83) letterGrade = 'B+';
      else if (compositeScore >= 79) letterGrade = 'B';
      else letterGrade = 'B-';

      // Key strength determination
      let keyStrength = 'Punctual Morning Launch';
      if (nightConsistency >= 98) keyStrength = 'Flawless Graveyard Coverage';
      else if (swapResolutionRate >= 95) keyStrength = 'Rapid Swap Approvals';
      else if (coverageFillRate >= 98) keyStrength = 'Zero Uncovered Shifts';
      else if (adherenceRate >= 95) keyStrength = 'High Schedule Adherence';

      return {
        name: supName,
        supervisorEmp,
        teamSize,
        departments: depts,
        totalShiftsAssigned,
        tardyCount,
        absenceCount,
        adherenceRate,
        coverageFillRate,
        swapResolutionRate,
        compositeScore,
        letterGrade,
        morningConsistency,
        swingConsistency,
        nightConsistency,
        keyStrength
      };
    })
    .filter(s => s.teamSize > 0)
    .sort((a, b) => b.compositeScore - a.compositeScore);
  }, [employees, attendanceRecords, shiftSwapRequests, selectedDepartment]);

  // Top overall average
  const avgTeamConsistency = supervisorScores.length > 0
    ? Math.round(supervisorScores.reduce((acc, s) => acc + s.compositeScore, 0) / supervisorScores.length)
    : 92;

  const topSupervisor = supervisorScores[0];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Operational Telemetry
              </span>
              <span className="text-xs text-slate-300 font-medium">Shift Health Matrix</span>
            </div>
            <h2 className="text-xl font-bold mt-2">
              Supervisor Coverage Consistency Index
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Composite index measuring shift adherence, on-time launch rates, coverage fill reliability, and seamless cross-shift handovers across AM, PM, and Overnight tiers.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-white/10 backdrop-blur-xs border border-white/10 p-4 rounded-xl">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-indigo-200 block">Overall Index</span>
              <span className="text-3xl font-black text-white">{avgTeamConsistency}</span>
              <span className="text-[10px] text-emerald-400 block font-bold">Grade A Target</span>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-indigo-200 block">Top Performer</span>
              <span className="text-sm font-bold text-white truncate max-w-[120px] block">
                {topSupervisor?.name || 'Andre Villaran'}
              </span>
              <span className="text-[10px] text-amber-300 block font-bold">
                {topSupervisor?.compositeScore || 96}/100 ({topSupervisor?.letterGrade || 'A+'})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Consistency Score & Schedule Adherence Comparison</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Composite Coverage Consistency Score (0–100) vs. On-time Shift Adherence (%)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" />
                <span>Consistency Score</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                <span>Adherence Rate (%)</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={supervisorScores}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval={0}
                  tick={({ x, y, payload }) => (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={14}
                        textAnchor="end"
                        fill="#475569"
                        transform="rotate(-25)"
                        fontSize={10}
                        fontWeight={600}
                      >
                        {payload.value.split(' ')[0]} {payload.value.split(' ')[1]?.[0] || ''}.
                      </text>
                    </g>
                  )}
                />
                <YAxis
                  domain={[70, 100]}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip
                  formatter={(val: any, name: string) => {
                    if (name === 'compositeScore') return [`${val} / 100`, 'Consistency Score'];
                    if (name === 'adherenceRate') return [`${val}%`, 'Shift Adherence'];
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
                <Bar
                  dataKey="compositeScore"
                  fill="#4f46e5"
                  radius={[6, 6, 0, 0]}
                  name="compositeScore"
                >
                  {supervisorScores.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={index === 0 ? '#10b981' : '#6366f1'}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="adherenceRate"
                  fill="#38bdf8"
                  radius={[6, 6, 0, 0]}
                  name="adherenceRate"
                  opacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scoring Methodology Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Score Calculation Weights</span>
          </h3>
          <p className="text-xs text-slate-500">
            Scientifically balanced across four key operational operational pillars:
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between font-bold text-slate-800 mb-1">
                <span>1. Schedule Adherence (40%)</span>
                <span className="text-indigo-600">40 pts</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Punctual shift clock-ins vs late arrivals within the team
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between font-bold text-slate-800 mb-1">
                <span>2. Coverage Fill Rate (30%)</span>
                <span className="text-indigo-600">30 pts</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Zero uncovered emergency holes or unexcused shift absences
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between font-bold text-slate-800 mb-1">
                <span>3. Swap & PTO Response (15%)</span>
                <span className="text-indigo-600">15 pts</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Turnaround efficiency on shift trades & coverage claims
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between font-bold text-slate-800 mb-1">
                <span>4. Cross-Shift Handover (15%)</span>
                <span className="text-indigo-600">15 pts</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Consistency across Morning, Swing, and Overnight rotations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Supervisor Scorecards */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          <span>Supervisor Shift Consistency Scorecards ({supervisorScores.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supervisorScores.map((score, idx) => {
            const isRank1 = idx === 0;

            return (
              <div
                key={score.name}
                className={`bg-white rounded-2xl border p-5 transition-all shadow-2xs hover:shadow-sm ${
                  isRank1 ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                        score.supervisorEmp?.avatarColor || 'bg-slate-700'
                      }`}
                    >
                      {score.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 text-sm">{score.name}</h4>
                        {isRank1 && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.2 rounded-md">
                            #1
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 block">
                        {score.departments.join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Letter Grade Pill */}
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black border ${
                      score.compositeScore >= 95
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : score.compositeScore >= 90
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}>
                      Grade {score.letterGrade}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 block mt-0.5 font-bold">
                      {score.compositeScore}/100
                    </span>
                  </div>
                </div>

                {/* Team stats banner */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 bg-slate-50 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Engineers</span>
                    <span className="font-bold text-slate-800">{score.teamSize}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Adherence</span>
                    <span className="font-bold text-indigo-600">{score.adherenceRate}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Coverage</span>
                    <span className="font-bold text-emerald-600">{score.coverageFillRate}%</span>
                  </div>
                </div>

                {/* Shift Tier Consistency Breakdown */}
                <div className="mt-4 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Shift Tier Consistency
                  </span>

                  {/* Morning AM */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Morning AM</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800">{score.morningConsistency}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${score.morningConsistency}%` }}
                    />
                  </div>

                  {/* Swing PM */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Sunset className="w-3.5 h-3.5 text-orange-500" />
                      <span>Swing PM</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800">{score.swingConsistency}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-500 h-full rounded-full"
                      style={{ width: `${score.swingConsistency}%` }}
                    />
                  </div>

                  {/* Overnight Graveyard */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Overnight</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800">{score.nightConsistency}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${score.nightConsistency}%` }}
                    />
                  </div>
                </div>

                {/* Key strength badge */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium text-[11px]">Primary Strength:</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 text-[10px]">
                    {score.keyStrength}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
