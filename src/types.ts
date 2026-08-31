export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface DayShift {
  start: string; // e.g. "9:00", "16:00", "23:00", "Off"
  end: string;   // e.g. "18:00", "1:00", "8:00", "Off"
  isOff: boolean;
}

export interface WeeklySchedule {
  Mon: DayShift;
  Tue: DayShift;
  Wed: DayShift;
  Thu: DayShift;
  Fri: DayShift;
  Sat: DayShift;
  Sun: DayShift;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  country: string;
  supervisor: string;
  manager: string;
  schedule: WeeklySchedule;
  daysOffCount: number;
  avatarColor?: string;
  username: string;
  role?: 'employee' | 'supervisor' | 'manager' | 'admin';
}

export type AttendanceType = 'PTO' | 'Absence' | 'Tardiness' | 'Sick Leave' | 'Half Day' | 'Emergency' | 'Holiday';

export type AttendanceStatus = 'Approved' | 'Pending' | 'Recorded' | 'Excused' | 'Unexcused';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: AttendanceType;
  date: string; // YYYY-MM-DD
  endDate?: string; // for multi-day PTO
  status: AttendanceStatus;
  minutesLate?: number;
  scheduledTime?: string;
  actualTime?: string;
  reason: string;
  supervisorApprovedBy?: string;
  createdAt: string;
  notes?: string;
}

export type ClockStatus = 'not_clocked_in' | 'clocked_in' | 'on_break' | 'clocked_out';

export interface TimeEntry {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  clockInTime: string; // HH:MM:SS
  clockOutTime?: string; // HH:MM:SS
  breakStartTime?: string;
  breakEndTime?: string;
  totalBreakMinutes: number;
  totalHoursWorked: number;
  scheduledHours: number;
  scheduledShift: string;
  isTardy: boolean;
  minutesTardy: number;
  notes?: string;
  status: ClockStatus;
}

export interface FilterOptions {
  search: string;
  department: string;
  country: string;
  supervisor: string;
  statusFilter: 'all' | 'working' | 'off' | 'pto' | 'tardy' | 'absent';
  dayOfWeek: DayOfWeek;
}

export type ViewTab = 'daily_timeline' | 'weekly_matrix' | 'attendance_tracker' | 'timecard' | 'analytics';
