import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Employee,
  AttendanceRecord,
  TimeEntry,
  DayOfWeek,
  FilterOptions,
  AttendanceStatus,
  ClockStatus
} from '../types';
import {
  parseInitialEmployees,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_TIME_ENTRIES,
  timeStringToMinutes,
  calculateShiftDurationHours
} from '../data/teamData';

interface ScheduleContextType {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  timeEntries: TimeEntry[];
  selectedDay: DayOfWeek;
  setSelectedDay: (day: DayOfWeek) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  currentTime: Date;
  timezone: string;
  setTimezone: (tz: string) => void;
  
  // Attendance actions
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id' | 'createdAt'>) => void;
  updateAttendanceStatus: (id: string, status: AttendanceStatus) => void;
  deleteAttendanceRecord: (id: string) => void;
  getEmployeeAttendanceToday: (employeeId: string, date?: string) => AttendanceRecord[];

  // Clock Actions
  clockIn: (employeeId: string, customNote?: string) => TimeEntry;
  clockOut: (employeeId: string, customNote?: string) => TimeEntry | undefined;
  toggleBreak: (employeeId: string) => TimeEntry | undefined;
  getCurrentTimeEntry: (employeeId: string, date?: string) => TimeEntry | undefined;
  getTimeEntriesForEmployee: (employeeId: string) => TimeEntry[];

  // Schedule & Data Admin
  updateEmployeeSchedule: (empId: string, day: DayOfWeek, start: string, end: string, isOff: boolean) => void;
  resetToDefaultData: () => void;
  importCSVData: (csvText: string) => { success: boolean; count: number; error?: string };
  exportCSVData: () => string;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

const EMPLOYEES_STORAGE_KEY = 'sd_schedule_employees_v2';
const ATTENDANCE_STORAGE_KEY = 'sd_schedule_attendance_v2';
const TIME_ENTRIES_STORAGE_KEY = 'sd_schedule_time_entries_v2';

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Employees state
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return parseInitialEmployees();
  });

  // 2. Attendance records state
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_ATTENDANCE_RECORDS;
  });

  // 3. Time entries state
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(() => {
    try {
      const saved = localStorage.getItem(TIME_ENTRIES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_TIME_ENTRIES;
  });

  // Current live system clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [timezone, setTimezone] = useState<string>('local');

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's date string YYYY-MM-DD
  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDayOfWeekFromDate = (dateStr: string): DayOfWeek => {
    const d = new Date(dateStr + 'T12:00:00');
    const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[d.getDay()];
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getDayOfWeekFromDate(getTodayDateString()));

  // Update selected day whenever date changes
  useEffect(() => {
    setSelectedDay(getDayOfWeekFromDate(selectedDate));
  }, [selectedDate]);

  // Filters
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    department: 'all',
    country: 'all',
    supervisor: 'all',
    statusFilter: 'all',
    dayOfWeek: selectedDay,
  });

  useEffect(() => {
    setFilters(prev => ({ ...prev, dayOfWeek: selectedDay }));
  }, [selectedDay]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem(TIME_ENTRIES_STORAGE_KEY, JSON.stringify(timeEntries));
  }, [timeEntries]);

  // Attendance helpers
  const addAttendanceRecord = (recordData: Omit<AttendanceRecord, 'id' | 'createdAt'>) => {
    const newRecord: AttendanceRecord = {
      ...recordData,
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    setAttendanceRecords(prev => [newRecord, ...prev]);
  };

  const updateAttendanceStatus = (id: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, status } : r))
    );
  };

  const deleteAttendanceRecord = (id: string) => {
    setAttendanceRecords(prev => prev.filter(r => r.id !== id));
  };

  const getEmployeeAttendanceToday = (employeeId: string, date: string = selectedDate) => {
    return attendanceRecords.filter(r => {
      if (r.employeeId !== employeeId) return false;
      if (r.date === date) return true;
      if (r.endDate && r.date <= date && r.endDate >= date) return true;
      return false;
    });
  };

  // Time clock operations
  const getCurrentTimeEntry = (employeeId: string, date: string = selectedDate): TimeEntry | undefined => {
    return timeEntries.find(t => t.employeeId === employeeId && t.date === date);
  };

  const getTimeEntriesForEmployee = (employeeId: string): TimeEntry[] => {
    return timeEntries.filter(t => t.employeeId === employeeId).sort((a, b) => b.date.localeCompare(a.date));
  };

  const clockIn = (employeeId: string, customNote?: string): TimeEntry => {
    const emp = employees.find(e => e.id === employeeId);
    const today = getTodayDateString();
    const currentDayOfWeek = getDayOfWeekFromDate(today);
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS

    const dayShift = emp?.schedule[currentDayOfWeek];
    const scheduledShift = dayShift && !dayShift.isOff ? `${dayShift.start} - ${dayShift.end}` : 'Unscheduled';
    const scheduledHours = dayShift && !dayShift.isOff ? calculateShiftDurationHours(dayShift.start, dayShift.end) : 8;

    // Calculate tardiness if shift start is known
    let isTardy = false;
    let minutesTardy = 0;
    if (dayShift && !dayShift.isOff) {
      const scheduledStartMins = timeStringToMinutes(dayShift.start);
      const actualClockMins = now.getHours() * 60 + now.getMinutes();
      // Grace period of 5 minutes
      if (actualClockMins > scheduledStartMins + 5) {
        isTardy = true;
        minutesTardy = actualClockMins - scheduledStartMins;

        // Auto log tardiness record if not already recorded
        const hasTardyRecord = attendanceRecords.some(
          r => r.employeeId === employeeId && r.date === today && r.type === 'Tardiness'
        );
        if (!hasTardyRecord && emp) {
          addAttendanceRecord({
            employeeId: emp.id,
            employeeName: emp.name,
            department: emp.department,
            type: 'Tardiness',
            date: today,
            status: 'Recorded',
            minutesLate: minutesTardy,
            scheduledTime: dayShift.start,
            actualTime: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
            reason: customNote || 'Clocked in past scheduled start time',
            supervisorApprovedBy: emp.supervisor,
            notes: `Clock in at ${timeStr}`
          });
        }
      }
    }

    const existingEntry = getCurrentTimeEntry(employeeId, today);
    let newEntry: TimeEntry;

    if (existingEntry) {
      newEntry = {
        ...existingEntry,
        clockInTime: existingEntry.clockInTime || timeStr,
        status: 'clocked_in',
        notes: customNote ? `${existingEntry.notes || ''} | ${customNote}` : existingEntry.notes
      };
      setTimeEntries(prev => prev.map(t => (t.id === existingEntry.id ? newEntry : t)));
    } else {
      newEntry = {
        id: `time-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        employeeId,
        date: today,
        dayOfWeek: currentDayOfWeek,
        clockInTime: timeStr,
        scheduledShift,
        scheduledHours,
        totalBreakMinutes: 0,
        totalHoursWorked: 0,
        isTardy,
        minutesTardy,
        status: 'clocked_in',
        notes: customNote || ''
      };
      setTimeEntries(prev => [newEntry, ...prev]);
    }

    return newEntry;
  };

  const clockOut = (employeeId: string, customNote?: string): TimeEntry | undefined => {
    const today = getTodayDateString();
    const entry = getCurrentTimeEntry(employeeId, today);
    if (!entry) return undefined;

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    // calculate total hours worked
    const [inH, inM] = entry.clockInTime.split(':').map(Number);
    const clockInMins = inH * 60 + inM;
    const clockOutMins = now.getHours() * 60 + now.getMinutes();
    let durationMins = clockOutMins - clockInMins - (entry.totalBreakMinutes || 0);
    if (durationMins < 0) durationMins += 1440; // overnight
    const totalHours = Number((Math.max(0, durationMins) / 60).toFixed(2));

    const updatedEntry: TimeEntry = {
      ...entry,
      clockOutTime: timeStr,
      status: 'clocked_out',
      totalHoursWorked: totalHours,
      notes: customNote ? `${entry.notes || ''} | Out: ${customNote}` : entry.notes
    };

    setTimeEntries(prev => prev.map(t => (t.id === entry.id ? updatedEntry : t)));
    return updatedEntry;
  };

  const toggleBreak = (employeeId: string): TimeEntry | undefined => {
    const today = getTodayDateString();
    const entry = getCurrentTimeEntry(employeeId, today);
    if (!entry) return undefined;

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    let updatedEntry: TimeEntry;
    if (entry.status === 'clocked_in') {
      // Start break
      updatedEntry = {
        ...entry,
        breakStartTime: timeStr,
        status: 'on_break'
      };
    } else if (entry.status === 'on_break') {
      // End break
      let breakDuration = 0;
      if (entry.breakStartTime) {
        const [bH, bM] = entry.breakStartTime.split(':').map(Number);
        const bStartMins = bH * 60 + bM;
        const bEndMins = now.getHours() * 60 + now.getMinutes();
        breakDuration = Math.max(0, bEndMins - bStartMins);
      }
      updatedEntry = {
        ...entry,
        breakEndTime: timeStr,
        totalBreakMinutes: (entry.totalBreakMinutes || 0) + breakDuration,
        status: 'clocked_in'
      };
    } else {
      return entry;
    }

    setTimeEntries(prev => prev.map(t => (t.id === entry.id ? updatedEntry : t)));
    return updatedEntry;
  };

  const updateEmployeeSchedule = (
    empId: string,
    day: DayOfWeek,
    start: string,
    end: string,
    isOff: boolean
  ) => {
    setEmployees(prev =>
      prev.map(emp => {
        if (emp.id !== empId) return emp;
        return {
          ...emp,
          schedule: {
            ...emp.schedule,
            [day]: {
              start: isOff ? 'Off' : start,
              end: isOff ? 'Off' : end,
              isOff
            }
          }
        };
      })
    );
  };

  const resetToDefaultData = () => {
    const defaultEmps = parseInitialEmployees();
    setEmployees(defaultEmps);
    setAttendanceRecords(INITIAL_ATTENDANCE_RECORDS);
    setTimeEntries(INITIAL_TIME_ENTRIES);
    localStorage.removeItem(EMPLOYEES_STORAGE_KEY);
    localStorage.removeItem(ATTENDANCE_STORAGE_KEY);
    localStorage.removeItem(TIME_ENTRIES_STORAGE_KEY);
  };

  const importCSVData = (csvText: string) => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        return { success: false, count: 0, error: 'CSV file is empty or missing data rows.' };
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const deptIdx = headers.findIndex(h => h.includes('dept') || h.includes('department'));
      const countryIdx = headers.findIndex(h => h.includes('country'));
      const supIdx = headers.findIndex(h => h.includes('super'));
      const mgrIdx = headers.findIndex(h => h.includes('manager'));

      if (nameIdx === -1 || emailIdx === -1) {
        return { success: false, count: 0, error: 'Missing required "Name" or "Email" columns.' };
      }

      const imported: Employee[] = [];
      const days: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(c => c.trim());
        if (row.length < 2 || !row[nameIdx]) continue;

        const name = row[nameIdx];
        const email = row[emailIdx] || `${name.toLowerCase().replace(/\s+/g, '')}@singledigits.com`;
        const department = deptIdx !== -1 ? row[deptIdx] : 'General';
        const country = countryIdx !== -1 ? row[countryIdx] : 'United States';
        const supervisor = supIdx !== -1 ? row[supIdx] : 'Manager';
        const manager = mgrIdx !== -1 ? row[mgrIdx] : 'Tom Hardy';

        // find schedule columns MonStart, MonEnd, etc.
        const scheduleObj: Record<DayOfWeek, { start: string; end: string; isOff: boolean }> = {
          Mon: { start: '9:00', end: '18:00', isOff: false },
          Tue: { start: '9:00', end: '18:00', isOff: false },
          Wed: { start: '9:00', end: '18:00', isOff: false },
          Thu: { start: '9:00', end: '18:00', isOff: false },
          Fri: { start: '9:00', end: '18:00', isOff: false },
          Sat: { start: 'Off', end: 'Off', isOff: true },
          Sun: { start: 'Off', end: 'Off', isOff: true }
        };

        days.forEach(d => {
          const sIdx = headers.findIndex(h => h.includes(d.toLowerCase()) && h.includes('start'));
          const eIdx = headers.findIndex(h => h.includes(d.toLowerCase()) && h.includes('end'));
          if (sIdx !== -1 && eIdx !== -1 && row[sIdx] && row[eIdx]) {
            const isOff = row[sIdx].toLowerCase() === 'off' || row[eIdx].toLowerCase() === 'off';
            scheduleObj[d] = {
              start: row[sIdx],
              end: row[eIdx],
              isOff
            };
          }
        });

        let daysOffCount = 0;
        days.forEach(d => {
          if (scheduleObj[d].isOff) daysOffCount++;
        });

        imported.push({
          id: `emp-imp-${i}`,
          name,
          email,
          username: email.split('@')[0],
          department,
          country,
          supervisor,
          manager,
          daysOffCount,
          role: 'employee',
          schedule: scheduleObj as any
        });
      }

      if (imported.length > 0) {
        setEmployees(imported);
        return { success: true, count: imported.length };
      }
      return { success: false, count: 0, error: 'No valid employee rows parsed.' };
    } catch (err: any) {
      return { success: false, count: 0, error: err?.message || 'Error parsing CSV' };
    }
  };

  const exportCSVData = () => {
    const headers = [
      'Name',
      'Email Address',
      'Department',
      'Country',
      'Supervisor',
      'Manager',
      'MonStart', 'MonEnd',
      'TueStart', 'TueEnd',
      'WedStart', 'WedEnd',
      'ThuStart', 'ThuEnd',
      'FriStart', 'FriEnd',
      'SatStart', 'SatEnd',
      'SunStart', 'SunEnd',
      'Days off Check'
    ];

    const rows = employees.map(emp => [
      emp.name,
      emp.email,
      emp.department,
      emp.country,
      emp.supervisor,
      emp.manager,
      emp.schedule.Mon.start, emp.schedule.Mon.end,
      emp.schedule.Tue.start, emp.schedule.Tue.end,
      emp.schedule.Wed.start, emp.schedule.Wed.end,
      emp.schedule.Thu.start, emp.schedule.Thu.end,
      emp.schedule.Fri.start, emp.schedule.Fri.end,
      emp.schedule.Sat.start, emp.schedule.Sat.end,
      emp.schedule.Sun.start, emp.schedule.Sun.end,
      emp.daysOffCount
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  return (
    <ScheduleContext.Provider
      value={{
        employees,
        attendanceRecords,
        timeEntries,
        selectedDay,
        setSelectedDay,
        selectedDate,
        setSelectedDate,
        filters,
        setFilters,
        currentTime,
        timezone,
        setTimezone,
        addAttendanceRecord,
        updateAttendanceStatus,
        deleteAttendanceRecord,
        getEmployeeAttendanceToday,
        clockIn,
        clockOut,
        toggleBreak,
        getCurrentTimeEntry,
        getTimeEntriesForEmployee,
        updateEmployeeSchedule,
        resetToDefaultData,
        importCSVData,
        exportCSVData
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
