import axios from 'axios';

const BASE = 'http://localhost:5000/api';

// Attach the auth token to every request
const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ems-token');
  if (token) config.headers['x-user-info'] = token;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  googleLogin:    (data) => api.post('/auth/google', data),
  getMe:          ()     => api.get('/auth/me'),
  updateMe:       (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  getUsers:       ()     => api.get('/auth/users'),        // admin: list all users
};

// ── Employees (admin CRUD) ────────────────────────────────────────────────────
export const employeeAPI = {
  getAll:   ()         => api.get('/employees'),
  getById:  (id)       => api.get(`/employees/${id}`),
  create:   (data)     => api.post('/employees', data),
  update:   (id, data) => api.put(`/employees/${id}`, data),
  delete:   (id)       => api.delete(`/employees/${id}`),
};

// ── Attendance ────────────────────────────────────────────────────────────────
export const attendanceAPI = {
  getAll:   (params)   => api.get('/attendance', { params }),
  mark:     (data)     => api.post('/attendance', data),
  checkIn:  ()         => api.post('/attendance/check-in'),
  checkOut: ()         => api.put('/attendance/check-out'),
};

// ── Leave ─────────────────────────────────────────────────────────────────────
export const leaveAPI = {
  getAll:        (params)       => api.get('/leave', { params }),
  apply:         (data)         => api.post('/leave', data),
  updateStatus:  (id, data)     => api.put(`/leave/${id}/status`, data),
};

// ── Payroll ───────────────────────────────────────────────────────────────────
export const payrollAPI = {
  getAll:   (params)   => api.get('/payroll', { params }),
  generate: (data)     => api.post('/payroll', data),
  approve:  (id)       => api.put(`/payroll/${id}/approve`),
};

// ── Performance ───────────────────────────────────────────────────────────────
export const performanceAPI = {
  getAll:   (params)   => api.get('/performance', { params }),
  create:   (data)     => api.post('/performance', data),
  update:   (id, data) => api.put(`/performance/${id}`, data),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll:     ()    => api.get('/notifications'),
  markRead:   (id)  => api.put(`/notifications/${id}/read`),
  markAllRead:()    => api.put('/notifications/read-all'),
  delete:     (id)  => api.delete(`/notifications/${id}`),
};

// ── AI ────────────────────────────────────────────────────────────────────────
export const aiAPI = {
  adminChat:           (data) => api.post('/ai/admin/chat', data),
  adminInsights:       (data) => api.post('/ai/admin/insights', data),
  attendanceAnalysis:  (data) => api.post('/ai/admin/attendance-analysis', data),
  leaveSummary:        (data) => api.post('/ai/admin/leave-summary', data),
  payrollInsights:     (data) => api.post('/ai/admin/payroll-insights', data),
  performanceSummary:  (data) => api.post('/ai/admin/performance-summary', data),
  generateReport:      (data) => api.post('/ai/admin/generate-report', data),
  employeeChat:        (data) => api.post('/ai/employee/chat', data),
  employeeWeeklySummary:(data)=> api.post('/ai/employee/weekly-summary', data),
  policyChat:          (data) => api.post('/ai/policy', data),
};

export default api;
