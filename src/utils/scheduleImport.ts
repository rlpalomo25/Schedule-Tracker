import * as XLSX from 'xlsx';
import { Employee, DayOfWeek } from '../types';

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-cyan-600',
  'bg-violet-600',
  'bg-orange-600'
];

export interface ImportScheduleResult {
  success: boolean;
  count: number;
  employees?: Employee[];
  error?: string;
}

// Convert Excel decimal or string times to standard HH:mm or "Off"
function formatShiftTime(val: any): string {
  if (val === undefined || val === null || val === '') return 'Off';
  const str = String(val).trim();
  if (str.toLowerCase() === 'off') return 'Off';

  // If numeric (e.g. Excel time fraction like 0.375 -> 9:00)
  if (typeof val === 'number' && !isNaN(val)) {
    if (val >= 0 && val <= 1) {
      const totalMinutes = Math.round(val * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hours}:${mins < 10 ? '0' : ''}${mins}`;
    }
    // If it's an integer like 9 or 18
    if (val >= 0 && val <= 24) {
      return `${Math.floor(val)}:00`;
    }
  }

  // If standard string time
  return str;
}

export function parseScheduleMatrix(data: (string | number)[][]): ImportScheduleResult {
  if (!data || data.length < 2) {
    return { success: false, count: 0, error: 'Spreadsheet has no data rows.' };
  }

  // Find header row (check first 5 rows to be flexible with title banners)
  let headerRowIdx = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i].map(c => String(c || '').trim().toLowerCase());
    if (row.some(h => h.includes('name')) && (row.some(h => h.includes('email')) || row.some(h => h.includes('dept') || h.includes('mon')))) {
      headerRowIdx = i;
      headers = row;
      break;
    }
  }

  if (headerRowIdx === -1) {
    // Fallback to first row
    headerRowIdx = 0;
    headers = data[0].map(c => String(c || '').trim().toLowerCase());
  }

  const nameIdx = headers.findIndex(h => h.includes('name'));
  const emailIdx = headers.findIndex(h => h.includes('email'));
  const deptIdx = headers.findIndex(h => h.includes('dept') || h.includes('department'));
  const countryIdx = headers.findIndex(h => h.includes('country') || h.includes('location'));
  const supIdx = headers.findIndex(h => h.includes('super') || h.includes('lead'));
  const mgrIdx = headers.findIndex(h => h.includes('manager'));
  const roleIdx = headers.findIndex(h => h === 'role');
  const ptoIdx = headers.findIndex(h => h.includes('pto') || h.includes('allowance'));

  if (nameIdx === -1) {
    return { success: false, count: 0, error: 'Could not find a "Name" column in the header row.' };
  }

  const days: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const importedEmployees: Employee[] = [];

  for (let r = headerRowIdx + 1; r < data.length; r++) {
    const row = data[r];
    if (!row || row.length === 0) continue;

    const rawName = String(row[nameIdx] || '').trim();
    if (!rawName || rawName.toLowerCase() === 'name' || rawName.toLowerCase() === 'total') continue;

    const email = emailIdx !== -1 && row[emailIdx]
      ? String(row[emailIdx]).trim()
      : `${rawName.toLowerCase().replace(/[^a-z0-9]/g, '')}@singledigits.com`;

    const department = deptIdx !== -1 && row[deptIdx] ? String(row[deptIdx]).trim() : 'General Support';
    const country = countryIdx !== -1 && row[countryIdx] ? String(row[countryIdx]).trim() : 'United States';
    const supervisor = supIdx !== -1 && row[supIdx] ? String(row[supIdx]).trim() : 'Tom Hardy';
    const manager = mgrIdx !== -1 && row[mgrIdx] ? String(row[mgrIdx]).trim() : 'Tom Hardy';

    let role: Employee['role'] = 'employee';
    if (roleIdx !== -1 && row[roleIdx]) {
      const rStr = String(row[roleIdx]).toLowerCase();
      if (rStr.includes('mgr') || rStr.includes('manager')) role = 'manager';
      else if (rStr.includes('super') || rStr.includes('lead')) role = 'supervisor';
    } else {
      if (rawName === 'Tom Hardy') role = 'manager';
      else if (['Andre Villaran', 'Gabby', 'Hector Salazar', 'Moha Belal', 'Roberto Luarca', 'Scott Edwards', 'Sergio Hernandez'].includes(rawName)) {
        role = 'supervisor';
      }
    }

    const ptoQuota = ptoIdx !== -1 && !isNaN(Number(row[ptoIdx]))
      ? Number(row[ptoIdx])
      : role === 'manager' ? 25 : role === 'supervisor' ? 22 : 20;

    // Parse schedules
    const scheduleObj: Record<DayOfWeek, { start: string; end: string; isOff: boolean }> = {
      Mon: { start: '9:00', end: '18:00', isOff: false },
      Tue: { start: '9:00', end: '18:00', isOff: false },
      Wed: { start: '9:00', end: '18:00', isOff: false },
      Thu: { start: '9:00', end: '18:00', isOff: false },
      Fri: { start: '9:00', end: '18:00', isOff: false },
      Sat: { start: 'Off', end: 'Off', isOff: true },
      Sun: { start: 'Off', end: 'Off', isOff: true }
    };

    days.forEach(day => {
      const dLower = day.toLowerCase();
      // Try two-column convention: MonStart and MonEnd
      const sIdx = headers.findIndex(h => h.includes(dLower) && (h.includes('start') || h.includes('in') || h.includes('begin')));
      const eIdx = headers.findIndex(h => h.includes(dLower) && (h.includes('end') || h.includes('out')));

      if (sIdx !== -1 && eIdx !== -1 && row[sIdx] !== undefined && row[eIdx] !== undefined) {
        const startStr = formatShiftTime(row[sIdx]);
        const endStr = formatShiftTime(row[eIdx]);
        const isOff = startStr.toLowerCase() === 'off' || endStr.toLowerCase() === 'off';
        scheduleObj[day] = {
          start: isOff ? 'Off' : startStr,
          end: isOff ? 'Off' : endStr,
          isOff
        };
      } else {
        // Try single-column convention: Mon header containing "9:00 - 18:00" or "Off"
        const singleIdx = headers.findIndex(h => h === dLower || h.startsWith(dLower + ' ') || h.endsWith(' ' + dLower));
        if (singleIdx !== -1 && row[singleIdx] !== undefined) {
          const rawVal = String(row[singleIdx]).trim();
          if (rawVal.toLowerCase() === 'off' || rawVal === '' || rawVal === '-') {
            scheduleObj[day] = { start: 'Off', end: 'Off', isOff: true };
          } else if (rawVal.includes('-')) {
            const parts = rawVal.split('-').map(p => p.trim());
            scheduleObj[day] = {
              start: parts[0] || '9:00',
              end: parts[1] || '18:00',
              isOff: false
            };
          }
        }
      }
    });

    let daysOffCount = 0;
    days.forEach(d => {
      if (scheduleObj[d].isOff) daysOffCount++;
    });

    const empIndex = importedEmployees.length;
    importedEmployees.push({
      id: `emp-imp-${Date.now()}-${empIndex + 1}`,
      name: rawName,
      email,
      username: email.split('@')[0],
      department,
      country,
      supervisor,
      manager,
      daysOffCount,
      role,
      ptoAllowance: ptoQuota,
      avatarColor: AVATAR_COLORS[empIndex % AVATAR_COLORS.length],
      schedule: scheduleObj
    });
  }

  if (importedEmployees.length === 0) {
    return { success: false, count: 0, error: 'No employee schedule records could be parsed from the file.' };
  }

  return {
    success: true,
    count: importedEmployees.length,
    employees: importedEmployees
  };
}

// Load from XLSX / XLS ArrayBuffer
export function parseXLSXFile(buffer: ArrayBuffer): ImportScheduleResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, count: 0, error: 'Excel workbook has no sheets.' };
    }
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];
    return parseScheduleMatrix(data);
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Failed to read Excel workbook.' };
  }
}

// Load from CSV string
export function parseCSVString(csvText: string): ImportScheduleResult {
  try {
    const workbook = XLSX.read(csvText, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];
    return parseScheduleMatrix(data);
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Failed to parse CSV string.' };
  }
}
