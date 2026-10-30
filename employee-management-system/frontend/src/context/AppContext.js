import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  employeeAPI, attendanceAPI, leaveAPI, payrollAPI, performanceAPI,
  notificationAPI, departmentAPI, taskAPI, reportAPI,
  holidayAPI, overtimeAPI, advanceAPI,
} from '../services/api';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider = ({ children }) => {
  const { user } = useAuth();

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── DB-backed data ─────────────────────────────────────────────────────────
  const [employees,          setEmployees]          = useState([]);
  const [departments,        setDepartments]        = useState([]);
  const [attendanceData,     setAttendanceData]     = useState([]);
  const [leaveRequests,      setLeaveRequests]      = useState([]);
  const [leaveBalances,      setLeaveBalances]      = useState([]);
  const [tasks,              setTasks]              = useState([]);
  const [payrollData,        setPayrollData]        = useState([]);
  const [performanceReviews, setPerformanceReviews] = useState([]);
  const [notifications,      setNotifications]      = useState([]);
  const [dashboardStats,     setDashboardStats]     = useState(null);
  const [holidays,           setHolidays]           = useState([]);
  const [overtimeEntries,    setOvertimeEntries]    = useState([]);
  const [advanceRecords,     setAdvanceRecords]     = useState([]);

  const currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };
  const toggleSidebar = () => setSidebarCollapsed(c => !c);

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    try {
      const { data } = await employeeAPI.getAll();
      if (data.success) setEmployees(data.data);
    } catch { /* backend not running */ }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const { data } = await departmentAPI.getAll();
      if (data.success) setDepartments(data.data);
    } catch { }
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      const { data } = await attendanceAPI.getAll();
      if (data.success) setAttendanceData(data.data);
    } catch { }
  }, []);

  const fetchLeave = useCallback(async () => {
    try {
      const { data } = await leaveAPI.getAll();
      if (data.success) setLeaveRequests(data.data);
    } catch { }
  }, []);

  const fetchLeaveBalances = useCallback(async () => {
    try {
      const { data } = await leaveAPI.getBalance();
      if (data.success) setLeaveBalances(data.data);
    } catch { }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await taskAPI.getAll();
      if (data.success) setTasks(data.data);
    } catch { }
  }, []);

  const fetchPayroll = useCallback(async () => {
    try {
      const { data } = await payrollAPI.getAll();
      if (data.success) setPayrollData(data.data);
    } catch { }
  }, []);

  const fetchPerformance = useCallback(async () => {
    try {
      const { data } = await performanceAPI.getAll();
      if (data.success) setPerformanceReviews(data.data);
    } catch { }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await notificationAPI.getAll();
      if (data.success) setNotifications(data.data);
    } catch { }
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const { data } = await reportAPI.dashboard();
      if (data.success) setDashboardStats(data.data);
    } catch { }
  }, []);

  const fetchHolidays = useCallback(async () => {
    try {
      const { data } = await holidayAPI.getAll();
      if (data.success) setHolidays(data.data);
    } catch { }
  }, []);

  const fetchOvertime = useCallback(async () => {
    try {
      const { data } = await overtimeAPI.getAll();
      if (data.success) setOvertimeEntries(data.data);
    } catch { }
  }, []);

  const fetchAdvances = useCallback(async () => {
    try {
      const { data } = await advanceAPI.getAll();
      if (data.success) setAdvanceRecords(data.data);
    } catch { }
  }, []);

  // Load all data when user logs in
  useEffect(() => {
    if (!user) {
      setEmployees([]); setDepartments([]); setAttendanceData([]); setLeaveRequests([]);
      setPayrollData([]); setPerformanceReviews([]); setNotifications([]); setTasks([]);
      setLeaveBalances([]); setDashboardStats(null);
      setHolidays([]); setOvertimeEntries([]); setAdvanceRecords([]);
      return;
    }
    fetchEmployees();
    fetchDepartments();
    fetchAttendance();
    fetchLeave();
    fetchLeaveBalances();
    fetchTasks();
    fetchPayroll();
    fetchPerformance();
    fetchNotifications();
    fetchDashboardStats();
    fetchHolidays();
    fetchOvertime();
    fetchAdvances();
  }, [user, fetchEmployees, fetchDepartments, fetchAttendance, fetchLeave, fetchLeaveBalances, fetchTasks, fetchPayroll, fetchPerformance, fetchNotifications, fetchDashboardStats, fetchHolidays, fetchOvertime, fetchAdvances]);

  // ── Employee CRUD ──────────────────────────────────────────────────────────
  const addEmployee = async (emp) => {
    const { data } = await employeeAPI.create(emp);
    if (data.success) { setEmployees(prev => [data.data, ...prev]); return data.data; }
    throw new Error(data.message);
  };

  const updateEmployee = async (id, updates) => {
    const { data } = await employeeAPI.update(id, updates);
    if (data.success) { setEmployees(prev => prev.map(e => e._id === id ? data.data : e)); return data.data; }
    throw new Error(data.message);
  };

  const deleteEmployee = async (id) => {
    await employeeAPI.delete(id);
    setEmployees(prev => prev.filter(e => e._id !== id));
  };

  const setEmployeeStatus = async (id, status) => {
    const { data } = await employeeAPI.setStatus(id, { status });
    if (data.success) { setEmployees(prev => prev.map(e => e._id === id ? data.data : e)); return data.data; }
    throw new Error(data.message);
  };

  // ── Department CRUD ──────────────────────────────────────────────────────────
  const addDepartment = async (dept) => {
    const { data } = await departmentAPI.create(dept);
    if (data.success) { setDepartments(prev => [...prev, data.data]); return data.data; }
    throw new Error(data.message);
  };

  const updateDepartment = async (id, updates) => {
    const { data } = await departmentAPI.update(id, updates);
    if (data.success) { setDepartments(prev => prev.map(d => d._id === id ? data.data : d)); return data.data; }
    throw new Error(data.message);
  };

  const deleteDepartment = async (id) => {
    const { data } = await departmentAPI.delete(id);
    if (data.success) { setDepartments(prev => prev.filter(d => d._id !== id)); return data.data; }
    throw new Error(data.message);
  };

  // ── Attendance ─────────────────────────────────────────────────────────────
  const markAttendance = async (record) => {
    try {
      const { data } = await attendanceAPI.mark(record);
      if (data.success) {
        setAttendanceData(prev => {
          const idx = prev.findIndex(a => a.date === data.data.date && (a.employeeId === data.data.employeeId || a._id === data.data._id));
          if (idx >= 0) { const u = [...prev]; u[idx] = data.data; return u; }
          return [data.data, ...prev];
        });
        return data.data;
      }
    } catch { }
  };

  const selfMarkAttendance = async (record) => {
    const { data } = await attendanceAPI.selfMark(record);
    if (data.success) {
      setAttendanceData(prev => {
        const idx = prev.findIndex(a =>
          a.date === data.data.date &&
          (a.userId === data.data.userId ||
           a.email  === data.data.email  ||
           a._id?.toString() === data.data._id?.toString())
        );
        if (idx >= 0) { const u = [...prev]; u[idx] = data.data; return u; }
        return [data.data, ...prev];
      });
      return data.data;
    }
    throw new Error(data.message || 'Failed to save attendance');
  };

  const doCheckIn = async () => {
    const { data } = await attendanceAPI.checkIn();
    if (data.success) {
      setAttendanceData(prev => {
        const idx = prev.findIndex(a => a._id === data.data._id);
        if (idx >= 0) { const u = [...prev]; u[idx] = data.data; return u; }
        return [data.data, ...prev];
      });
      return data;
    }
    throw new Error(data.message);
  };

  const doCheckOut = async () => {
    const { data } = await attendanceAPI.checkOut();
    if (data.success) {
      setAttendanceData(prev => prev.map(a => a._id === data.data._id ? data.data : a));
      return data;
    }
    throw new Error(data.message);
  };

  // ── Leave ──────────────────────────────────────────────────────────────────
  const addLeaveRequest = async (req) => {
    const { data } = await leaveAPI.apply(req);
    if (data.success) {
      setLeaveRequests(prev => [data.data, ...prev]);
      return data.data;
    }
    throw new Error(data.message);
  };

  const updateLeaveStatus = async (id, status, reason = '') => {
    const { data } = await leaveAPI.updateStatus(id, { status, rejectionReason: reason });
    if (data.success) {
      setLeaveRequests(prev => prev.map(r => (r._id === id || r.id === id) ? data.data : r));
      return data.data;
    }
    throw new Error(data.message);
  };

  const cancelLeave = async (id) => {
    const { data } = await leaveAPI.cancel(id);
    if (data.success) {
      setLeaveRequests(prev => prev.map(r => (r._id === id || r.id === id) ? data.data : r));
      return data.data;
    }
    throw new Error(data.message);
  };

  // ── Holidays ───────────────────────────────────────────────────────────────
  const addHoliday = async (holiday) => {
    const { data } = await holidayAPI.create(holiday);
    if (data.success) { setHolidays(prev => [data.data, ...prev]); return data.data; }
    throw new Error(data.message);
  };

  const updateHoliday = async (id, updates) => {
    const { data } = await holidayAPI.update(id, updates);
    if (data.success) { setHolidays(prev => prev.map(h => (h._id === id || h.id === id) ? data.data : h)); return data.data; }
    throw new Error(data.message);
  };

  const deleteHoliday = async (id) => {
    const { data } = await holidayAPI.delete(id);
    if (data.success) { setHolidays(prev => prev.filter(h => h._id !== id && h.id !== id)); return data.data; }
    throw new Error(data.message);
  };

  // ── Overtime ───────────────────────────────────────────────────────────────
  const addOvertime = async (entry) => {
    const { data } = await overtimeAPI.create(entry);
    if (data.success) { setOvertimeEntries(prev => [data.data, ...prev]); return data.data; }
    throw new Error(data.message);
  };

  const updateOvertime = async (id, updates) => {
    const { data } = await overtimeAPI.update(id, updates);
    if (data.success) { setOvertimeEntries(prev => prev.map(o => (o._id === id || o.id === id) ? data.data : o)); return data.data; }
    throw new Error(data.message);
  };

  const settleOvertime = async (id) => {
    const { data } = await overtimeAPI.settle(id);
    if (data.success) { setOvertimeEntries(prev => prev.map(o => (o._id === id || o.id === id) ? data.data : o)); return data.data; }
    throw new Error(data.message);
  };

  const deleteOvertime = async (id) => {
    const { data } = await overtimeAPI.delete(id);
    if (data.success) { setOvertimeEntries(prev => prev.filter(o => o._id !== id && o.id !== id)); return data.data; }
    throw new Error(data.message);
  };

  // ── Advances ───────────────────────────────────────────────────────────────
  const addAdvance = async (record) => {
    const { data } = await advanceAPI.create(record);
    if (data.success) { setAdvanceRecords(prev => [data.data, ...prev]); return data.data; }
    throw new Error(data.message);
  };

  const updateAdvance = async (id, updates) => {
    const { data } = await advanceAPI.update(id, updates);
    if (data.success) { setAdvanceRecords(prev => prev.map(a => (a._id === id || a.id === id) ? data.data : a)); return data.data; }
    throw new Error(data.message);
  };

  const deleteAdvance = async (id) => {
    const { data } = await advanceAPI.delete(id);
    if (data.success) { setAdvanceRecords(prev => prev.filter(a => a._id !== id && a.id !== id)); return data.data; }
    throw new Error(data.message);
  };

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const addTask = async (task) => {
    const { data } = await taskAPI.create(task);
    if (data.success) { setTasks(prev => [data.data, ...prev]); return data.data; }
    throw new Error(data.message);
  };

  const updateTask = async (id, updates) => {
    const { data } = await taskAPI.update(id, updates);
    if (data.success) { setTasks(prev => prev.map(t => t._id === id ? data.data : t)); return data.data; }
    throw new Error(data.message);
  };

  const deleteTask = async (id) => {
    const { data } = await taskAPI.delete(id);
    if (data.success) { setTasks(prev => prev.filter(t => t._id !== id)); return data.data; }
    throw new Error(data.message);
  };

  // ── Payroll ────────────────────────────────────────────────────────────────
  const generatePayroll = async (dataArr) => {
    const payload = Array.isArray(dataArr) ? dataArr : [dataArr];
    const { data } = await payrollAPI.generate(payload);
    if (data.success) {
      await fetchPayroll();
      return data.data;
    }
    throw new Error(data.message);
  };

  const approvePayroll = async (id) => {
    const { data } = await payrollAPI.approve(id);
    if (data.success) {
      setPayrollData(prev => prev.map(p => (p._id === id || p.id === id) ? data.data : p));
      return data.data;
    }
    throw new Error(data.message);
  };

  // ── Performance ────────────────────────────────────────────────────────────
  const savePerformanceReview = async (review) => {
    const { data } = await performanceAPI.create(review);
    if (data.success) {
      setPerformanceReviews(prev => [data.data, ...prev]);
      return data.data;
    }
    throw new Error(data.message);
  };

  // ── Notifications ──────────────────────────────────────────────────────────
  const addNotification = async (notif) => {
    const newNotif = { ...notif, _id: Date.now(), id: Date.now(), createdAt: new Date().toISOString(), isRead: false, read: false };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotifRead = async (id) => {
    try { await notificationAPI.markRead(id); } catch { }
    setNotifications(prev => prev.map(n => (n._id === id || n.id === id) ? { ...n, isRead: true, read: true } : n));
  };

  const markAllNotifsRead = async () => {
    try { await notificationAPI.markAllRead(); } catch { }
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
  };

  const deleteNotif = async (id) => {
    try { await notificationAPI.delete(id); } catch { }
    setNotifications(prev => prev.filter(n => n._id !== id && n.id !== id));
  };

  // Derived designations from employees (for filter dropdowns)
  const designations = [...new Set(employees.map(e => e.designation).filter(Boolean))];

  const value = {
    sidebarCollapsed, toggleSidebar, setSidebarCollapsed,
    mobileSidebarOpen, setMobileSidebarOpen,
    currency,
    employees,    addEmployee,    updateEmployee,    deleteEmployee,    setEmployeeStatus,
    departments,  addDepartment,  updateDepartment,  deleteDepartment,  fetchDepartments,
    designations,
    attendanceData, markAttendance, selfMarkAttendance, doCheckIn, doCheckOut,
    leaveRequests,  addLeaveRequest, updateLeaveStatus, cancelLeave,
    leaveBalances,  setLeaveBalances, fetchLeaveBalances,
    tasks,          addTask, updateTask, deleteTask, fetchTasks,
    payrollData,    generatePayroll, approvePayroll,
    performanceReviews, setPerformanceReviews, savePerformanceReview,
    notifications, addNotification, markNotifRead, markAllNotifsRead, deleteNotif,
    dashboardStats, fetchDashboardStats,
    holidays,        addHoliday,  updateHoliday,  deleteHoliday,  fetchHolidays,
    overtimeEntries, addOvertime, updateOvertime, settleOvertime, deleteOvertime, fetchOvertime,
    advanceRecords,  addAdvance,  updateAdvance,  deleteAdvance,  fetchAdvances,
    // Refresh helpers
    fetchEmployees, fetchAttendance, fetchLeave,
    fetchPayroll, fetchPerformance, fetchNotifications,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
