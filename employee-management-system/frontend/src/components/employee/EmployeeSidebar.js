import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, User, Clock, PlaneTakeoff, DollarSign,
  Star, Bell, Settings, LogOut, Shield
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../shared/Avatar';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',      path: '/employee/dashboard' },
  { icon: User,            label: 'My Profile',     path: '/employee/profile'   },
  { icon: Clock,           label: 'My Attendance',  path: '/employee/attendance'},
  { icon: PlaneTakeoff,    label: 'My Leave',       path: '/employee/leave'     },
  { icon: DollarSign,      label: 'My Payroll',     path: '/employee/payroll'   },
  { icon: Star,            label: 'My Performance', path: '/employee/performance'},
  { icon: Bell,            label: 'Notifications',  path: '/employee/notifications'},
  { icon: Settings,        label: 'Settings',       path: '/employee/settings'  },
];

const NavItemComponent = ({ item, collapsed, unreadCount }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  const Icon = item.icon;
  const showBadge = item.path === '/employee/notifications' && unreadCount > 0;

  return (
    <div className="nav-item">
      <div
        className={`nav-link ${isActive ? 'active' : ''}`}
        onClick={() => navigate(item.path)}
        title={collapsed ? item.label : ''}
      >
        {Icon && <Icon size={18} className="nav-icon" />}
        {!collapsed && (
          <>
            <span className="nav-label">{item.label}</span>
            {showBadge && (
              <span className="nav-badge" style={{ background: 'var(--danger)', color: 'white', fontSize: '0.65rem', padding: '1px 6px' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </>
        )}
        {collapsed && showBadge && (
          <span style={{
            position: 'absolute', top: 4, right: 4, width: 8, height: 8,
            borderRadius: '50%', background: 'var(--danger)',
          }} />
        )}
      </div>
    </div>
  );
};

const EmployeeSidebar = () => {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, notifications } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const unreadCount = (notifications || []).filter(n => !n.read).length;

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
              <span>Employee</span> Portal
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            {!sidebarCollapsed && <div className="nav-section-label">Navigation</div>}
            {NAV_ITEMS.map(item => (
              <NavItemComponent
                key={item.path}
                item={item}
                collapsed={sidebarCollapsed}
                unreadCount={unreadCount}
              />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {!sidebarCollapsed ? (
            <>
              <div className="sidebar-user" onClick={() => navigate('/employee/profile')}>
                <Avatar name={user?.name} size="sm" />
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">{user?.name}</div>
                  <div className="sidebar-user-role">Employee</div>
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

export default EmployeeSidebar;
