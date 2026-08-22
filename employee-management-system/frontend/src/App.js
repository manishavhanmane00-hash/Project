import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import AppLayout from './components/layout/AppLayout';

// Auth Pages
import Login          from './pages/auth/Login';
import Register       from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword  from './pages/auth/ResetPassword';

// Main Pages
import Dashboard from './pages/Dashboard';

// Employee Pages
import EmployeeList    from './pages/employees/EmployeeList';
import AddEmployee     from './pages/employees/AddEmployee';
import EmployeeProfile from './pages/employees/EmployeeProfile';

// Department Pages
import Departments from './pages/departments/Departments';
import Roles       from './pages/departments/Roles';

// Attendance Pages
import DailyAttendance   from './pages/attendance/DailyAttendance';
import AttendanceHistory from './pages/attendance/AttendanceHistory';
import AttendanceReports from './pages/attendance/AttendanceReports';

// Leave Pages
import LeaveRequests from './pages/leave/LeaveRequests';
import ApplyLeave    from './pages/leave/ApplyLeave';
import LeaveApproval from './pages/leave/LeaveApproval';
import LeaveBalance  from './pages/leave/LeaveBalance';

// Payroll Pages
import SalaryStructure from './pages/payroll/SalaryStructure';
import GeneratePayroll from './pages/payroll/GeneratePayroll';
import PayrollHistory  from './pages/payroll/PayrollHistory';
import Payslips        from './pages/payroll/Payslips';

// Performance Pages
import PerformanceReviews from './pages/performance/PerformanceReviews';
import Goals              from './pages/performance/Goals';

// Other Pages
import Reports  from './pages/Reports';
import Settings from './pages/Settings';

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

            {/* ── Protected Routes (requires login) ────────────────── */}
            <Route element={<AppLayout />}>
              {/* Dashboard */}
              <Route path="/"          element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Employees */}
              <Route path="/employees"          element={<Navigate to="/employees/list" replace />} />
              <Route path="/employees/list"     element={<EmployeeList />} />
              <Route path="/employees/add"      element={<AddEmployee />} />
              <Route path="/employees/edit/:id" element={<AddEmployee />} />
              <Route path="/employees/:id"      element={<EmployeeProfile />} />

              {/* Departments */}
              <Route path="/departments" element={<Departments />} />
              <Route path="/roles"       element={<Roles />} />

              {/* Attendance */}
              <Route path="/attendance"         element={<Navigate to="/attendance/daily" replace />} />
              <Route path="/attendance/daily"   element={<DailyAttendance />} />
              <Route path="/attendance/history" element={<AttendanceHistory />} />
              <Route path="/attendance/reports" element={<AttendanceReports />} />

              {/* Leave */}
              <Route path="/leave"          element={<Navigate to="/leave/requests" replace />} />
              <Route path="/leave/requests" element={<LeaveRequests />} />
              <Route path="/leave/apply"    element={<ApplyLeave />} />
              <Route path="/leave/approval" element={<LeaveApproval />} />
              <Route path="/leave/balance"  element={<LeaveBalance />} />

              {/* Payroll */}
              <Route path="/payroll"          element={<Navigate to="/payroll/salary" replace />} />
              <Route path="/payroll/salary"   element={<SalaryStructure />} />
              <Route path="/payroll/generate" element={<GeneratePayroll />} />
              <Route path="/payroll/history"  element={<PayrollHistory />} />
              <Route path="/payroll/payslips" element={<Payslips />} />

              {/* Performance */}
              <Route path="/performance"         element={<Navigate to="/performance/reviews" replace />} />
              <Route path="/performance/reviews" element={<PerformanceReviews />} />
              <Route path="/performance/goals"   element={<Goals />} />

              {/* Reports */}
              <Route path="/reports" element={<Reports />} />

              {/* Settings */}
              <Route path="/settings"         element={<Settings />} />
              <Route path="/settings/profile" element={<Settings initialSection="profile" />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
