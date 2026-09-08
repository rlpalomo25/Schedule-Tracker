import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Employee,
  AttendanceRecord,
  TimeEntry,
  DayOfWeek,
  FilterOptions,
  AttendanceStatus,
  ClockStatus,
  ShiftSwapRequest,
  SwapStatus
} from '../types';
import {
  parseInitialEmployees,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_TIME_ENTRIES,
  INITIAL_SHIFT_SWAPS,
  timeStringToMinutes,
  calculateShiftDurationHours
} from '../data/teamData';
import { parseXLSXFile, parseCSVString } from '../utils/scheduleImport';

interface ScheduleContextType {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  timeEntries: TimeEntry[];
  shiftSwapRequests: ShiftSwapRequest[];
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

  // Shift Swaps & Coverage Requests
  createShiftSwapRequest: (data: Omit<ShiftSwapRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => ShiftSwapRequest;
  respondToShiftSwapRequest: (requestId: string, accept: boolean, peerNote?: string) => void;
  claimOpenCoverageRequest: (requestId: string, claimantEmployee: Employee) => void;
  supervisorReviewSwap: (requestId: string, approved: boolean, supervisorName: string, notes?: string) => void;
  cancelShiftSwapRequest: (requestId: string) => void;

  // Schedule & Data Admin
  updateEmployeeSchedule: (empId: string, day: DayOfWeek, start: string, end: string, isOff: boolean) => void;
  updateEmployeePtoAllowance: (empId: string, allowance: number) => void;
  resetToDefaultData: () => void;
  importCSVData: (csvText: string) => { success: boolean; count: number; error?: string };
  importXLSXData: (buffer: ArrayBuffer) => { success: boolean; count: number; error?: string };
  exportCSVData: () => string;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

const EMPLOYEES_STORAGE_KEY = 'sd_schedule_employees_v3';
const ATTENDANCE_STORAGE_KEY = 'sd_schedule_attendance_v3';
const TIME_ENTRIES_STORAGE_KEY = 'sd_schedule_time_entries_v3';
const SHIFT_SWAPS_STORAGE_KEY = 'sd_schedule_shift_swaps_v3';

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Employees state
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(EMPLOYEES_STORAGE_KEY) || localStorage.getItem('sd_schedule_employees_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((emp: Employee) => ({
            ...emp,
            ptoAllowance: emp.ptoAllowance || (emp.role === 'manager' ? 25 : emp.role === 'supervisor' ? 22 : 20)
          }));
        }
      }
    } catch {
      // fallback
    }
    return parseInitialEmployees();
  });

  // 2. Attendance records state
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 20) {
          return parsed;
        }
      }
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

  // 4. Shift Swap & Coverage Requests state
  const [shiftSwapRequests, setShiftSwapRequests] = useState<ShiftSwapRequest[]>(() => {
    try {
      const saved = localStorage.getItem(SHIFT_SWAPS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_SHIFT_SWAPS;
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

  useEffect(() => {
    localStorage.setItem(SHIFT_SWAPS_STORAGE_KEY, JSON.stringify(shiftSwapRequests));
  }, [shiftSwapRequests]);

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

  // Shift Swaps & Coverage Request operations
  const createShiftSwapRequest = (
    data: Omit<ShiftSwapRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): ShiftSwapRequest => {
    const nowIso = new Date().toISOString();
    // If targeted at a coworker, goes to 'pending_coworker'. If open pool, also 'pending_coworker' to be claimed.
    const newReq: ShiftSwapRequest = {
      ...data,
      id: `swap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'pending_coworker',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    setShiftSwapRequests(prev => [newReq, ...prev]);
    return newReq;
  };

  const respondToShiftSwapRequest = (
    requestId: string,
    accept: boolean,
    peerNote?: string
  ) => {
    const nowIso = new Date().toISOString();
    setShiftSwapRequests(prev =>
      prev.map(r => {
        if (r.id !== requestId) return r;
        if (accept) {
          // Moves immediately to supervisor for one-click review & approval!
          return {
            ...r,
            status: 'pending_supervisor',
            peerAcceptedAt: nowIso,
            peerResponseNote: peerNote || 'Coworker accepted the shift trade',
            updatedAt: nowIso
          };
        } else {
          return {
            ...r,
            status: 'rejected',
            peerResponseNote: peerNote || 'Coworker declined the shift trade',
            updatedAt: nowIso
          };
        }
      })
    );
  };

  const claimOpenCoverageRequest = (
    requestId: string,
    claimantEmployee: Employee
  ) => {
    const nowIso = new Date().toISOString();
    setShiftSwapRequests(prev =>
      prev.map(r => {
        if (r.id !== requestId) return r;
        return {
          ...r,
          targetEmployeeId: claimantEmployee.id,
          targetEmployeeName: claimantEmployee.name,
          isOpenPool: false,
          status: 'pending_supervisor', // Forwarded to supervisor for one-click approval!
          peerAcceptedAt: nowIso,
          peerResponseNote: `Claimed by ${claimantEmployee.name} (${claimantEmployee.department})`,
          updatedAt: nowIso
        };
      })
    );
  };

  const supervisorReviewSwap = (
    requestId: string,
    approved: boolean,
    supervisorName: string,
    notes?: string
  ) => {
    const swapReq = shiftSwapRequests.find(r => r.id === requestId);
    if (!swapReq) return;

    const nowIso = new Date().toISOString();
    const newStatus: SwapStatus = approved ? 'approved' : 'rejected';

    setShiftSwapRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? {
              ...r,
              status: newStatus,
              supervisorName,
              supervisorDecisionAt: nowIso,
              supervisorNotes: notes || (approved ? `Approved by ${supervisorName}` : `Declined by ${supervisorName}`),
              updatedAt: nowIso
            }
          : r
      )
    );

    // If approved, atomically update employees' live schedules!
    if (approved) {
      setEmployees(prev => {
        return prev.map(emp => {
          // Requester update
          if (emp.id === swapReq.requesterId) {
            if (swapReq.requestType === 'swap' && swapReq.targetShift) {
              // Requester works target colleague's shift
              return {
                ...emp,
                schedule: {
                  ...emp.schedule,
                  [swapReq.requesterDay]: { ...swapReq.targetShift }
                }
              };
            } else if (swapReq.requestType === 'coverage') {
              // Requester's shift is covered -> mark Off for requesterDay
              return {
                ...emp,
                schedule: {
                  ...emp.schedule,
                  [swapReq.requesterDay]: { start: 'Off', end: 'Off', isOff: true }
                }
              };
            }
          }

          // Target (covering or trade partner) employee update
          if (swapReq.targetEmployeeId && emp.id === swapReq.targetEmployeeId) {
            if (swapReq.requestType === 'swap' && swapReq.targetDay) {
              // Target employee works requester's original shift on targetDay
              return {
                ...emp,
                schedule: {
                  ...emp.schedule,
                  [swapReq.targetDay]: { ...swapReq.requesterShift }
                }
              };
            } else if (swapReq.requestType === 'coverage') {
              // Target employee covers requester's shift on requesterDay
              return {
                ...emp,
                schedule: {
                  ...emp.schedule,
                  [swapReq.requesterDay]: { ...swapReq.requesterShift }
                }
              };
            }
          }

          return emp;
        });
      });

      // Also record an audit attendance record
      addAttendanceRecord({
        employeeId: swapReq.requesterId,
        employeeName: swapReq.requesterName,
        department: swapReq.requesterDepartment,
        type: 'PTO',
        date: swapReq.requesterDate,
        status: 'Approved',
        reason: `Shift ${swapReq.requestType === 'swap' ? 'Swap' : 'Coverage'} with ${swapReq.targetEmployeeName || 'Teammate'}: ${swapReq.reason}`,
        supervisorApprovedBy: supervisorName,
        notes: notes || `Approved by ${supervisorName}. Shifts updated automatically.`
      });
    }
  };

  const cancelShiftSwapRequest = (requestId: string) => {
    const nowIso = new Date().toISOString();
    setShiftSwapRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? { ...r, status: 'cancelled', updatedAt: nowIso }
          : r
      )
    );
  };

  const updateEmployeePtoAllowance = (empId: string, allowance: number) => {
    setEmployees(prev =>
      prev.map(emp => {
        if (emp.id !== empId) return emp;
        return {
          ...emp,
          ptoAllowance: Math.max(0, allowance)
        };
      })
    );
  };

  const resetToDefaultData = () => {
    const defaultEmps = parseInitialEmployees();
    setEmployees(defaultEmps);
    setAttendanceRecords(INITIAL_ATTENDANCE_RECORDS);
    setTimeEntries(INITIAL_TIME_ENTRIES);
    setShiftSwapRequests(INITIAL_SHIFT_SWAPS);
    localStorage.removeItem(EMPLOYEES_STORAGE_KEY);
    localStorage.removeItem(ATTENDANCE_STORAGE_KEY);
    localStorage.removeItem(TIME_ENTRIES_STORAGE_KEY);
    localStorage.removeItem(SHIFT_SWAPS_STORAGE_KEY);
  };

  const importCSVData = (csvText: string) => {
    try {
      const result = parseCSVString(csvText);
      if (result.success && result.employees && result.employees.length > 0) {
        setEmployees(result.employees);
        return { success: true, count: result.count };
      }
      return { success: false, count: 0, error: result.error || 'Failed to parse CSV schedule.' };
    } catch (err: any) {
      return { success: false, count: 0, error: err?.message || 'Error parsing CSV schedule' };
    }
  };

  const importXLSXData = (buffer: ArrayBuffer) => {
    try {
      const result = parseXLSXFile(buffer);
      if (result.success && result.employees && result.employees.length > 0) {
        setEmployees(result.employees);
        return { success: true, count: result.count };
      }
      return { success: false, count: 0, error: result.error || 'Failed to parse Excel schedule.' };
    } catch (err: any) {
      return { success: false, count: 0, error: err?.message || 'Error parsing Excel schedule file' };
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
        shiftSwapRequests,
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
        createShiftSwapRequest,
        respondToShiftSwapRequest,
        claimOpenCoverageRequest,
        supervisorReviewSwap,
        cancelShiftSwapRequest,
        updateEmployeeSchedule,
        updateEmployeePtoAllowance,
        resetToDefaultData,
        importCSVData,
        importXLSXData,
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
