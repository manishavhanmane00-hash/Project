import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// ── User registry — stored in localStorage, no pre-loaded demo accounts ──────
// The first account created automatically gets the Admin role.
const STORAGE_KEY = 'ems-users-registry';

const loadRegistry = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveRegistry = (users) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ems-user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // ── Login ────────────────────────────────────────────────────────────────
  const login = async (email, password, remember = false) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // simulate network

    const registry = loadRegistry();
    const found = registry.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    setLoading(false);

    if (found) {
      const { password: _pw, ...userInfo } = found;
      setUser(userInfo);
      if (remember) localStorage.setItem('ems-user', JSON.stringify(userInfo));
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  // ── Register / Create account ────────────────────────────────────────────
  const register = async (data) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const registry = loadRegistry();
    const exists = registry.some(u => u.email.toLowerCase() === data.email.toLowerCase());

    if (exists) {
      setLoading(false);
      return { success: false, error: 'An account with this email already exists' };
    }

    // First registered account is always Admin
    const isFirst = registry.length === 0;
    const newUser = {
      id: Date.now(),
      name: data.name,
      email: data.email,
      password: data.password,
      role: isFirst ? 'Admin' : (data.role || 'Employee'),
      designation: data.designation || '',
      department: data.department || '',
    };

    const updated = [...registry, newUser];
    saveRegistry(updated);

    const { password: _pw, ...userInfo } = newUser;
    setUser(userInfo);
    localStorage.setItem('ems-user', JSON.stringify(userInfo));

    setLoading(false);
    return { success: true, isFirstUser: isFirst };
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    localStorage.removeItem('ems-user');
  };

  // ── Permission helper ────────────────────────────────────────────────────
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

  // ── Helpers for user management ──────────────────────────────────────────
  const getRegistry   = () => loadRegistry().map(({ password: _p, ...u }) => u);
  const hasAnyAccount = () => loadRegistry().length > 0;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, hasPermission, getRegistry, hasAnyAccount }}>
      {children}
    </AuthContext.Provider>
  );
};
