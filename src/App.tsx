import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ScheduleProvider, useSchedule } from './context/ScheduleContext';
import { Header } from './components/Header';
import { DailyTimeline } from './components/DailyTimeline';
import { WeeklyMatrix } from './components/WeeklyMatrix';
import { SupervisorCoverageView } from './components/SupervisorCoverageView';
import { AttendanceTracker } from './components/AttendanceTracker';
import { ShiftSwapBoard } from './components/ShiftSwapBoard';
import { AnalyticsView } from './components/AnalyticsView';
import { LoginModal } from './components/LoginModal';
import { LogAttendanceModal } from './components/LogAttendanceModal';
import { EditShiftModal } from './components/EditShiftModal';
import { EmployeeDetailModal } from './components/EmployeeDetailModal';
import { CreateShiftSwapModal } from './components/CreateShiftSwapModal';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { ViewTab, Employee, DayOfWeek, AttendanceType } from './types';

function MainApp() {
  const { employees } = useSchedule();
  const [currentTab, setCurrentTab] = useState<ViewTab>('daily_timeline');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLogAttendanceOpen, setIsLogAttendanceOpen] = useState(false);
  const [logAttendanceType, setLogAttendanceType] = useState<AttendanceType>('PTO');
  const [targetEmployeeForLog, setTargetEmployeeForLog] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editShiftEmployee, setEditShiftEmployee] = useState<Employee | null>(null);
  const [editShiftDay, setEditShiftDay] = useState<DayOfWeek>('Mon');
  const [isDriveSyncOpen, setIsDriveSyncOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isCreateSwapOpen, setIsCreateSwapOpen] = useState(false);
  const [swapTargetEmployee, setSwapTargetEmployee] = useState<Employee | null>(null);
  const [swapTargetDay, setSwapTargetDay] = useState<DayOfWeek>('Mon');

  const handleOpenLogAttendance = (defaultType: AttendanceType = 'PTO', emp?: Employee) => {
    setLogAttendanceType(defaultType);
    setTargetEmployeeForLog(emp || null);
    setIsLogAttendanceOpen(true);
  };

  const handleOpenCreateSwap = (emp?: Employee | null, day: DayOfWeek = 'Mon') => {
    setSwapTargetEmployee(emp || null);
    setSwapTargetDay(day);
    setIsCreateSwapOpen(true);
  };

  const handleEditShift = (emp: Employee, day: DayOfWeek) => {
    setEditShiftEmployee(emp);
    setEditShiftDay(day);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans transition-colors duration-200">
      {/* Skip to Main Content Link (Google Accessibility WCAG 2.2 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-indigo-600 focus:text-white focus:font-bold focus:text-xs focus:rounded-xl focus:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
      >
        Skip to main content
      </a>

      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenLogAttendance={() => handleOpenLogAttendance('PTO')}
        onOpenDriveSync={() => setIsDriveSyncOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenCreateSwapModal={() => handleOpenCreateSwap()}
      />

      {/* Main Container */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 focus:outline-none">
        {currentTab === 'daily_timeline' && (
          <DailyTimeline
            onSelectEmployee={(emp) => setSelectedEmployee(emp)}
            onLogAttendanceForEmployee={(emp) => handleOpenLogAttendance('Tardiness', emp)}
          />
        )}

        {currentTab === 'weekly_matrix' && (
          <WeeklyMatrix
            onSelectEmployee={(emp) => setSelectedEmployee(emp)}
            onEditShift={handleEditShift}
          />
        )}

        {currentTab === 'supervisor_coverage' && (
          <SupervisorCoverageView
            onSelectEmployee={(emp) => setSelectedEmployee(emp)}
            onEditShift={handleEditShift}
          />
        )}

        {currentTab === 'attendance_tracker' && (
          <AttendanceTracker
            onOpenLogModal={(type) => handleOpenLogAttendance(type || 'PTO')}
            onSelectEmployee={(emp) => setSelectedEmployee(emp)}
          />
        )}

        {currentTab === 'shift_swaps' && (
          <ShiftSwapBoard
            onOpenCreateSwapModal={() => handleOpenCreateSwap()}
            onSelectEmployee={(empId) => {
              const emp = employees.find(e => e.id === empId);
              if (emp) setSelectedEmployee(emp);
            }}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            onOpenLogAttendance={(type, emp) => handleOpenLogAttendance(type, emp)}
            onSelectEmployee={(emp) => setSelectedEmployee(emp)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-700">Single Digits Team Schedule & Daily Attendance Portal</span>
          <span className="text-slate-500">45 Global Engineers • Live Time & Attendance Operations</span>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <LogAttendanceModal
        isOpen={isLogAttendanceOpen}
        onClose={() => setIsLogAttendanceOpen(false)}
        targetEmployee={targetEmployeeForLog}
        defaultType={logAttendanceType}
      />

      <EditShiftModal
        isOpen={!!editShiftEmployee}
        onClose={() => setEditShiftEmployee(null)}
        employee={editShiftEmployee}
        day={editShiftDay}
      />

      <EmployeeDetailModal
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        employee={selectedEmployee}
        onLogAttendance={(emp) => {
          setSelectedEmployee(null);
          handleOpenLogAttendance('PTO', emp);
        }}
        onEditShift={(emp, day) => {
          setSelectedEmployee(null);
          handleEditShift(emp, day);
        }}
        onProposeSwap={(emp) => {
          setSelectedEmployee(null);
          handleOpenCreateSwap(emp);
        }}
      />

      <CreateShiftSwapModal
        isOpen={isCreateSwapOpen}
        onClose={() => setIsCreateSwapOpen(false)}
        preselectedEmployee={swapTargetEmployee}
        preselectedDay={swapTargetDay}
      />

      <GoogleDriveSyncModal
        isOpen={isDriveSyncOpen}
        onClose={() => setIsDriveSyncOpen(false)}
      />

      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ScheduleProvider>
          <MainApp />
        </ScheduleProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

