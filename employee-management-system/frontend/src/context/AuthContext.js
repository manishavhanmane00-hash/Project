import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// ── Load Google Identity Services script once ────────────────────────────────
const loadGoogleScript = () => {
  if (document.getElementById('google-gsi-script')) return;
  const script = document.createElement('script');
  script.id  = 'google-gsi-script';
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
};

// ── Decode a JWT ID token (header.payload.sig) without a library ─────────────
const decodeJwt = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

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

  // Pre-load the Google script as soon as AuthProvider mounts
  useEffect(() => { loadGoogleScript(); }, []);

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
      return { success: true, role: userInfo.role };
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

  // ── Google Sign-In ────────────────────────────────────────────────────────
  // Called with the credential response object from Google's callback.
  // Integrates into the existing localStorage registry:
  //   • Existing email  → log in as that user (preserving their role)
  //   • New email       → register as Employee (or Admin if first account)
  const loginWithGoogle = async (credentialResponse) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 400)); // brief UX pause

    try {
      const payload = decodeJwt(credentialResponse?.credential);
      if (!payload || !payload.email) {
        setLoading(false);
        return { success: false, error: 'Could not read Google account information. Please try again.' };
      }

      // Validate token is not expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        setLoading(false);
        return { success: false, error: 'Google session expired. Please sign in again.' };
      }

      const registry = loadRegistry();
      const email    = payload.email.toLowerCase();
      const existing = registry.find(u => u.email.toLowerCase() === email);

      let userInfo;

      if (existing) {
        // ── Existing account: sign in, preserve role ──────────────────────
        const { password: _pw, ...info } = existing;
        userInfo = info;
      } else {
        // ── New account: register via Google ─────────────────────────────
        const isFirst = registry.length === 0;
        const newUser = {
          id:          Date.now(),
          name:        payload.name  || email.split('@')[0],
          email,
          password:    null,          // Google-only account — no password
          role:        isFirst ? 'Admin' : 'Employee',
          designation: '',
          department:  '',
          googleId:    payload.sub,
          avatar:      payload.picture || null,
        };
        saveRegistry([...registry, newUser]);
        const { password: _pw, ...info } = newUser;
        userInfo = info;
      }

      setUser(userInfo);
      localStorage.setItem('ems-user', JSON.stringify(userInfo));
      setLoading(false);
      return { success: true, role: userInfo.role, isNew: !existing };

    } catch {
      setLoading(false);
      return { success: false, error: 'Google sign-in failed. Please try again.' };
    }
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    localStorage.removeItem('ems-user');
    // Revoke Google session so the account-picker shows on next login
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
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

  // ── Update current user profile ──────────────────────────────────────────
  const updateProfile = (data) => {
    const registry = loadRegistry();
    const updated = registry.map(u =>
      u.id === user.id ? { ...u, ...data } : u
    );
    saveRegistry(updated);
    const newUser = { ...user, ...data };
    setUser(newUser);
    localStorage.setItem('ems-user', JSON.stringify(newUser));
    return { success: true };
  };

  // ── Change password ───────────────────────────────────────────────────────
  const changePassword = (currentPassword, newPassword) => {
    const registry = loadRegistry();
    const found = registry.find(u => u.id === user.id);
    if (!found || found.password !== currentPassword) {
      return { success: false, error: 'Current password is incorrect' };
    }
    const updated = registry.map(u => u.id === user.id ? { ...u, password: newPassword } : u);
    saveRegistry(updated);
    return { success: true };
  };

  // ── Helpers for user management ──────────────────────────────────────────
  const getRegistry   = () => loadRegistry().map(({ password: _p, ...u }) => u);
  const hasAnyAccount = () => loadRegistry().length > 0;

  // ── Role helpers ──────────────────────────────────────────────────────────
  const isAdmin    = () => user?.role === 'Admin' || user?.role === 'HR' || user?.role === 'Manager';
  const isEmployee = () => user?.role === 'Employee';

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, register, hasPermission, getRegistry, hasAnyAccount, updateProfile, changePassword, isAdmin, isEmployee }}>
      {children}
    </AuthContext.Provider>
  );
};
