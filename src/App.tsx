import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ScheduleProvider, useSchedule } from './context/ScheduleContext';
import { Header } from './components/Header';
import { DailyTimeline } from './components/DailyTimeline';
import { WeeklyMatrix } from './components/WeeklyMatrix';
import { AttendanceTracker } from './components/AttendanceTracker';
import { TimeClockPortal } from './components/TimeClockPortal';
import { AnalyticsView } from './components/AnalyticsView';
import { LoginModal } from './components/LoginModal';
import { LogAttendanceModal } from './components/LogAttendanceModal';
import { EditShiftModal } from './components/EditShiftModal';
import { EmployeeDetailModal } from './components/EmployeeDetailModal';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { PrintPdfReportModal } from './components/PrintPdfReportModal';
import { ViewTab, Employee, DayOfWeek, AttendanceType } from './types';

function MainApp() {
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
  const [isPdfExportOpen, setIsPdfExportOpen] = useState(false);

  const handleOpenLogAttendance = (defaultType: AttendanceType = 'PTO', emp?: Employee) => {
    setLogAttendanceType(defaultType);
    setTargetEmployeeForLog(emp || null);
    setIsLogAttendanceOpen(true);
  };

  const handleEditShift = (emp: Employee, day: DayOfWeek) => {
    setEditShiftEmployee(emp);
    setEditShiftDay(day);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenLogAttendance={() => handleOpenLogAttendance('PTO')}
        onOpenDriveSync={() => setIsDriveSyncOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenPdfExport={() => setIsPdfExportOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'daily_timeline' && (
          <DailyTimeline
            onSelectEmployee={(emp) => setSelectedEmployee(emp)}
            onLogAttendanceForEmployee={(emp) => handleOpenLogAttendance('Tardiness', emp)}
            onExportPdf={() => setIsPdfExportOpen(true)}
          />
        )}

        {currentTab === 'weekly_matrix' && (
          <WeeklyMatrix
            onSelectEmployee={(emp) => setSelectedEmployee(emp)}
            onEditShift={handleEditShift}
            onExportPdf={() => setIsPdfExportOpen(true)}
          />
        )}

        {currentTab === 'attendance_tracker' && (
          <AttendanceTracker
            onOpenLogModal={(type) => handleOpenLogAttendance(type || 'PTO')}
            onSelectEmployee={(emp) => setSelectedEmployee(emp)}
          />
        )}

        {currentTab === 'timecard' && (
          <TimeClockPortal
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Single Digits Team Schedule & Daily Attendance Portal</span>
          <span>45 Global Engineers • Live Time & Punctuality Engine</span>
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
      />

      <GoogleDriveSyncModal
        isOpen={isDriveSyncOpen}
        onClose={() => setIsDriveSyncOpen(false)}
      />

      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      <PrintPdfReportModal
        isOpen={isPdfExportOpen}
        onClose={() => setIsPdfExportOpen(false)}
        defaultView={currentTab === 'weekly_matrix' ? 'weekly' : 'daily'}
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

