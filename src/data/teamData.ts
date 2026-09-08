import { Employee, AttendanceRecord, TimeEntry, DayOfWeek, ShiftSwapRequest } from '../types';

export const INITIAL_EMPLOYEES_RAW: (Omit<Employee, 'id' | 'schedule' | 'username'> & {
  mon: [string, string];
  tue: [string, string];
  wed: [string, string];
  thu: [string, string];
  fri: [string, string];
  sat: [string, string];
  sun: [string, string];
})[] = [
  {
    name: "Carlos Garcia",
    email: "cgarcia@singledigits.com",
    department: "CALA Escalation",
    country: "Mexico",
    supervisor: "Andre Villaran",
    manager: "Tom Hardy",
    mon: ["9:00", "18:00"],
    tue: ["9:00", "18:00"],
    wed: ["9:00", "18:00"],
    thu: ["9:00", "18:00"],
    fri: ["9:00", "18:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Victor Ponce",
    email: "vponce@singledigits.com",
    department: "CALA Escalation",
    country: "Guatemala",
    supervisor: "Andre Villaran",
    manager: "Tom Hardy",
    mon: ["10:30", "19:30"],
    tue: ["10:30", "19:30"],
    wed: ["10:30", "19:30"],
    thu: ["10:30", "19:30"],
    fri: ["10:30", "19:30"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Luis Garcia",
    email: "lgarcia@singledigits.com",
    department: "CALA Escalation",
    country: "Mexico",
    supervisor: "Andre Villaran",
    manager: "Tom Hardy",
    mon: ["12:00", "21:00"],
    tue: ["12:00", "21:00"],
    wed: ["12:00", "21:00"],
    thu: ["12:00", "21:00"],
    fri: ["12:00", "21:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Dave Cardozo",
    email: "dcardozo_c@singledigits.com",
    department: "Escalations",
    country: "Venezuela",
    supervisor: "Andre Villaran",
    manager: "Tom Hardy",
    mon: ["Off", "Off"],
    tue: ["9:00", "18:00"],
    wed: ["9:00", "18:00"],
    thu: ["9:00", "18:00"],
    fri: ["9:00", "18:00"],
    sat: ["9:00", "18:00"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Azaiah Elsayed",
    email: "aelsayed@singledigits.com",
    department: "Escalations",
    country: "India",
    supervisor: "Andre Villaran",
    manager: "Tom Hardy",
    mon: ["11:00", "20:00"],
    tue: ["11:00", "20:00"],
    wed: ["11:00", "20:00"],
    thu: ["11:00", "20:00"],
    fri: ["Off", "Off"],
    sat: ["Off", "Off"],
    sun: ["11:00", "20:00"],
    daysOffCount: 2
  },
  {
    name: "Javier Chocon",
    email: "jchocon@singledigits.com",
    department: "Escalations",
    country: "Guatemala",
    supervisor: "Andre Villaran",
    manager: "Tom Hardy",
    mon: ["12:00", "21:00"],
    tue: ["12:00", "21:00"],
    wed: ["12:00", "21:00"],
    thu: ["12:00", "21:00"],
    fri: ["Off", "Off"],
    sat: ["Off", "Off"],
    sun: ["12:00", "21:00"],
    daysOffCount: 2
  },
  {
    name: "Karlo Jimenez",
    email: "kjimenez@singledigits.com",
    department: "Escalations",
    country: "Mexico",
    supervisor: "Andre Villaran",
    manager: "Tom Hardy",
    mon: ["11:00", "20:00"],
    tue: ["11:00", "20:00"],
    wed: ["11:00", "20:00"],
    thu: ["11:00", "20:00"],
    fri: ["11:00", "20:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Terry Taha",
    email: "tthaha@singledigits.com",
    department: "Escalations",
    country: "India",
    supervisor: "Gabby",
    manager: "Tom Hardy",
    mon: ["8:00", "17:00"],
    tue: ["8:00", "17:00"],
    wed: ["8:00", "17:00"],
    thu: ["8:00", "17:00"],
    fri: ["Off", "Off"],
    sat: ["Off", "Off"],
    sun: ["8:00", "17:00"],
    daysOffCount: 2
  },
  {
    name: "Oscar Mercado",
    email: "omercado@singledigits.com",
    department: "MDU Engineer",
    country: "Mexico",
    supervisor: "Gabby",
    manager: "Tom Hardy",
    mon: ["10:00", "19:30"],
    tue: ["10:00", "19:30"],
    wed: ["10:00", "19:30"],
    thu: ["10:00", "19:30"],
    fri: ["10:00", "19:30"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Luis Ramirez",
    email: "jvramirez@singledigits.com",
    department: "MDU Engineer",
    country: "Mexico",
    supervisor: "Gabby",
    manager: "Tom Hardy",
    mon: ["10:00", "19:00"],
    tue: ["10:00", "19:00"],
    wed: ["10:00", "19:00"],
    thu: ["10:00", "19:00"],
    fri: ["10:00", "19:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Billy Villa",
    email: "bvilla@singledigits.com",
    department: "MDU Engineer",
    country: "Mexico",
    supervisor: "Gabby",
    manager: "Tom Hardy",
    mon: ["10:00", "19:00"],
    tue: ["10:00", "19:00"],
    wed: ["10:00", "19:00"],
    thu: ["10:00", "19:00"],
    fri: ["10:00", "19:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Darnell Devanpelly",
    email: "ddevanpelly@singledigits.com",
    department: "Senior Living",
    country: "India",
    supervisor: "Gabby",
    manager: "Tom Hardy",
    mon: ["9:00", "18:00"],
    tue: ["9:00", "18:00"],
    wed: ["9:00", "18:00"],
    thu: ["9:00", "18:00"],
    fri: ["9:00", "18:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Phillip Sharma",
    email: "psharma@singledigits.com",
    department: "Senior Living",
    country: "India",
    supervisor: "Gabby",
    manager: "Tom Hardy",
    mon: ["Off", "Off"],
    tue: ["9:00", "18:00"],
    wed: ["9:00", "18:00"],
    thu: ["9:00", "18:00"],
    fri: ["9:00", "18:00"],
    sat: ["9:00", "18:00"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Daniel Alcaraz",
    email: "damartinez@singledigits.com",
    department: "Escalations",
    country: "Mexico",
    supervisor: "Hector Salazar",
    manager: "Tom Hardy",
    mon: ["16:00", "1:00"],
    tue: ["16:00", "1:00"],
    wed: ["16:00", "1:00"],
    thu: ["16:00", "1:00"],
    fri: ["16:00", "1:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Mia Uniyal",
    email: "muniyal@singledigits.com",
    department: "Escalations",
    country: "India",
    supervisor: "Hector Salazar",
    manager: "Tom Hardy",
    mon: ["23:00", "8:00"],
    tue: ["23:00", "8:00"],
    wed: ["23:00", "8:00"],
    thu: ["23:00", "8:00"],
    fri: ["Off", "Off"],
    sat: ["Off", "Off"],
    sun: ["23:00", "8:00"],
    daysOffCount: 2
  },
  {
    name: "Wally Gaber",
    email: "wally.mohamed_c@singledigits.com",
    department: "Escalations",
    country: "Egypt",
    supervisor: "Hector Salazar",
    manager: "Tom Hardy",
    mon: ["23:00", "8:00"],
    tue: ["23:00", "8:00"],
    wed: ["Off", "Off"],
    thu: ["Off", "Off"],
    fri: ["23:00", "8:00"],
    sat: ["23:00", "8:00"],
    sun: ["23:00", "8:00"],
    daysOffCount: 2
  },
  {
    name: "Gannon Chinchghare",
    email: "gchinchghare@singledigits.com",
    department: "UBF / BF",
    country: "India",
    supervisor: "Moha Belal",
    manager: "Tom Hardy",
    mon: ["8:00", "17:00"],
    tue: ["8:00", "17:00"],
    wed: ["8:00", "17:00"],
    thu: ["8:00", "17:00"],
    fri: ["8:00", "17:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Nick Jacobs",
    email: "njacobs@singledigits.com",
    department: "UBF / BF",
    country: "United States",
    supervisor: "Roberto Luarca",
    manager: "Tom Hardy",
    mon: ["8:00", "17:00"],
    tue: ["8:00", "17:00"],
    wed: ["8:00", "17:00"],
    thu: ["8:00", "17:00"],
    fri: ["8:00", "17:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "John Hallett",
    email: "jhallett@singledigits.com",
    department: "UBF / BF",
    country: "United States",
    supervisor: "Moha Belal",
    manager: "Tom Hardy",
    mon: ["8:30", "17:00"],
    tue: ["8:30", "17:00"],
    wed: ["8:30", "17:00"],
    thu: ["8:30", "17:00"],
    fri: ["8:30", "17:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Adel ElSayed",
    email: "adel.elsayed_c@singledigits.com",
    department: "UBF / BF",
    country: "Egypt",
    supervisor: "Moha Belal",
    manager: "Tom Hardy",
    mon: ["9:00", "18:00"],
    tue: ["9:00", "18:00"],
    wed: ["9:00", "18:00"],
    thu: ["9:00", "18:00"],
    fri: ["Off", "Off"],
    sat: ["Off", "Off"],
    sun: ["9:00", "18:00"],
    daysOffCount: 2
  },
  {
    name: "Ernest Babu",
    email: "ebabu@singledigits.com",
    department: "UBF / BF",
    country: "India",
    supervisor: "Moha Belal",
    manager: "Tom Hardy",
    mon: ["Off", "Off"],
    tue: ["10:00", "19:00"],
    wed: ["10:00", "19:00"],
    thu: ["10:00", "19:00"],
    fri: ["10:00", "19:00"],
    sat: ["10:00", "19:00"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Jerry Shaaban",
    email: "jshaaban_c@singledigits.com",
    department: "UBF / BF",
    country: "Egypt",
    supervisor: "Moha Belal",
    manager: "Tom Hardy",
    mon: ["10:00", "19:00"],
    tue: ["10:00", "19:00"],
    wed: ["10:00", "19:00"],
    thu: ["10:00", "19:00"],
    fri: ["10:00", "19:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Percy Sharkawy",
    email: "percy.sharkawy@calltekinc.com",
    department: "UBF / BF",
    country: "Egypt",
    supervisor: "Moha Belal",
    manager: "Tom Hardy",
    mon: ["10:00", "19:00"],
    tue: ["10:00", "19:00"],
    wed: ["10:00", "19:00"],
    thu: ["10:00", "19:00"],
    fri: ["10:00", "19:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Raj Dumpala",
    email: "rdumpala_c@singledigits.com",
    department: "UBF / BF",
    country: "India",
    supervisor: "Moha Belal",
    manager: "Tom Hardy",
    mon: ["10:00", "19:00"],
    tue: ["10:00", "19:00"],
    wed: ["10:00", "19:00"],
    thu: ["10:00", "19:00"],
    fri: ["10:00", "19:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Michael Cinco",
    email: "michael.cinco_c@singledigits.com",
    department: "Backlog",
    country: "Philippines",
    supervisor: "Roberto Luarca",
    manager: "Tom Hardy",
    mon: ["8:00", "17:00"],
    tue: ["8:00", "17:00"],
    wed: ["8:00", "17:00"],
    thu: ["8:00", "17:00"],
    fri: ["8:00", "17:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Brandon Thakral",
    email: "bthakral_c@singledigits.com",
    department: "Escalations",
    country: "India",
    supervisor: "Roberto Luarca",
    manager: "Tom Hardy",
    mon: ["7:00", "16:00"],
    tue: ["7:00", "16:00"],
    wed: ["7:00", "16:00"],
    thu: ["7:00", "16:00"],
    fri: ["7:00", "16:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Todd Makrani",
    email: "ctc_tmakrani@singledigits.com",
    department: "Escalations",
    country: "India",
    supervisor: "Roberto Luarca",
    manager: "Tom Hardy",
    mon: ["Off", "Off"],
    tue: ["8:00", "17:00"],
    wed: ["8:00", "17:00"],
    thu: ["8:00", "17:00"],
    fri: ["8:00", "17:00"],
    sat: ["8:00", "17:00"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Marco Fajardo",
    email: "mfajardo@singledigits.com",
    department: "Escalations",
    country: "Mexico",
    supervisor: "Roberto Luarca",
    manager: "Tom Hardy",
    mon: ["8:00", "17:00"],
    tue: ["8:00", "17:00"],
    wed: ["8:00", "17:00"],
    thu: ["8:00", "17:00"],
    fri: ["Off", "Off"],
    sat: ["Off", "Off"],
    sun: ["8:00", "17:00"],
    daysOffCount: 2
  },
  {
    name: "Navi Kumar",
    email: "nkumar_c@singledigits.com",
    department: "Escalations",
    country: "India",
    supervisor: "Roberto Luarca",
    manager: "Tom Hardy",
    mon: ["12:00", "20:00"],
    tue: ["12:00", "20:00"],
    wed: ["12:00", "20:00"],
    thu: ["12:00", "20:00"],
    fri: ["Off", "Off"],
    sat: ["Off", "Off"],
    sun: ["12:00", "20:00"],
    daysOffCount: 2
  },
  {
    name: "Meg Hamdy",
    email: "mhamdy@singledigits.com",
    department: "Escalations",
    country: "Egypt",
    supervisor: "Roberto Luarca",
    manager: "Tom Hardy",
    mon: ["12:00", "21:00"],
    tue: ["12:00", "21:00"],
    wed: ["12:00", "21:00"],
    thu: ["12:00", "21:00"],
    fri: ["12:00", "21:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Isaac German",
    email: "igerman@singledigits.com",
    department: "Escalations",
    country: "Mexico",
    supervisor: "Roberto Luarca",
    manager: "Tom Hardy",
    mon: ["16:00", "0:00"],
    tue: ["16:00", "0:00"],
    wed: ["16:00", "0:00"],
    thu: ["16:00", "0:00"],
    fri: ["Off", "Off"],
    sat: ["Off", "Off"],
    sun: ["16:00", "0:00"],
    daysOffCount: 2
  },
  {
    name: "Wilson Mureithi",
    email: "wmureithi_c@singledigits.com",
    department: "Escalations (Training)",
    country: "Kenya",
    supervisor: "Roberto Luarca",
    manager: "Tom Hardy",
    mon: ["11:00", "19:00"],
    tue: ["11:00", "19:00"],
    wed: ["11:00", "19:00"],
    thu: ["11:00", "19:00"],
    fri: ["11:00", "19:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Evalyne Njoroge",
    email: "enjoroge_c@singledigits.com",
    department: "Escalations (Training)",
    country: "Kenya",
    supervisor: "Roberto Luarca",
    manager: "Tom Hardy",
    mon: ["10:00", "18:00"],
    tue: ["10:00", "18:00"],
    wed: ["10:00", "18:00"],
    thu: ["10:00", "18:00"],
    fri: ["10:00", "18:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Eduardo Campuzano",
    email: "ecampuzano@singledigits.com",
    department: "Monitoring",
    country: "Mexico",
    supervisor: "Roberto Luarca",
    manager: "Tom Hardy",
    mon: ["9:00", "18:00"],
    tue: ["9:00", "18:00"],
    wed: ["9:00", "18:00"],
    thu: ["9:00", "18:00"],
    fri: ["9:00", "18:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Dale Pawar",
    email: "dale_c@singledigits.com",
    department: "Monitoring",
    country: "India",
    supervisor: "Roberto Luarca",
    manager: "Tom Hardy",
    mon: ["Off", "Off"],
    tue: ["Off", "Off"],
    wed: ["10:00", "19:00"],
    thu: ["10:00", "19:00"],
    fri: ["10:00", "19:00"],
    sat: ["14:00", "23:00"],
    sun: ["14:00", "23:00"],
    daysOffCount: 2
  },
  {
    name: "Eric Newville",
    email: "enewville@singledigits.com",
    department: "Incident Management",
    country: "United States",
    supervisor: "Scott Edwards",
    manager: "Tom Hardy",
    mon: ["8:00", "17:00"],
    tue: ["8:00", "17:00"],
    wed: ["8:00", "17:00"],
    thu: ["8:00", "17:00"],
    fri: ["8:00", "17:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Pablo Lopez",
    email: "plopez@singledigits.com",
    department: "Escalations",
    country: "Guatemala",
    supervisor: "Sergio Hernandez",
    manager: "Tom Hardy",
    mon: ["15:00", "19:00"],
    tue: ["10:00", "19:00"],
    wed: ["10:00", "19:00"],
    thu: ["10:00", "19:00"],
    fri: ["10:00", "19:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Aryan Kumar",
    email: "akumar_c@singledigits.com",
    department: "Escalations",
    country: "India",
    supervisor: "Sergio Hernandez",
    manager: "Tom Hardy",
    mon: ["Off", "Off"],
    tue: ["12:00", "21:00"],
    wed: ["12:00", "21:00"],
    thu: ["12:00", "21:00"],
    fri: ["12:00", "21:00"],
    sat: ["12:00", "21:00"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Leo Mahmoud",
    email: "lmahmoud_c@singledigits.com",
    department: "Escalations",
    country: "Egypt",
    supervisor: "Sergio Hernandez",
    manager: "Tom Hardy",
    mon: ["13:00", "22:00"],
    tue: ["13:00", "22:00"],
    wed: ["13:00", "22:00"],
    thu: ["13:00", "22:00"],
    fri: ["13:00", "22:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Vance Khosla",
    email: "vkhosla@singledigits.com",
    department: "Escalations",
    country: "India",
    supervisor: "Sergio Hernandez",
    manager: "Tom Hardy",
    mon: ["13:00", "22:00"],
    tue: ["13:00", "22:00"],
    wed: ["13:00", "22:00"],
    thu: ["13:00", "22:00"],
    fri: ["13:00", "22:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Ivan Ortiz",
    email: "iortiz@singledigits.com",
    department: "IPTV",
    country: "Mexico",
    supervisor: "Sergio Hernandez",
    manager: "Tom Hardy",
    mon: ["11:00", "20:00"],
    tue: ["11:00", "20:00"],
    wed: ["11:00", "20:00"],
    thu: ["11:00", "20:00"],
    fri: ["11:00", "20:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Dan Hebert",
    email: "danhebert@singledigits.com",
    department: "Conference",
    country: "United States",
    supervisor: "Tom Hardy",
    manager: "Tom Hardy",
    mon: ["9:00", "17:00"],
    tue: ["9:00", "17:00"],
    wed: ["9:00", "17:00"],
    thu: ["9:00", "17:00"],
    fri: ["9:00", "17:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "James Bajzek",
    email: "jbajzek@singledigits.com",
    department: "Upstream",
    country: "United States",
    supervisor: "Tom Hardy",
    manager: "Tom Hardy",
    mon: ["7:00", "16:00"],
    tue: ["7:00", "16:00"],
    wed: ["7:00", "16:00"],
    thu: ["7:00", "16:00"],
    fri: ["7:00", "16:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Bill Miller",
    email: "bmiller@singledigits.com",
    department: "Upstream",
    country: "United States",
    supervisor: "Tom Hardy",
    manager: "Tom Hardy",
    mon: ["8:00", "17:00"],
    tue: ["8:00", "17:00"],
    wed: ["8:00", "17:00"],
    thu: ["8:00", "17:00"],
    fri: ["8:00", "17:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  },
  {
    name: "Chetan Kumar",
    email: "ckumar_c@singledigits.com",
    department: "Escalations",
    country: "India",
    supervisor: "Roberto Luarca",
    manager: "Tom Hardy",
    mon: ["9:00", "18:00"],
    tue: ["9:00", "18:00"],
    wed: ["9:00", "18:00"],
    thu: ["9:00", "18:00"],
    fri: ["9:00", "18:00"],
    sat: ["Off", "Off"],
    sun: ["Off", "Off"],
    daysOffCount: 2
  }
];

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-violet-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-teal-600',
  'bg-cyan-600',
  'bg-fuchsia-600',
  'bg-sky-600'
];

export function parseInitialEmployees(): Employee[] {
  return INITIAL_EMPLOYEES_RAW.map((emp, index) => {
    const username = emp.email.split('@')[0];
    const role: Employee['role'] = 
      emp.name === 'Tom Hardy' ? 'manager' :
      ['Andre Villaran', 'Gabby', 'Hector Salazar', 'Moha Belal', 'Roberto Luarca', 'Scott Edwards', 'Sergio Hernandez'].includes(emp.name) ? 'supervisor' : 'employee';

    return {
      id: `emp-${index + 1}`,
      name: emp.name,
      email: emp.email,
      username,
      department: emp.department,
      country: emp.country,
      supervisor: emp.supervisor,
      manager: emp.manager,
      daysOffCount: emp.daysOffCount,
      avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
      role,
      ptoAllowance: role === 'manager' ? 25 : role === 'supervisor' ? 22 : 20,
      schedule: {
        Mon: { start: emp.mon[0], end: emp.mon[1], isOff: emp.mon[0].toLowerCase() === 'off' },
        Tue: { start: emp.tue[0], end: emp.tue[1], isOff: emp.tue[0].toLowerCase() === 'off' },
        Wed: { start: emp.wed[0], end: emp.wed[1], isOff: emp.wed[0].toLowerCase() === 'off' },
        Thu: { start: emp.thu[0], end: emp.thu[1], isOff: emp.thu[0].toLowerCase() === 'off' },
        Fri: { start: emp.fri[0], end: emp.fri[1], isOff: emp.fri[0].toLowerCase() === 'off' },
        Sat: { start: emp.sat[0], end: emp.sat[1], isOff: emp.sat[0].toLowerCase() === 'off' },
        Sun: { start: emp.sun[0], end: emp.sun[1], isOff: emp.sun[0].toLowerCase() === 'off' },
      }
    };
  });
}

// Time parsing and duration utilities
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || timeStr.toLowerCase() === 'off') return -1;
  const parts = timeStr.split(':');
  if (parts.length < 2) return -1;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  return h * 60 + m;
}

export function minutesToTimeString(minutes: number): string {
  if (minutes < 0) return '--:--';
  const norm = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function formatTimeDisplay(timeStr: string): string {
  if (!timeStr || timeStr.toLowerCase() === 'off') return 'Off';
  const mins = timeStringToMinutes(timeStr);
  if (mins === -1) return timeStr;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 && h < 24 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

export function calculateShiftDurationHours(startStr: string, endStr: string): number {
  if (startStr.toLowerCase() === 'off' || endStr.toLowerCase() === 'off') return 0;
  const start = timeStringToMinutes(startStr);
  let end = timeStringToMinutes(endStr);
  if (start === -1 || end === -1) return 0;
  if (end <= start) {
    end += 1440; // crosses midnight
  }
  return Number(((end - start) / 60).toFixed(1));
}

// Check if an employee is active at a given decimal hour (0.0 to 24.0)
export function isWorkingAtHour(shiftStart: string, shiftEnd: string, hourFloat: number): boolean {
  if (shiftStart.toLowerCase() === 'off' || shiftEnd.toLowerCase() === 'off') return false;
  const startMins = timeStringToMinutes(shiftStart);
  let endMins = timeStringToMinutes(shiftEnd);
  if (startMins === -1 || endMins === -1) return false;
  
  const currentMins = hourFloat * 60;
  if (endMins <= startMins) {
    // Overnights, e.g. 23:00 to 8:00 (1380 to 480)
    return currentMins >= startMins || currentMins < endMins;
  }
  return currentMins >= startMins && currentMins < endMins;
}

// Initial Sample Attendance Records (PTO, Tardiness, Absences, Sick Leave)
export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  // --- Monday Incidents (High tardiness demonstrating Monday commuter spike) ---
  {
    id: 'att-1',
    employeeId: 'emp-1', // Carlos Garcia
    employeeName: 'Carlos Garcia',
    department: 'CALA Escalation',
    type: 'Tardiness',
    date: '2026-08-31',
    status: 'Recorded',
    minutesLate: 18,
    scheduledTime: '9:00',
    actualTime: '9:18',
    reason: 'Heavy highway congestion / roadwork on main artery',
    supervisorApprovedBy: 'Andre Villaran',
    createdAt: '2026-08-31T09:20:00Z',
    notes: 'Informed supervisor via Slack at 08:45 AM'
  },
  {
    id: 'att-2',
    employeeId: 'emp-5', // Azaiah Elsayed
    employeeName: 'Azaiah Elsayed',
    department: 'Escalations',
    type: 'PTO',
    date: '2026-08-31',
    endDate: '2026-09-02',
    status: 'Approved',
    reason: 'Annual Family Vacation (Planned)',
    supervisorApprovedBy: 'Andre Villaran',
    createdAt: '2026-08-20T14:00:00Z',
    notes: 'Approved coverage handed over to Karlo Jimenez'
  },
  {
    id: 'att-3',
    employeeId: 'emp-10', // Luis Ramirez
    employeeName: 'Luis Ramirez',
    department: 'MDU Engineer',
    type: 'Sick Leave',
    date: '2026-08-31',
    status: 'Approved',
    reason: 'Fever and seasonal flu - doctor consultation',
    supervisorApprovedBy: 'Gabby',
    createdAt: '2026-08-31T07:30:00Z',
    notes: 'Doctor prescription submitted'
  },
  {
    id: 'att-4',
    employeeId: 'emp-22', // Jerry Shaaban
    employeeName: 'Jerry Shaaban',
    department: 'UBF / BF',
    type: 'Tardiness',
    date: '2026-08-31',
    status: 'Recorded',
    minutesLate: 12,
    scheduledTime: '10:00',
    actualTime: '10:12',
    reason: 'Metro line delay / transit switch delay',
    supervisorApprovedBy: 'Moha Belal',
    createdAt: '2026-08-31T10:15:00Z',
    notes: 'Supervisor notified'
  },
  {
    id: 'att-5',
    employeeId: 'emp-32', // Wilson Mureithi
    employeeName: 'Wilson Mureithi',
    department: 'Escalations (Training)',
    type: 'Absence',
    date: '2026-08-31',
    status: 'Unexcused',
    reason: 'Power grid outage in Nairobi residential sector',
    supervisorApprovedBy: 'Roberto Luarca',
    createdAt: '2026-08-31T11:30:00Z',
    notes: 'Pending power restoration confirmation'
  },
  {
    id: 'att-6',
    employeeId: 'emp-18', // Nick Jacobs
    employeeName: 'Nick Jacobs',
    department: 'UBF / BF',
    type: 'PTO',
    date: '2026-09-04',
    endDate: '2026-09-05',
    status: 'Approved',
    reason: 'Personal Leave / Long weekend travel',
    supervisorApprovedBy: 'Roberto Luarca',
    createdAt: '2026-08-25T11:00:00Z',
    notes: 'Covered by John Hallett'
  },
  {
    id: 'att-7',
    employeeId: 'emp-7', // Alexis Rodriguez
    employeeName: 'Alexis Rodriguez',
    department: 'Hospitality',
    type: 'Tardiness',
    date: '2026-08-24', // Monday
    status: 'Recorded',
    minutesLate: 22,
    scheduledTime: '9:00',
    actualTime: '9:22',
    reason: 'Monday bridge traffic backlog & toll lane shutdown',
    supervisorApprovedBy: 'Andre Villaran',
    createdAt: '2026-08-24T09:25:00Z',
    notes: 'Checked in on arrival'
  },
  {
    id: 'att-8',
    employeeId: 'emp-14', // Aaron Rivera
    employeeName: 'Aaron Rivera',
    department: 'MDU Support',
    type: 'Tardiness',
    date: '2026-08-24', // Monday
    status: 'Recorded',
    minutesLate: 15,
    scheduledTime: '8:00',
    actualTime: '8:15',
    reason: 'Bad weather & commuter rail switch fault',
    supervisorApprovedBy: 'Gabby',
    createdAt: '2026-08-24T08:20:00Z'
  },
  {
    id: 'att-9',
    employeeId: 'emp-25', // Karlo Jimenez
    employeeName: 'Karlo Jimenez',
    department: 'Escalations',
    type: 'Tardiness',
    date: '2026-09-07', // Monday
    status: 'Recorded',
    minutesLate: 25,
    scheduledTime: '9:00',
    actualTime: '9:25',
    reason: 'Vehicle battery drained after weekend',
    supervisorApprovedBy: 'Andre Villaran',
    createdAt: '2026-09-07T09:30:00Z'
  },
  {
    id: 'att-10',
    employeeId: 'emp-2', // Juan Pablo Gutierrez
    employeeName: 'Juan Pablo Gutierrez',
    department: 'CALA Escalation',
    type: 'Tardiness',
    date: '2026-08-17', // Monday
    status: 'Recorded',
    minutesLate: 14,
    scheduledTime: '9:00',
    actualTime: '9:14',
    reason: 'Heavy rain & urban traffic gridlock',
    supervisorApprovedBy: 'Andre Villaran',
    createdAt: '2026-08-17T09:15:00Z'
  },
  {
    id: 'att-11',
    employeeId: 'emp-3', // Jorge Beltran
    employeeName: 'Jorge Beltran',
    department: 'CALA Escalation',
    type: 'Tardiness',
    date: '2026-08-10', // Monday
    status: 'Recorded',
    minutesLate: 20,
    scheduledTime: '9:00',
    actualTime: '9:20',
    reason: 'Monday transit rush & security gate line',
    supervisorApprovedBy: 'Andre Villaran',
    createdAt: '2026-08-10T09:22:00Z'
  },

  // --- Tuesday Records ---
  {
    id: 'att-12',
    employeeId: 'emp-8', // Christian Pimentel
    employeeName: 'Christian Pimentel',
    department: 'Senior Living',
    type: 'Tardiness',
    date: '2026-08-25', // Tuesday
    status: 'Recorded',
    minutesLate: 10,
    scheduledTime: '9:00',
    actualTime: '9:10',
    reason: 'Local construction detour',
    supervisorApprovedBy: 'Gabby',
    createdAt: '2026-08-25T09:12:00Z'
  },
  {
    id: 'att-13',
    employeeId: 'emp-19', // Kevin Bermejo
    employeeName: 'Kevin Bermejo',
    department: 'Hospitality',
    type: 'Tardiness',
    date: '2026-09-01', // Tuesday
    status: 'Recorded',
    minutesLate: 8,
    scheduledTime: '9:00',
    actualTime: '9:08',
    reason: 'VPN authentication token glitch',
    supervisorApprovedBy: 'Andre Villaran',
    createdAt: '2026-09-01T09:10:00Z'
  },
  {
    id: 'att-14',
    employeeId: 'emp-11', // Jesus Hernandez
    employeeName: 'Jesus Hernandez',
    department: 'MDU Engineer',
    type: 'PTO',
    date: '2026-08-18', // Tuesday
    endDate: '2026-08-21',
    status: 'Approved',
    reason: 'Summer vacation break with family',
    supervisorApprovedBy: 'Gabby',
    createdAt: '2026-08-01T10:00:00Z'
  },

  // --- Wednesday Records ---
  {
    id: 'att-15',
    employeeId: 'emp-23', // Sergio Hernandez
    employeeName: 'Sergio Hernandez',
    department: 'Escalations',
    type: 'Tardiness',
    date: '2026-08-26', // Wednesday
    status: 'Recorded',
    minutesLate: 7,
    scheduledTime: '9:00',
    actualTime: '9:07',
    reason: 'Morning dental checkup overran slightly',
    supervisorApprovedBy: 'Andre Villaran',
    createdAt: '2026-08-26T09:10:00Z'
  },
  {
    id: 'att-16',
    employeeId: 'emp-27', // Mohamed Abdelmagid
    employeeName: 'Mohamed Abdelmagid',
    department: 'Escalations',
    type: 'Sick Leave',
    date: '2026-09-02', // Wednesday
    status: 'Approved',
    reason: 'Severe migraine headache',
    supervisorApprovedBy: 'Moha Belal',
    createdAt: '2026-09-02T08:00:00Z'
  },
  {
    id: 'att-17',
    employeeId: 'emp-20', // Roberto Luarca
    employeeName: 'Roberto Luarca',
    department: 'Hospitality',
    type: 'PTO',
    date: '2026-07-22',
    endDate: '2026-07-24',
    status: 'Approved',
    reason: 'Personal time off / anniversary',
    supervisorApprovedBy: 'Tom Hardy',
    createdAt: '2026-07-05T09:00:00Z'
  },

  // --- Thursday Records ---
  {
    id: 'att-18',
    employeeId: 'emp-30', // Hector Salazar
    employeeName: 'Hector Salazar',
    department: 'Escalations',
    type: 'Tardiness',
    date: '2026-08-27', // Thursday
    status: 'Recorded',
    minutesLate: 12,
    scheduledTime: '16:00',
    actualTime: '16:12',
    reason: 'Shift handover briefing overrun with daytime lead',
    supervisorApprovedBy: 'Tom Hardy',
    createdAt: '2026-08-27T16:15:00Z'
  },
  {
    id: 'att-19',
    employeeId: 'emp-12', // Scott Edwards
    employeeName: 'Scott Edwards',
    department: 'MDU Engineer',
    type: 'Tardiness',
    date: '2026-09-03', // Thursday
    status: 'Recorded',
    minutesLate: 11,
    scheduledTime: '10:00',
    actualTime: '10:11',
    reason: 'School dropoff traffic congestion',
    supervisorApprovedBy: 'Gabby',
    createdAt: '2026-09-03T10:14:00Z'
  },
  {
    id: 'att-20',
    employeeId: 'emp-13', // Alan Cardenas
    employeeName: 'Alan Cardenas',
    department: 'MDU Engineer',
    type: 'PTO',
    date: '2026-08-06',
    endDate: '2026-08-07',
    status: 'Approved',
    reason: 'Home renovation and relocation tasks',
    supervisorApprovedBy: 'Gabby',
    createdAt: '2026-07-28T14:00:00Z'
  },

  // --- Friday Records ---
  {
    id: 'att-21',
    employeeId: 'emp-4', // Andre Villaran
    employeeName: 'Andre Villaran',
    department: 'Hospitality',
    type: 'Tardiness',
    date: '2026-08-28', // Friday
    status: 'Recorded',
    minutesLate: 16,
    scheduledTime: '8:00',
    actualTime: '8:16',
    reason: 'Highway accident blocking middle lanes',
    supervisorApprovedBy: 'Tom Hardy',
    createdAt: '2026-08-28T08:20:00Z'
  },
  {
    id: 'att-22',
    employeeId: 'emp-16', // Moha Belal
    employeeName: 'Moha Belal',
    department: 'Escalations',
    type: 'Tardiness',
    date: '2026-09-04', // Friday
    status: 'Recorded',
    minutesLate: 15,
    scheduledTime: '8:00',
    actualTime: '8:15',
    reason: 'Airport shuttle delay following regional visit',
    supervisorApprovedBy: 'Tom Hardy',
    createdAt: '2026-09-04T08:20:00Z'
  },
  {
    id: 'att-23',
    employeeId: 'emp-21', // Jose Martinez
    employeeName: 'Jose Martinez',
    department: 'Hospitality',
    type: 'PTO',
    date: '2026-08-14',
    endDate: '2026-08-14',
    status: 'Approved',
    reason: 'Long weekend family trip',
    supervisorApprovedBy: 'Andre Villaran',
    createdAt: '2026-08-02T11:00:00Z'
  },
  {
    id: 'att-24',
    employeeId: 'emp-24', // Karlo Jimenez
    employeeName: 'Karlo Jimenez',
    department: 'Escalations',
    type: 'PTO',
    date: '2026-07-03',
    endDate: '2026-07-10',
    status: 'Approved',
    reason: 'Annual European vacation trip',
    supervisorApprovedBy: 'Andre Villaran',
    createdAt: '2026-06-15T09:00:00Z'
  },

  // --- Weekend Records (Sat / Sun) ---
  {
    id: 'att-25',
    employeeId: 'emp-9', // Phillip Sharma
    employeeName: 'Phillip Sharma',
    department: 'Senior Living',
    type: 'Tardiness',
    date: '2026-08-29', // Saturday
    status: 'Recorded',
    minutesLate: 6,
    scheduledTime: '9:00',
    actualTime: '9:06',
    reason: 'Broadband router reset on home shift start',
    supervisorApprovedBy: 'Gabby',
    createdAt: '2026-08-29T09:10:00Z'
  },
  {
    id: 'att-26',
    employeeId: 'emp-31', // Mia Uniyal
    employeeName: 'Mia Uniyal',
    department: 'Escalations',
    type: 'Tardiness',
    date: '2026-08-30', // Sunday night shift
    status: 'Recorded',
    minutesLate: 9,
    scheduledTime: '23:00',
    actualTime: '23:09',
    reason: 'Monsoon rainfall transport slow-down',
    supervisorApprovedBy: 'Hector Salazar',
    createdAt: '2026-08-30T23:12:00Z'
  },

  // --- Diverse PTO Records across multiple employees for realistic PTO balance utilization ---
  {
    id: 'att-27',
    employeeId: 'emp-1', // Carlos Garcia
    employeeName: 'Carlos Garcia',
    department: 'CALA Escalation',
    type: 'PTO',
    date: '2026-06-15',
    endDate: '2026-06-19', // 5 days
    status: 'Approved',
    reason: 'Summer family getaway',
    supervisorApprovedBy: 'Andre Villaran',
    createdAt: '2026-05-20T10:00:00Z'
  },
  {
    id: 'att-28',
    employeeId: 'emp-1', // Carlos Garcia
    employeeName: 'Carlos Garcia',
    department: 'CALA Escalation',
    type: 'PTO',
    date: '2026-09-18',
    endDate: '2026-09-18', // 1 day pending
    status: 'Pending',
    reason: 'Personal appointments',
    supervisorApprovedBy: 'Andre Villaran',
    createdAt: '2026-09-02T11:00:00Z'
  },
  {
    id: 'att-29',
    employeeId: 'emp-6', // Gabby
    employeeName: 'Gabby',
    department: 'Senior Living',
    type: 'PTO',
    date: '2026-05-11',
    endDate: '2026-05-15', // 5 days
    status: 'Approved',
    reason: 'Spring recess leave',
    supervisorApprovedBy: 'Tom Hardy',
    createdAt: '2026-04-15T09:00:00Z'
  },
  {
    id: 'att-30',
    employeeId: 'emp-6', // Gabby
    employeeName: 'Gabby',
    department: 'Senior Living',
    type: 'PTO',
    date: '2026-08-03',
    endDate: '2026-08-07', // 5 days
    status: 'Approved',
    reason: 'Annual mid-year family holiday',
    supervisorApprovedBy: 'Tom Hardy',
    createdAt: '2026-07-10T09:00:00Z'
  },
  {
    id: 'att-31',
    employeeId: 'emp-15', // John Hallett
    employeeName: 'John Hallett',
    department: 'MDU Support',
    type: 'PTO',
    date: '2026-04-20',
    endDate: '2026-04-24', // 5 days
    status: 'Approved',
    reason: 'Spring camping trip',
    supervisorApprovedBy: 'Gabby',
    createdAt: '2026-04-01T10:00:00Z'
  },
  {
    id: 'att-32',
    employeeId: 'emp-15', // John Hallett
    employeeName: 'John Hallett',
    department: 'MDU Support',
    type: 'PTO',
    date: '2026-07-27',
    endDate: '2026-07-31', // 5 days
    status: 'Approved',
    reason: 'Family reunion',
    supervisorApprovedBy: 'Gabby',
    createdAt: '2026-07-01T10:00:00Z'
  },
  {
    id: 'att-33',
    employeeId: 'emp-15', // John Hallett
    employeeName: 'John Hallett',
    department: 'MDU Support',
    type: 'PTO',
    date: '2026-09-21',
    endDate: '2026-09-23', // 3 days
    status: 'Approved',
    reason: 'Autumn travel',
    supervisorApprovedBy: 'Gabby',
    createdAt: '2026-08-15T10:00:00Z'
  },
  {
    id: 'att-34',
    employeeId: 'emp-26', // Peter Diaz
    employeeName: 'Peter Diaz',
    department: 'Escalations',
    type: 'PTO',
    date: '2026-08-10',
    endDate: '2026-08-14', // 5 days
    status: 'Approved',
    reason: 'Summer break',
    supervisorApprovedBy: 'Andre Villaran',
    createdAt: '2026-07-25T11:00:00Z'
  },
  {
    id: 'att-35',
    employeeId: 'emp-28', // Daniel Alcaraz
    employeeName: 'Daniel Alcaraz',
    department: 'Escalations',
    type: 'PTO',
    date: '2026-03-09',
    endDate: '2026-03-13', // 5 days
    status: 'Approved',
    reason: 'Off-season travel',
    supervisorApprovedBy: 'Hector Salazar',
    createdAt: '2026-02-15T14:00:00Z'
  },
  {
    id: 'att-36',
    employeeId: 'emp-28', // Daniel Alcaraz
    employeeName: 'Daniel Alcaraz',
    department: 'Escalations',
    type: 'PTO',
    date: '2026-07-13',
    endDate: '2026-07-17', // 5 days
    status: 'Approved',
    reason: 'Summer family staycation',
    supervisorApprovedBy: 'Hector Salazar',
    createdAt: '2026-06-20T14:00:00Z'
  },
  {
    id: 'att-37',
    employeeId: 'emp-28', // Daniel Alcaraz
    employeeName: 'Daniel Alcaraz',
    department: 'Escalations',
    type: 'PTO',
    date: '2026-09-14',
    endDate: '2026-09-18', // 5 days
    status: 'Approved',
    reason: 'Personal travel and wellness',
    supervisorApprovedBy: 'Hector Salazar',
    createdAt: '2026-08-20T14:00:00Z'
  },
  {
    id: 'att-38',
    employeeId: 'emp-29', // Mia Uniyal
    employeeName: 'Mia Uniyal',
    department: 'Escalations',
    type: 'PTO',
    date: '2026-05-04',
    endDate: '2026-05-08', // 5 days
    status: 'Approved',
    reason: 'Family festivities',
    supervisorApprovedBy: 'Hector Salazar',
    createdAt: '2026-04-10T11:00:00Z'
  },
  {
    id: 'att-39',
    employeeId: 'emp-17', // Paul S.
    employeeName: 'Paul S.',
    department: 'Hospitality',
    type: 'Sick Leave',
    date: '2026-08-19',
    status: 'Approved',
    reason: 'Dental surgery and post-op rest',
    supervisorApprovedBy: 'Andre Villaran',
    createdAt: '2026-08-18T16:00:00Z'
  },
  {
    id: 'att-40',
    employeeId: 'emp-2', // Juan Pablo Gutierrez
    employeeName: 'Juan Pablo Gutierrez',
    department: 'CALA Escalation',
    type: 'PTO',
    date: '2026-07-06',
    endDate: '2026-07-10', // 5 days
    status: 'Approved',
    reason: 'Family summer holiday',
    supervisorApprovedBy: 'Andre Villaran',
    createdAt: '2026-06-15T09:00:00Z'
  }
];

export const INITIAL_TIME_ENTRIES: TimeEntry[] = [
  {
    id: 'time-1',
    employeeId: 'emp-1',
    date: '2026-08-31',
    dayOfWeek: 'Mon',
    clockInTime: '09:18:22',
    scheduledShift: '9:00 - 18:00',
    scheduledHours: 9,
    totalBreakMinutes: 0,
    totalHoursWorked: 2.1,
    isTardy: true,
    minutesTardy: 18,
    status: 'clocked_in',
    notes: 'Starting shift with CALA escalation queue'
  },
  {
    id: 'time-2',
    employeeId: 'emp-17',
    date: '2026-08-31',
    dayOfWeek: 'Mon',
    clockInTime: '07:58:10',
    scheduledShift: '8:00 - 17:00',
    scheduledHours: 9,
    breakStartTime: '12:00:00',
    breakEndTime: '13:00:00',
    totalBreakMinutes: 60,
    totalHoursWorked: 3.2,
    isTardy: false,
    minutesTardy: 0,
    status: 'clocked_in',
    notes: 'UBF/BF shift'
  }
];

export const INITIAL_SHIFT_SWAPS: ShiftSwapRequest[] = [
  {
    id: 'swap-1',
    requestType: 'swap',
    requesterId: 'emp-1',
    requesterName: 'Carlos Garcia',
    requesterDepartment: 'CALA Escalation',
    requesterSupervisor: 'Andre Villaran',
    requesterDay: 'Tue',
    requesterDate: '2026-09-08',
    requesterShift: { start: '9:00', end: '18:00', isOff: false },
    targetEmployeeId: 'emp-2',
    targetEmployeeName: 'Victor Ponce',
    targetDay: 'Thu',
    targetDate: '2026-09-10',
    targetShift: { start: '10:30', end: '19:30', isOff: false },
    isOpenPool: false,
    reason: 'Personal dental appointment on Tuesday afternoon; swapping for Thursday shift.',
    status: 'pending_supervisor',
    createdAt: '2026-09-06T10:30:00Z',
    updatedAt: '2026-09-06T14:30:00Z',
    peerResponseNote: 'Accepted by Victor Ponce: I can take Tuesday morning!',
    peerAcceptedAt: '2026-09-06T14:30:00Z'
  },
  {
    id: 'swap-2',
    requestType: 'coverage',
    requesterId: 'emp-18',
    requesterName: 'Nick Jacobs',
    requesterDepartment: 'UBF / BF',
    requesterSupervisor: 'Roberto Luarca',
    requesterDay: 'Wed',
    requesterDate: '2026-09-09',
    requesterShift: { start: '8:00', end: '17:00', isOff: false },
    isOpenPool: true,
    reason: 'Family medical commitment - seeking coverage for Wednesday 8:00-17:00 shift. Willing to trade for weekend!',
    status: 'pending_coworker',
    createdAt: '2026-09-07T08:15:00Z',
    updatedAt: '2026-09-07T08:15:00Z'
  },
  {
    id: 'swap-3',
    requestType: 'swap',
    requesterId: 'emp-3',
    requesterName: 'Luis Garcia',
    requesterDepartment: 'CALA Escalation',
    requesterSupervisor: 'Andre Villaran',
    requesterDay: 'Fri',
    requesterDate: '2026-09-04',
    requesterShift: { start: '12:00', end: '21:00', isOff: false },
    targetEmployeeId: 'emp-1',
    targetEmployeeName: 'Carlos Garcia',
    targetDay: 'Mon',
    targetDate: '2026-09-07',
    targetShift: { start: '9:00', end: '18:00', isOff: false },
    isOpenPool: false,
    reason: 'Weekend trip schedule adjustment.',
    status: 'approved',
    createdAt: '2026-09-02T09:00:00Z',
    updatedAt: '2026-09-03T11:20:00Z',
    peerResponseNote: 'Accepted by Carlos Garcia',
    peerAcceptedAt: '2026-09-02T16:00:00Z',
    supervisorName: 'Andre Villaran',
    supervisorDecisionAt: '2026-09-03T11:20:00Z',
    supervisorNotes: 'Approved. CALA tier 2 coverage preserved.'
  }
];
