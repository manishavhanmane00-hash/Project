import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
  { to: '/admin/orders', label: 'All Orders', icon: 'bi-bag-check' },
  { to: '/admin/payments', label: 'Payments', icon: 'bi-credit-card' },
  { to: '/admin/users', label: 'Customers', icon: 'bi-people' },
  { to: '/admin/login-logs', label: 'Login Activity', icon: 'bi-activity' },
  { to: '/admin/menu', label: 'Manage Menu', icon: 'bi-journal-text' },
];

/**
 * AdminSidebar — fixed left sidebar for admin dashboard
 * Collapsible on mobile
 */
export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.info('Logged out');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="btn btn-sm d-lg-none m-2"
        style={{ background: 'var(--cafe-brown)', color: 'white', position: 'fixed', top: 10, left: 10, zIndex: 1100 }}
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle sidebar"
      >
        <i className={`bi ${collapsed ? 'bi-list' : 'bi-x-lg'}`}></i>
      </button>

      {/* Sidebar */}
      <nav
        className={`admin-sidebar d-flex flex-column ${collapsed ? 'd-none' : ''} d-lg-flex`}
        aria-label="Admin navigation"
      >
        {/* Brand */}
        <div className="sidebar-brand d-flex align-items-center gap-2">
          <span style={{ fontSize: '1.5rem' }}>☕</span>
          <div>
            <div>Brew &amp; Bite</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.6, fontWeight: 400 }}>Admin Panel</div>
          </div>
        </div>

        {/* Admin info */}
        <div className="px-3 py-3 border-bottom border-secondary">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
              style={{ width: 36, height: 36, background: 'var(--cafe-orange)', fontSize: '0.9rem' }}
              aria-hidden="true"
            >
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-white fw-semibold" style={{ fontSize: '0.85rem' }}>{user?.name}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, color: 'white' }}>Administrator</div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <ul className="nav flex-column py-2 flex-grow-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to} className="nav-item">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <i className={`bi ${item.icon} me-2`}></i>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Logout */}
        <div className="p-3 border-top border-secondary">
          <button
            className="btn btn-outline-light btn-sm w-100"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right me-2"></i>Logout
          </button>
        </div>
      </nav>
    </>
  );
}
