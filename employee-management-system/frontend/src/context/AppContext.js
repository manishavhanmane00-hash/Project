import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { employeeAPI, attendanceAPI, leaveAPI, payrollAPI, performanceAPI, notificationAPI } from '../services/api';
import { DEPARTMENTS, DESIGNATIONS } from '../data/sampleData';
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

  // ── Master data (static) ───────────────────────────────────────────────────
  const [departments,  setDepartments]  = useState(DEPARTMENTS);
  const [designations, setDesignations] = useState(DESIGNATIONS);

  // ── DB-backed data ─────────────────────────────────────────────────────────
  const [employees,          setEmployees]          = useState([]);
  const [attendanceData,     setAttendanceData]     = useState([]);
  const [leaveRequests,      setLeaveRequests]      = useState([]);
  const [leaveBalances,      setLeaveBalances]      = useState([]);
  const [payrollData,        setPayrollData]        = useState([]);
  const [performanceReviews, setPerformanceReviews] = useState([]);
  const [notifications,      setNotifications]      = useState([]);

  const currency = { code: 'INR', symbol: '₹', locale: 'en-IN' };
  const toggleSidebar = () => setSidebarCollapsed(c => !c);

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    try {
      const { data } = await employeeAPI.getAll();
      if (data.success) setEmployees(data.data);
    } catch { /* backend not running */ }
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

  // Load all data when user logs in
  useEffect(() => {
    if (!user) {
      setEmployees([]); setAttendanceData([]); setLeaveRequests([]);
      setPayrollData([]); setPerformanceReviews([]); setNotifications([]);
      return;
    }
    fetchEmployees();
    fetchAttendance();
    fetchLeave();
    fetchPayroll();
    fetchPerformance();
    fetchNotifications();
  }, [user, fetchEmployees, fetchAttendance, fetchLeave, fetchPayroll, fetchPerformance, fetchNotifications]);

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

  // ── Department CRUD (static for now) ──────────────────────────────────────
  const addDepartment    = (dept) => setDepartments(prev => [...prev, { ...dept, id: Date.now() }]);
  const updateDepartment = (id, data) => setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
  const deleteDepartment = (id) => setDepartments(prev => prev.filter(d => d.id !== id));

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

  // ── Payroll ────────────────────────────────────────────────────────────────
  const generatePayroll = async (dataArr) => {
    const payload = Array.isArray(dataArr) ? dataArr : [dataArr];
    const { data } = await payrollAPI.generate(payload);
    if (data.success) {
      await fetchPayroll(); // refetch to get accurate state
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
    // Optimistic local add; backend creates it via leave/payroll controllers
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

  const value = {
    sidebarCollapsed, toggleSidebar, setSidebarCollapsed,
    mobileSidebarOpen, setMobileSidebarOpen,
    currency,
    employees,    addEmployee,    updateEmployee,    deleteEmployee,
    departments,  addDepartment,  updateDepartment,  deleteDepartment,
    designations, setDesignations,
    attendanceData, markAttendance, doCheckIn, doCheckOut,
    leaveRequests,  addLeaveRequest, updateLeaveStatus,
    leaveBalances,  setLeaveBalances,
    payrollData,    generatePayroll, approvePayroll,
    performanceReviews, setPerformanceReviews, savePerformanceReview,
    notifications, addNotification, markNotifRead, markAllNotifsRead, deleteNotif,
    // Refresh helpers
    fetchEmployees, fetchAttendance, fetchLeave, fetchPayroll, fetchPerformance, fetchNotifications,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
