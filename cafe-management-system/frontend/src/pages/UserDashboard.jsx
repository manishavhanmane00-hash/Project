import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import UserNavbar from '../components/user/UserNavbar';
import Menu from '../components/user/Menu';
import Cart from '../components/user/Cart';
import Checkout from '../components/user/Checkout';
import OrderSuccess from '../components/user/OrderSuccess';
import Profile from '../components/user/Profile';
import OrderHistory from '../components/user/OrderHistory';
import OrderTracking from '../components/user/OrderTracking';
import PaymentSlip from '../components/user/PaymentSlip';
import UserPaymentHistory from '../components/user/UserPaymentHistory';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function Home() {
  const { user } = useAuth();
  const { cartCount, cartTotal } = useCart();

  return (
    <div>
      {/* Hero Welcome Banner */}
      <div className="home-hero mb-4">
        <div className="home-hero-content">
          <div className="home-hero-emoji">☕</div>
          <h2 className="home-hero-title">Welcome to Brew &amp; Bite, {user?.name}!</h2>
          <p className="home-hero-sub">Fresh brews, tasty bites — order your favorites today.</p>
          <Link to="/dashboard/menu" className="btn btn-cafe mt-2">
            <i className="bi bi-grid me-2"></i>Browse Menu
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="home-stat-card">
            <div className="home-stat-icon">🛒</div>
            <div className="home-stat-value">{cartCount}</div>
            <div className="home-stat-label">Items in Cart</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="home-stat-card">
            <div className="home-stat-icon">💰</div>
            <div className="home-stat-value">₹{cartTotal}</div>
            <div className="home-stat-label">Cart Total</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <Link to="/dashboard/orders" className="home-stat-card text-decoration-none">
            <div className="home-stat-icon">📋</div>
            <div className="home-stat-value">Orders</div>
            <div className="home-stat-label">Order History</div>
          </Link>
        </div>
        <div className="col-6 col-md-3">
          <Link to="/dashboard/payments" className="home-stat-card text-decoration-none">
            <div className="home-stat-icon">💳</div>
            <div className="home-stat-value">Payments</div>
            <div className="home-stat-label">Payment History</div>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-cafe p-4">
        <h6 className="fw-bold mb-3" style={{ color: 'var(--cafe-brown-dark)' }}>Quick Actions</h6>
        <div className="d-flex flex-wrap gap-2">
          <Link to="/dashboard/menu" className="btn btn-cafe btn-sm">
            <i className="bi bi-grid me-1"></i>View Menu
          </Link>
          <Link to="/dashboard/cart" className="btn btn-cafe-outline btn-sm">
            <i className="bi bi-cart3 me-1"></i>View Cart
          </Link>
          {cartCount > 0 && (
            <Link to="/dashboard/checkout" className="btn btn-cafe btn-sm">
              <i className="bi bi-bag-check me-1"></i>Checkout ({cartCount})
            </Link>
          )}
          <Link to="/dashboard/orders" className="btn btn-cafe-outline btn-sm">
            <i className="bi bi-clock-history me-1"></i>My Orders
          </Link>
          <Link to="/dashboard/payments" className="btn btn-cafe-outline btn-sm">
            <i className="bi bi-credit-card me-1"></i>Payments
          </Link>
          <Link to="/dashboard/profile" className="btn btn-cafe-outline btn-sm">
            <i className="bi bi-person me-1"></i>My Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  return (
    <div>
      <UserNavbar />
      <div className="container py-4">
        <Routes>
          <Route index element={<Home />} />
          <Route path="menu" element={<Menu />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-success/:orderId" element={<OrderSuccess />} />
          <Route path="profile" element={<Profile />} />
          <Route path="orders" element={<OrderHistory />} />
          <Route path="orders/track/:orderId" element={<OrderTracking />} />
          <Route path="orders/receipt/:orderId" element={<PaymentSlip />} />
          <Route path="payments" element={<UserPaymentHistory />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}
