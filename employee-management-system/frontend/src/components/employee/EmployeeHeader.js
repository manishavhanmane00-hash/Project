import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Bell, User, ChevronDown,
  Settings, LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../shared/Avatar';

const EmployeeHeader = () => {
  const {
    sidebarCollapsed, toggleSidebar, setMobileSidebarOpen,
    notifications
  } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const unreadCount = (notifications || []).filter(n => !n.read).length;
  const recentNotifs = (notifications || []).slice(0, 5);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notifIcon = (type) => {
    const map = {
      leave: '🏖️',
      payroll: '💰',
      attendance: '🕐',
      performance: '⭐',
      announcement: '📢',
    };
    return map[type] || '🔔';
  };

  return (
    <header className={`header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar toggle */}
      <button
        className="header-toggle"
        onClick={() => { toggleSidebar(); setMobileSidebarOpen(o => !o); }}
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Greeting */}
      <div style={{ flex: 1, paddingLeft: 8 }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user?.name?.split(' ')[0]}</strong>
        </span>
      </div>

      {/* Right actions */}
      <div className="header-actions">
        {/* Notifications */}
        <div className="dropdown" ref={notifRef}>
          <button className="header-btn" onClick={() => setShowNotif(o => !o)} title="Notifications">
            <Bell size={16} />
            {unreadCount > 0 && <span className="header-btn-badge">{unreadCount}</span>}
          </button>

          {showNotif && (
            <div className="dropdown-menu" style={{ minWidth: 320, right: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
                {unreadCount > 0 && <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{unreadCount} new</span>}
              </div>

              {recentNotifs.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No notifications
                </div>
              ) : (
                recentNotifs.map(n => (
                  <div key={n.id}
                    className="dropdown-item"
                    style={{ opacity: n.read ? 0.65 : 1, gap: 12, cursor: 'pointer' }}
                    onClick={() => { navigate('/employee/notifications'); setShowNotif(false); }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>
                      {notifIcon(n.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.825rem', lineHeight: 1.4 }}>{n.message}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                    {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />}
                  </div>
                ))
              )}

              <div
                style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.8rem' }}
                onClick={() => { navigate('/employee/notifications'); setShowNotif(false); }}
              >
                View all notifications
              </div>
            </div>
          )}
        </div>

        <div className="header-divider" />

        {/* Profile dropdown */}
        <div className="dropdown" ref={profileRef}>
          <div className="header-user" onClick={() => setShowProfile(o => !o)}>
            <div className="header-user-info">
              <div className="header-user-name">{user?.name}</div>
              <div className="header-user-role">{user?.designation || 'Employee'}</div>
            </div>
            <Avatar name={user?.name} size="sm" />
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </div>

          {showProfile && (
            <div className="dropdown-menu">
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                {user?.department && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{user.department}</div>
                )}
              </div>
              <div className="dropdown-item" onClick={() => { navigate('/employee/profile'); setShowProfile(false); }}>
                <User size={15} /> My Profile
              </div>
              <div className="dropdown-item" onClick={() => { navigate('/employee/settings'); setShowProfile(false); }}>
                <Settings size={15} /> Settings
              </div>
              <div className="dropdown-item" onClick={() => { navigate('/employee/notifications'); setShowProfile(false); }}>
                <Bell size={15} /> Notifications {unreadCount > 0 && <span className="badge badge-danger" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>{unreadCount}</span>}
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-item danger" onClick={handleLogout}>
                <LogOut size={15} /> Sign Out
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default EmployeeHeader;
