import { Employee, AttendanceRecord, TimeEntry, DayOfWeek } from '../types';

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

// Initial Sample Attendance Records (PTO, Tardiness, Absences)
export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [
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
    reason: 'Heavy traffic on Insurgentes highway due to roadwork',
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
    reason: 'Metro line delay / commute congestion',
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
