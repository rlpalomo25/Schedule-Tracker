import { Employee, DayOfWeek, AttendanceRecord, DayShift } from '../types';

export interface ShiftConflictInfo {
  hasConflict: boolean;
  conflictType?: 'PTO' | 'Absence' | 'Sick Leave' | 'Emergency' | 'Holiday' | 'Other';
  conflictingRecord?: AttendanceRecord;
  scheduledShift?: DayShift;
  date: string;
  day: DayOfWeek;
  employeeId: string;
  employeeName: string;
  message: string;
  severity: 'warning' | 'critical' | 'none';
}

const DAYS_OF_WEEK: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Given any date string (YYYY-MM-DD), returns a map of DayOfWeek -> YYYY-MM-DD for the corresponding Monday-Sunday week.
 */
export function getDatesForWeek(baseDateStr: string): Record<DayOfWeek, string> {
  const baseDate = new Date(baseDateStr + 'T12:00:00');
  const dayIdx = baseDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Calculate distance from Monday (Mon = 0 distance, Sun = 6 distance)
  const mondayOffset = dayIdx === 0 ? -6 : 1 - dayIdx;
  
  const mondayDate = new Date(baseDate);
  mondayDate.setDate(baseDate.getDate() + mondayOffset);

  const result: Partial<Record<DayOfWeek, string>> = {};

  DAYS_OF_WEEK.forEach((dayName, idx) => {
    const current = new Date(mondayDate);
    current.setDate(mondayDate.getDate() + idx);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    result[dayName] = `${y}-${m}-${d}`;
  });

  return result as Record<DayOfWeek, string>;
}

/**
 * Checks if a specific date falls within an AttendanceRecord's date range.
 */
export function isDateWithinRecord(dateStr: string, record: AttendanceRecord): boolean {
  if (record.date === dateStr) return true;
  if (record.endDate && record.date <= dateStr && record.endDate >= dateStr) {
    return true;
  }
  return false;
}

/**
 * Checks if an employee has a shift overlap conflict with approved PTO or absence on a specific day/date.
 */
export function checkShiftOverlapWithAttendance(
  employee: Employee,
  day: DayOfWeek,
  dateStr: string,
  attendanceRecords: AttendanceRecord[]
): ShiftConflictInfo {
  const shift = employee.schedule[day];
  const isShiftActive = shift && !shift.isOff && shift.start !== 'Off' && shift.end !== 'Off';

  if (!isShiftActive) {
    return {
      hasConflict: false,
      date: dateStr,
      day,
      employeeId: employee.id,
      employeeName: employee.name,
      message: 'No shift scheduled',
      severity: 'none',
    };
  }

  // Find all attendance records for this employee covering this date
  const records = attendanceRecords.filter(r => {
    if (r.employeeId !== employee.id) return false;
    return isDateWithinRecord(dateStr, r);
  });

  // Check for approved PTO
  const approvedPTO = records.find(
    r => r.type === 'PTO' && (r.status === 'Approved' || r.status === 'Pending')
  );

  // Check for Absences / Sick Leave / Emergency
  const absenceRecord = records.find(
    r => r.type === 'Absence' || r.type === 'Sick Leave' || r.type === 'Emergency' || r.type === 'Holiday'
  );

  if (approvedPTO) {
    const isApproved = approvedPTO.status === 'Approved';
    return {
      hasConflict: true,
      conflictType: 'PTO',
      conflictingRecord: approvedPTO,
      scheduledShift: shift,
      date: dateStr,
      day,
      employeeId: employee.id,
      employeeName: employee.name,
      message: `${isApproved ? 'Approved' : 'Pending'} PTO (${approvedPTO.reason || 'Vacation'}) overlaps with scheduled shift ${shift.start} - ${shift.end}`,
      severity: isApproved ? 'warning' : 'warning',
    };
  }

  if (absenceRecord) {
    return {
      hasConflict: true,
      conflictType: absenceRecord.type as any,
      conflictingRecord: absenceRecord,
      scheduledShift: shift,
      date: dateStr,
      day,
      employeeId: employee.id,
      employeeName: employee.name,
      message: `${absenceRecord.type} (${absenceRecord.reason || 'Unplanned'}) recorded while scheduled for shift ${shift.start} - ${shift.end}`,
      severity: 'critical',
    };
  }

  return {
    hasConflict: false,
    date: dateStr,
    day,
    employeeId: employee.id,
    employeeName: employee.name,
    message: 'Shift OK',
    severity: 'none',
  };
}

/**
 * Returns all schedule overlap conflicts for the whole roster on a given date and day.
 */
export function getAllRosterConflictsForDate(
  employees: Employee[],
  day: DayOfWeek,
  dateStr: string,
  attendanceRecords: AttendanceRecord[]
): ShiftConflictInfo[] {
  const conflicts: ShiftConflictInfo[] = [];

  employees.forEach(emp => {
    const conflict = checkShiftOverlapWithAttendance(emp, day, dateStr, attendanceRecords);
    if (conflict.hasConflict) {
      conflicts.push(conflict);
    }
  });

  return conflicts;
}

/**
 * Returns all schedule overlap conflicts across the entire 7-day week for all employees.
 */
export function getAllWeeklyRosterConflicts(
  employees: Employee[],
  baseDateStr: string,
  attendanceRecords: AttendanceRecord[]
): ShiftConflictInfo[] {
  const weekDates = getDatesForWeek(baseDateStr);
  const conflicts: ShiftConflictInfo[] = [];

  DAYS_OF_WEEK.forEach(day => {
    const dateStr = weekDates[day];
    employees.forEach(emp => {
      const conflict = checkShiftOverlapWithAttendance(emp, day, dateStr, attendanceRecords);
      if (conflict.hasConflict) {
        conflicts.push(conflict);
      }
    });
  });

  return conflicts;
}
