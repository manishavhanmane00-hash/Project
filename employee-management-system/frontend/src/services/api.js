import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Axios instance with base URL
const api = axios.create({ baseURL: BASE });

// ── Request interceptor: attach JWT as Bearer token ───────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ems-token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: handle 401 globally ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server responds 401 (expired/invalid token), force logout
    if (error.response?.status === 401) {
      localStorage.removeItem('ems-token');
      localStorage.removeItem('ems-user');
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  googleLogin:    (data) => api.post('/auth/google', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  getMe:          ()     => api.get('/auth/me'),
  updateMe:       (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  getUsers:       ()     => api.get('/auth/users'),
  setUserStatus:  (id, data) => api.put(`/auth/users/${id}/status`, data),
};

// ── Employees ─────────────────────────────────────────────────────────────────
export const employeeAPI = {
  getAll:       (params)   => api.get('/employees', { params }),
  getById:      (id)       => api.get(`/employees/${id}`),
  getMe:        ()         => api.get('/employees/me'),
  create:       (data)     => api.post('/employees', data),
  update:       (id, data) => api.put(`/employees/${id}`, data),
  setStatus:    (id, data) => api.patch(`/employees/${id}/status`, data),
  delete:       (id)       => api.delete(`/employees/${id}`),
};

// ── Departments ───────────────────────────────────────────────────────────────
export const departmentAPI = {
  getAll:   ()           => api.get('/departments'),
  getById:  (id)         => api.get(`/departments/${id}`),
  create:   (data)       => api.post('/departments', data),
  update:   (id, data)   => api.put(`/departments/${id}`, data),
  delete:   (id)         => api.delete(`/departments/${id}`),
};

// ── Attendance ────────────────────────────────────────────────────────────────
export const attendanceAPI = {
  getAll:     (params) => api.get('/attendance', { params }),
  mark:       (data)   => api.post('/attendance', data),
  selfMark:   (data)   => api.post('/attendance/self', data),
  checkIn:    ()       => api.post('/attendance/check-in'),
  checkOut:   ()       => api.put('/attendance/check-out'),
  correct:    (id, data) => api.put(`/attendance/${id}/correct`, data),
  mySummary:  (month)  => api.get('/attendance/my-summary', { params: { month } }),
};

// ── Leave ─────────────────────────────────────────────────────────────────────
export const leaveAPI = {
  getAll:       (params)    => api.get('/leave', { params }),
  getBalance:   ()          => api.get('/leave/balance'),
  apply:        (data)      => api.post('/leave', data),
  updateStatus: (id, data)  => api.put(`/leave/${id}/status`, data),
  cancel:       (id)        => api.put(`/leave/${id}/cancel`),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const taskAPI = {
  getAll:   (params)   => api.get('/tasks', { params }),
  create:   (data)     => api.post('/tasks', data),
  update:   (id, data) => api.put(`/tasks/${id}`, data),
  delete:   (id)       => api.delete(`/tasks/${id}`),
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

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportAPI = {
  dashboard:   ()       => api.get('/reports/dashboard'),
  attendance:  (params) => api.get('/reports/attendance', { params }),
  leave:       (params) => api.get('/reports/leave', { params }),
  employees:   (params) => api.get('/reports/employees', { params }),
  departments: ()       => api.get('/reports/departments'),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll:      ()    => api.get('/notifications'),
  markRead:    (id)  => api.put(`/notifications/${id}/read`),
  markAllRead: ()    => api.put('/notifications/read-all'),
  delete:      (id)  => api.delete(`/notifications/${id}`),
};

export default api;
