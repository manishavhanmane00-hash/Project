import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

/**
 * ProtectedRoute — redirects to login if not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
    <div className="spinner-border spinner-cafe" role="status" />
  </div>;
  return isAuthenticated() ? children : <Navigate to="/" replace />;
};

/**
 * AdminRoute — redirects non-admins to user dashboard
 */
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated()) return <Navigate to="/" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
};

/**
 * PublicRoute — redirects logged-in users away from login/signup
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated()) {
    return <Navigate to={isAdmin() ? '/admin' : '/dashboard'} replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Home */}
      <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />

      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

      {/* User Routes */}
      <Route path="/dashboard/*" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="colored"
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
