import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

/**
 * User Navbar — shown on all user pages
 * Includes cart badge and user profile dropdown
 */
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

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="navbar navbar-expand-lg navbar-cafe navbar-dark sticky-top">
      <div className="container">
        {/* Brand */}
        <Link to="/dashboard" className="navbar-brand-cafe navbar-brand">
          ☕ Brew &amp; Bite
        </Link>

        {/* Mobile toggle */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#userNav"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="userNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link
                to="/dashboard"
                className={`nav-link ${isActive('/dashboard') && !isActive('/dashboard/orders') && !isActive('/dashboard/cart') ? 'active' : ''}`}
              >
                <i className="bi bi-house me-1"></i> Menu
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/dashboard/orders"
                className={`nav-link ${isActive('/dashboard/orders') ? 'active' : ''}`}
              >
                <i className="bi bi-clock-history me-1"></i> My Orders
              </Link>
            </li>
          </ul>

          {/* Cart & User */}
          <div className="d-flex align-items-center gap-3">
            {/* Cart button */}
            <Link to="/dashboard/cart" className="btn btn-light btn-sm position-relative">
              <i className="bi bi-cart3"></i>
              {cartCount > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: '0.7rem' }}
                >
                  {cartCount}
                </span>
              )}
              <span className="ms-1 d-none d-lg-inline">Cart</span>
            </Link>

            {/* User dropdown */}
            <div className="dropdown">
              <button
                className="btn btn-outline-light btn-sm dropdown-toggle"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
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
