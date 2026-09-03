import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const loadGoogleScript = () => {
  if (document.getElementById('google-gsi-script')) return;
  const script = document.createElement('script');
  script.id = 'google-gsi-script';
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
};

const decodeJwt = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch { return null; }
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ems-user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadGoogleScript(); }, []);

  const persistUser = (userInfo, token) => {
    setUser(userInfo);
    localStorage.setItem('ems-user', JSON.stringify(userInfo));
    if (token) localStorage.setItem('ems-token', token);
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });
      if (data.success) {
        persistUser(data.user, data.token);
        setLoading(false);
        return { success: true, role: data.user.role };
      }
      setLoading(false);
      return { success: false, error: data.message };
    } catch (err) {
      setLoading(false);
      return { success: false, error: err.response?.data?.message || 'Login failed' };
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const register = async (data) => {
    setLoading(true);
    try {
      const res = await authAPI.register(data);
      if (res.data.success) {
        persistUser(res.data.user, res.data.token);
        setLoading(false);
        return { success: true, isFirstUser: res.data.isFirstUser };
      }
      setLoading(false);
      return { success: false, error: res.data.message };
    } catch (err) {
      setLoading(false);
      return { success: false, error: err.response?.data?.message || 'Registration failed' };
    }
  };

  // ── Google Sign-In ─────────────────────────────────────────────────────────
  const loginWithGoogle = async (credentialResponse) => {
    setLoading(true);
    try {
      const payload = decodeJwt(credentialResponse?.credential);
      if (!payload?.email) {
        setLoading(false);
        return { success: false, error: 'Could not read Google account information.' };
      }
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        setLoading(false);
        return { success: false, error: 'Google session expired. Please sign in again.' };
      }
      const res = await authAPI.googleLogin({
        email: payload.email,
        name: payload.name,
        googleId: payload.sub,
        avatar: payload.picture || null,
      });
      if (res.data.success) {
        persistUser(res.data.user, res.data.token);
        setLoading(false);
        return { success: true, role: res.data.user.role, isNew: res.data.isNew };
      }
      setLoading(false);
      return { success: false, error: res.data.message };
    } catch (err) {
      setLoading(false);
      return { success: false, error: err.response?.data?.message || 'Google sign-in failed.' };
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    localStorage.removeItem('ems-user');
    localStorage.removeItem('ems-token');
    if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
  };

  // ── Update profile (calls backend) ────────────────────────────────────────
  const updateProfile = async (data) => {
    try {
      const res = await authAPI.updateMe(data);
      if (res.data.success) {
        persistUser(res.data.user, res.data.token);
        return { success: true };
      }
      return { success: false, error: res.data.message };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Update failed' };
    }
  };

  // ── Change password ────────────────────────────────────────────────────────
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await authAPI.changePassword({ currentPassword, newPassword });
      return res.data.success ? { success: true } : { success: false, error: res.data.message };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Password change failed' };
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const hasPermission = (permission) => {
    if (!user) return false;
    const map = {
      Admin:    ['*'],
      HR:       ['employees', 'attendance', 'leave', 'payroll', 'reports', 'departments'],
      Manager:  ['team_employees', 'attendance', 'leave_approval', 'performance'],
      Employee: ['my_profile', 'my_attendance', 'my_leave', 'my_payroll', 'my_performance'],
    };
    const perms = map[user.role] || [];
    return perms.includes('*') || perms.includes(permission);
  };

  const isAdmin    = () => user?.role === 'Admin' || user?.role === 'HR' || user?.role === 'Manager';
  const isEmployee = () => user?.role === 'Employee';

  // Legacy compatibility: getRegistry returns empty array (no longer needed)
  const getRegistry   = () => [];
  const hasAnyAccount = () => !!user;

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, loginWithGoogle, logout, register,
      hasPermission, getRegistry, hasAnyAccount,
      updateProfile, changePassword,
      isAdmin, isEmployee,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
