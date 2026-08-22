import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserPlus, Building2, Briefcase,
  Clock, CalendarDays, BarChart3, CalendarCheck, PlaneTakeoff,
  CheckCircle, Wallet, DollarSign, FileText, Star, Target,
  Settings, ChevronRight, LogOut, ClipboardList, TrendingUp,
  Receipt, Shield, Menu
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../shared/Avatar';

const NAV_ITEMS = [
  {
    label: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ],
  },
  {
    label: 'Employees',
    items: [
      {
        icon: Users, label: 'Employees', path: '/employees',
        sub: [
          { label: 'Employee List', path: '/employees/list' },
          { label: 'Add Employee', path: '/employees/add' },
        ],
      },
      { icon: Building2, label: 'Departments', path: '/departments' },
      { icon: Briefcase, label: 'Roles & Designations', path: '/roles' },
    ],
  },
  {
    label: 'Attendance',
    items: [
      {
        icon: Clock, label: 'Attendance', path: '/attendance',
        sub: [
          { label: 'Daily Attendance', path: '/attendance/daily' },
          { label: 'Attendance History', path: '/attendance/history' },
          { label: 'Attendance Reports', path: '/attendance/reports' },
        ],
      },
    ],
  },
  {
    label: 'Leave',
    items: [
      {
        icon: PlaneTakeoff, label: 'Leave Management', path: '/leave',
        sub: [
          { label: 'Leave Requests', path: '/leave/requests' },
          { label: 'Apply Leave', path: '/leave/apply' },
          { label: 'Leave Approval', path: '/leave/approval' },
          { label: 'Leave Balance', path: '/leave/balance' },
        ],
        badge: 3,
      },
    ],
  },
  {
    label: 'Payroll',
    items: [
      {
        icon: DollarSign, label: 'Payroll', path: '/payroll',
        sub: [
          { label: 'Salary Structure', path: '/payroll/salary' },
          { label: 'Generate Payroll', path: '/payroll/generate' },
          { label: 'Payroll History', path: '/payroll/history' },
          { label: 'Payslips', path: '/payroll/payslips' },
        ],
      },
    ],
  },
  {
    label: 'Performance',
    items: [
      {
        icon: Star, label: 'Performance', path: '/performance',
        sub: [
          { label: 'Performance Reviews', path: '/performance/reviews' },
          { label: 'Goals & KPIs', path: '/performance/goals' },
        ],
      },
    ],
  },
  {
    label: 'Reports',
    items: [
      { icon: BarChart3, label: 'Reports', path: '/reports' },
    ],
  },
  {
    label: 'System',
    items: [
      { icon: Settings, label: 'Settings', path: '/settings' },
    ],
  },
];

const NavItemComponent = ({ item, collapsed, depth = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  const [open, setOpen] = useState(isActive);
  const Icon = item.icon;

  if (item.sub) {
    return (
      <div className="nav-item">
        <div
          className={`nav-link ${isActive ? 'active' : ''}`}
          onClick={() => {
            if (!collapsed) setOpen(o => !o);
            else navigate(item.sub[0].path);
          }}
        >
          {Icon && <Icon size={18} className="nav-icon" />}
          {!collapsed && (
            <>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
              <ChevronRight size={14} className={`nav-arrow ${open ? 'open' : ''}`} />
            </>
          )}
        </div>
        {!collapsed && open && (
          <div className="nav-submenu">
            {item.sub.map(sub => (
              <SubNavItem key={sub.path} item={sub} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="nav-item">
      <div
        className={`nav-link ${isActive ? 'active' : ''}`}
        onClick={() => navigate(item.path)}
        title={collapsed ? item.label : ''}
      >
        {Icon && <Icon size={18} className="nav-icon" />}
        {!collapsed && <span className="nav-label">{item.label}</span>}
      </div>
    </div>
  );
};

const SubNavItem = ({ item }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === item.path;

  return (
    <div
      className={`nav-submenu-item ${isActive ? 'active' : ''}`}
      onClick={() => navigate(item.path)}
    >
      <span className="nav-submenu-dot" />
      {item.label}
    </div>
  );
};

const Sidebar = () => {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {mobileSidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Shield size={20} color="white" />
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-logo-text">
              <span>Acme</span>Corp EMS
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(section => (
            <div key={section.label} className="nav-section">
              {!sidebarCollapsed && (
                <div className="nav-section-label">{section.label}</div>
              )}
              {section.items.map(item => (
                <NavItemComponent
                  key={item.path}
                  item={item}
                  collapsed={sidebarCollapsed}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {!sidebarCollapsed ? (
            <>
              <div className="sidebar-user" onClick={() => navigate('/settings/profile')}>
                <Avatar name={user?.name} size="sm" />
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">{user?.name}</div>
                  <div className="sidebar-user-role">{user?.role}</div>
                </div>
              </div>
              <button
                className="btn btn-ghost w-full"
                style={{ marginTop: 8, justifyContent: 'flex-start', gap: 10, color: 'var(--danger)', fontSize: '0.875rem' }}
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <Avatar name={user?.name} size="sm" />
              <button className="btn-icon danger" onClick={handleLogout} title="Sign Out">
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
