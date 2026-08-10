import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function UserNavbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    // Avoid matching /dashboard/orders/track as /dashboard/orders
    if (path === '/dashboard/orders') {
      return location.pathname === '/dashboard/orders' ||
        location.pathname.startsWith('/dashboard/orders/');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-cafe navbar-dark sticky-top">
      <div className="container">
        <Link to="/dashboard" className="navbar-brand-cafe navbar-brand">
          ☕ Brew &amp; Bite
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
          data-bs-target="#userNav" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="userNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                <i className="bi bi-house me-1"></i>Home
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/dashboard/menu" className={`nav-link ${isActive('/dashboard/menu') ? 'active' : ''}`}>
                <i className="bi bi-grid me-1"></i>Menu
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/dashboard/orders" className={`nav-link ${isActive('/dashboard/orders') ? 'active' : ''}`}>
                <i className="bi bi-clock-history me-1"></i>Orders
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/dashboard/payments" className={`nav-link ${isActive('/dashboard/payments') ? 'active' : ''}`}>
                <i className="bi bi-credit-card me-1"></i>Payments
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/dashboard/profile" className={`nav-link ${isActive('/dashboard/profile') ? 'active' : ''}`}>
                <i className="bi bi-person me-1"></i>Profile
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            {/* Cart */}
            <Link to="/dashboard/cart" className="btn btn-light btn-sm position-relative">
              <i className="bi bi-cart3"></i>
              {cartCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: '0.7rem' }}>
                  {cartCount}
                </span>
              )}
              <span className="ms-1 d-none d-lg-inline">Cart</span>
            </Link>

            {/* User dropdown */}
            <div className="dropdown">
              <button className="btn btn-outline-light btn-sm dropdown-toggle"
                data-bs-toggle="dropdown" aria-expanded="false">
                <i className="bi bi-person-circle me-1"></i>
                <span className="d-none d-lg-inline">{user?.name}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <span className="dropdown-item-text fw-semibold">{user?.name}</span>
                  <span className="dropdown-item-text text-muted small">{user?.email}</span>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <Link to="/dashboard/profile" className="dropdown-item">
                    <i className="bi bi-person me-2"></i>My Profile
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard/orders" className="dropdown-item">
                    <i className="bi bi-clock-history me-2"></i>My Orders
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard/payments" className="dropdown-item">
                    <i className="bi bi-credit-card me-2"></i>Payment History
                  </Link>
                </li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
