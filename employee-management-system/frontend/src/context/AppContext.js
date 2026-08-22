import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  EMPLOYEES, DEPARTMENTS, DESIGNATIONS, LEAVE_REQUESTS,
  LEAVE_BALANCES, ATTENDANCE_DATA, PAYROLL_DATA, PERFORMANCE_REVIEWS
} from '../data/sampleData';

const AppContext = createContext(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider = ({ children }) => {
  // ── Theme ────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('ems-theme') || 'light');

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── Data state (all start empty — no demo data) ──────────────────────────
  const [employees,         setEmployees]         = useState(EMPLOYEES);
  const [departments,       setDepartments]       = useState(DEPARTMENTS);
  const [designations,      setDesignations]      = useState(DESIGNATIONS);
  const [leaveRequests,     setLeaveRequests]     = useState(LEAVE_REQUESTS);
  const [leaveBalances,     setLeaveBalances]     = useState(LEAVE_BALANCES);
  const [attendanceData,    setAttendanceData]    = useState(ATTENDANCE_DATA);
  const [payrollData,       setPayrollData]       = useState(PAYROLL_DATA);
  const [performanceReviews, setPerformanceReviews] = useState(PERFORMANCE_REVIEWS);

  // ── Currency config (INR) ────────────────────────────────────────────────
  const currency = {
    code:   'INR',
    symbol: '₹',
    locale: 'en-IN',
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ems-theme', theme);
  }, [theme]);

  const toggleTheme  = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  const toggleSidebar = () => setSidebarCollapsed(c => !c);

  // ── Employee CRUD ────────────────────────────────────────────────────────
  const addEmployee = (emp) => {
    const count  = employees.length + 1;
    const newEmp = {
      ...emp,
      _id: String(Date.now()),
      id:  `EMP-${String(count).padStart(3, '0')}`,
    };
    setEmployees(prev => [...prev, newEmp]);
    return newEmp;
  };

  const updateEmployee = (id, data) =>
    setEmployees(prev => prev.map(e => e._id === id ? { ...e, ...data } : e));

  const deleteEmployee = (id) =>
    setEmployees(prev => prev.filter(e => e._id !== id));

  // ── Department CRUD ──────────────────────────────────────────────────────
  const addDepartment = (dept) =>
    setDepartments(prev => [...prev, { ...dept, id: Date.now() }]);

  const updateDepartment = (id, data) =>
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));

  const deleteDepartment = (id) =>
    setDepartments(prev => prev.filter(d => d.id !== id));

  // ── Leave ────────────────────────────────────────────────────────────────
  const addLeaveRequest = (req) => {
    const newReq = {
      ...req,
      id:          `LR-${String(leaveRequests.length + 1).padStart(3, '0')}`,
      status:      'pending',
      appliedDate: new Date().toISOString().split('T')[0],
    };
    setLeaveRequests(prev => [...prev, newReq]);
  };

  const updateLeaveStatus = (id, status, reason = '') =>
    setLeaveRequests(prev =>
      prev.map(r => r.id === id ? { ...r, status, rejectionReason: reason } : r)
    );

  // ── Payroll ──────────────────────────────────────────────────────────────
  const generatePayroll = (data) => {
    const newPayroll = {
      ...data,
      id:     `PAY-${String(payrollData.length + 1).padStart(3, '0')}`,
      status: 'pending',
    };
    setPayrollData(prev => [...prev, newPayroll]);
  };

  const approvePayroll = (id) =>
    setPayrollData(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));

  // ── Attendance ───────────────────────────────────────────────────────────
  const markAttendance = (record) => {
    setAttendanceData(prev => {
      const idx = prev.findIndex(
        a => a.date === record.date && a.employeeId === record.employeeId
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = record;
        return updated;
      }
      return [...prev, record];
    });
  };

  const value = {
    // theme
    theme, toggleTheme,
    // sidebar
    sidebarCollapsed, toggleSidebar, setSidebarCollapsed,
    mobileSidebarOpen, setMobileSidebarOpen,
    // currency
    currency,
    // data
    employees,    addEmployee,    updateEmployee,    deleteEmployee,
    departments,  addDepartment,  updateDepartment,  deleteDepartment,
    designations, setDesignations,
    leaveRequests,     addLeaveRequest,  updateLeaveStatus,
    leaveBalances,     setLeaveBalances,
    attendanceData,    markAttendance,
    payrollData,       generatePayroll,  approvePayroll,
    performanceReviews, setPerformanceReviews,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
