import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

/**
 * AuthProvider — manages authentication state across the entire app
 * Stores user info and JWT token in both state and localStorage
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // prevents flash of unauthenticated content

  // On mount, restore auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('cafeToken');
    const storedUser = localStorage.getItem('cafeUser');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('cafeToken');
        localStorage.removeItem('cafeUser');
      }
    }
    setLoading(false);
  }, []);

  /**
   * Login — stores token + user in state and localStorage
   */
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('cafeToken', authToken);
    localStorage.setItem('cafeUser', JSON.stringify(userData));
  };

  /**
   * Logout — clears state, localStorage, and calls backend logout
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors — still log out locally
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('cafeToken');
    localStorage.removeItem('cafeUser');
  };

  const isAdmin = () => user?.role === 'admin';
  const isAuthenticated = () => !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook for consuming AuthContext
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
