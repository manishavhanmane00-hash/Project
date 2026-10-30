import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import AppLayout from './components/layout/AppLayout';
import EmployeeLayout from './components/employee/EmployeeLayout';
import ProtectedModule from './components/ProtectedModule';

// Auth Pages
import Login          from './pages/auth/Login';
import Register       from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword  from './pages/auth/ResetPassword';

// Other
import Unauthorized from './pages/Unauthorized';

// ── Admin / HR Pages ─────────────────────────────────────────────────────────
import Dashboard from './pages/Dashboard';

import EmployeeList    from './pages/employees/EmployeeList';
import AddEmployee     from './pages/employees/AddEmployee';
import EmployeeProfile from './pages/employees/EmployeeProfile';

import Departments from './pages/departments/Departments';
import Roles       from './pages/departments/Roles';

import DailyAttendance   from './pages/attendance/DailyAttendance';
import AttendanceHistory from './pages/attendance/AttendanceHistory';
import AttendanceReports from './pages/attendance/AttendanceReports';

import LeaveRequests from './pages/leave/LeaveRequests';
import ApplyLeave    from './pages/leave/ApplyLeave';
import LeaveApproval from './pages/leave/LeaveApproval';
import LeaveBalance  from './pages/leave/LeaveBalance';

import HolidayRecords  from './pages/holidays/HolidayRecords';
import HolidayCalendar from './pages/holidays/HolidayCalendar';

import OvertimeRecords from './pages/overtime/OvertimeRecords';

import AdvanceRecords from './pages/advances/AdvanceRecords';

import SalaryStructure from './pages/payroll/SalaryStructure';
import GeneratePayroll from './pages/payroll/GeneratePayroll';
import PayrollHistory  from './pages/payroll/PayrollHistory';
import Payslips        from './pages/payroll/Payslips';

import PerformanceReviews from './pages/performance/PerformanceReviews';
import Goals              from './pages/performance/Goals';

import Reports  from './pages/Reports';
import Settings from './pages/Settings';

// ── Employee Portal Pages ─────────────────────────────────────────────────────
import EmployeeDashboard    from './pages/employee/EmployeeDashboard';
import EmployeeProfilePage  from './pages/employee/EmployeeProfile';
import EmployeeAttendance   from './pages/employee/EmployeeAttendance';
import EmployeeLeave        from './pages/employee/EmployeeLeave';
import EmployeePayroll      from './pages/employee/EmployeePayroll';
import EmployeePerformance  from './pages/employee/EmployeePerformance';
import EmployeeNotifications from './pages/employee/EmployeeNotifications';
import EmployeeSettings     from './pages/employee/EmployeeSettings';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background:   'var(--surface)',
                color:        'var(--text-primary)',
                border:       '1px solid var(--border)',
                borderRadius: '10px',
                fontSize:     '0.875rem',
                boxShadow:    '0 10px 25px rgba(0,0,0,0.1)',
              },
              success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: 'white' } },
            }}
          />

          <Routes>
            {/* ── Public / Auth Routes ─────────────────────────────── */}
            <Route path="/login"           element={<Login />} />
            <Route path="/register"        element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password"  element={<ResetPassword />} />
            <Route path="/unauthorized"    element={<Unauthorized />} />

            {/* ── Employee Portal Routes ───────────────────────────── */}
            <Route element={<EmployeeLayout />}>
              <Route path="/employee"              element={<Navigate to="/employee/dashboard" replace />} />
              <Route path="/employee/dashboard"    element={<EmployeeDashboard />} />
              <Route path="/employee/profile"      element={<EmployeeProfilePage />} />
              <Route path="/employee/attendance"   element={<EmployeeAttendance />} />
              <Route path="/employee/leave"        element={<EmployeeLeave />} />
              <Route path="/employee/payroll"      element={<EmployeePayroll />} />
              <Route path="/employee/performance"  element={<EmployeePerformance />} />
              <Route path="/employee/notifications" element={<EmployeeNotifications />} />
              <Route path="/employee/settings"     element={<EmployeeSettings />} />
              {/* Any unknown /employee/* path */}
              <Route path="/employee/*"            element={<Navigate to="/employee/dashboard" replace />} />
            </Route>

            {/* ── Admin / HR Protected Routes ───────────────────────── */}
            <Route element={<AppLayout />}>
              {/* Dashboard */}
              <Route path="/"          element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ProtectedModule moduleKey="dashboard"><Dashboard /></ProtectedModule>} />

              {/* Employees */}
              <Route path="/employees"          element={<Navigate to="/employees/list" replace />} />
              <Route path="/employees/list"     element={<ProtectedModule moduleKey="employees.list"><EmployeeList /></ProtectedModule>} />
              <Route path="/employees/add"      element={<ProtectedModule moduleKey="employees.add"><AddEmployee /></ProtectedModule>} />
              <Route path="/employees/edit/:id" element={<ProtectedModule moduleKey="employees.add"><AddEmployee /></ProtectedModule>} />
              <Route path="/employees/:id"      element={<ProtectedModule moduleKey="employees.list"><EmployeeProfile /></ProtectedModule>} />

              {/* Departments */}
              <Route path="/departments" element={<ProtectedModule moduleKey="departments.departments"><Departments /></ProtectedModule>} />
              <Route path="/roles"       element={<ProtectedModule moduleKey="departments.roles"><Roles /></ProtectedModule>} />

              {/* Attendance */}
              <Route path="/attendance"         element={<Navigate to="/attendance/daily" replace />} />
              <Route path="/attendance/daily"   element={<ProtectedModule moduleKey="attendance.daily"><DailyAttendance /></ProtectedModule>} />
              <Route path="/attendance/history" element={<ProtectedModule moduleKey="attendance.history"><AttendanceHistory /></ProtectedModule>} />
              <Route path="/attendance/reports" element={<ProtectedModule moduleKey="attendance.reports"><AttendanceReports /></ProtectedModule>} />

              {/* Leave */}
              <Route path="/leave"          element={<Navigate to="/leave/requests" replace />} />
              <Route path="/leave/requests" element={<ProtectedModule moduleKey="leave.requests"><LeaveRequests /></ProtectedModule>} />
              <Route path="/leave/apply"    element={<ProtectedModule moduleKey="leave.apply"><ApplyLeave /></ProtectedModule>} />
              <Route path="/leave/approval" element={<ProtectedModule moduleKey="leave.approval"><LeaveApproval /></ProtectedModule>} />
              <Route path="/leave/balance"  element={<ProtectedModule moduleKey="leave.balance"><LeaveBalance /></ProtectedModule>} />

              {/* Holidays */}
              <Route path="/holidays"          element={<Navigate to="/holidays/records" replace />} />
              <Route path="/holidays/records"  element={<ProtectedModule moduleKey="holidays.records"><HolidayRecords /></ProtectedModule>} />
              <Route path="/holidays/calendar" element={<ProtectedModule moduleKey="holidays.calendar"><HolidayCalendar /></ProtectedModule>} />

              {/* Overtime */}
              <Route path="/overtime"         element={<Navigate to="/overtime/records" replace />} />
              <Route path="/overtime/records" element={<ProtectedModule moduleKey="overtime.records"><OvertimeRecords /></ProtectedModule>} />

              {/* Advances */}
              <Route path="/advances"         element={<Navigate to="/advances/records" replace />} />
              <Route path="/advances/records" element={<ProtectedModule moduleKey="advances.records"><AdvanceRecords /></ProtectedModule>} />

              {/* Payroll */}
              <Route path="/payroll"          element={<Navigate to="/payroll/salary" replace />} />
              <Route path="/payroll/salary"   element={<ProtectedModule moduleKey="payroll.salary"><SalaryStructure /></ProtectedModule>} />
              <Route path="/payroll/generate" element={<ProtectedModule moduleKey="payroll.generate"><GeneratePayroll /></ProtectedModule>} />
              <Route path="/payroll/history"  element={<ProtectedModule moduleKey="payroll.history"><PayrollHistory /></ProtectedModule>} />
              <Route path="/payroll/payslips" element={<ProtectedModule moduleKey="payroll.payslips"><Payslips /></ProtectedModule>} />

              {/* Performance */}
              <Route path="/performance"         element={<Navigate to="/performance/reviews" replace />} />
              <Route path="/performance/reviews" element={<ProtectedModule moduleKey="performance.reviews"><PerformanceReviews /></ProtectedModule>} />
              <Route path="/performance/goals"   element={<ProtectedModule moduleKey="performance.goals"><Goals /></ProtectedModule>} />

              {/* Reports */}
              <Route path="/reports" element={<ProtectedModule moduleKey="reports"><Reports /></ProtectedModule>} />

              {/* Settings */}
              <Route path="/settings"         element={<ProtectedModule moduleKey="settings"><Settings /></ProtectedModule>} />
              <Route path="/settings/profile" element={<Settings initialSection="profile" />} />
            </Route>

            {/* ── Catch-all ────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
