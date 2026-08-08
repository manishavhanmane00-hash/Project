import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserNavbar from '../components/user/UserNavbar';
import Menu from '../components/user/Menu';
import Cart from '../components/user/Cart';
import OrderHistory from '../components/user/OrderHistory';
import OrderTracking from '../components/user/OrderTracking';
import PaymentSlip from '../components/user/PaymentSlip';
import { useAuth } from '../context/AuthContext';

/**
 * UserDashboard — wraps all user-facing pages with the shared navbar
 */
export default function UserDashboard() {
  const { user } = useAuth();

  return (
    <div>
      {/* Persistent top navbar */}
      <UserNavbar />

      {/* Page content */}
      <div className="container py-4">
        <Routes>
          <Route
            index
            element={
              <>
                {/* Welcome banner */}
                <div className="alert alert-warning border-0 mb-4 rounded-3" role="region" aria-label="Welcome message">
                  <div className="d-flex align-items-center gap-3">
                    <span style={{ fontSize: '2rem' }}>👋</span>
                    <div>
                      <div className="fw-bold fs-5">Welcome back, {user?.name}!</div>
                      <div className="text-muted small">Browse our menu and order your favorites.</div>
                    </div>
                  </div>
                </div>
                <Menu />
              </>
            }
          />
          <Route path="cart" element={<Cart />} />
          <Route path="orders" element={<OrderHistory />} />
          <Route path="orders/track/:orderId" element={<OrderTracking />} />
          <Route path="orders/receipt/:orderId" element={<PaymentSlip />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}
