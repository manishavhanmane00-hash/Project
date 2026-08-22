import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Search, Bell, Sun, Moon, User, ChevronDown,
  Settings, LogOut, HelpCircle, Calendar, Users, DollarSign, Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../shared/Avatar';
import Badge from '../shared/Badge';

const Header = () => {
  const { sidebarCollapsed, toggleSidebar, theme, toggleTheme, setMobileSidebarOpen,
          leaveRequests, employees, payrollData, attendanceData } = useApp();
  const { user, logout } = useAuth();
  const navigate     = useNavigate();
  const [showNotif,   setShowNotif]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchVal,   setSearchVal]   = useState('');
  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  // ── Build notifications dynamically from real data (no hardcoded demo text)
  const notifications = useMemo(() => {
    const notes = [];

    // Pending leave requests
    const pending = leaveRequests.filter(r => r.status === 'pending');
    if (pending.length > 0) {
      notes.push({
        id: 'leave-pending',
        icon: Calendar,
        color: 'var(--warning)',
        text: `${pending.length} leave request${pending.length > 1 ? 's' : ''} awaiting approval`,
        link: '/leave/approval',
        read: false,
      });
    }

    // Pending payroll
    const pendingPayroll = payrollData.filter(p => p.status === 'pending');
    if (pendingPayroll.length > 0) {
      notes.push({
        id: 'payroll-pending',
        icon: DollarSign,
        color: 'var(--teal)',
        text: `${pendingPayroll.length} payroll record${pendingPayroll.length > 1 ? 's' : ''} pending approval`,
        link: '/payroll/history',
        read: false,
      });
    }

    // New employees (joined in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newEmps = employees.filter(e => e.joiningDate && new Date(e.joiningDate) >= thirtyDaysAgo);
    if (newEmps.length > 0) {
      notes.push({
        id: 'new-employees',
        icon: Users,
        color: 'var(--primary)',
        text: `${newEmps.length} new employee${newEmps.length > 1 ? 's' : ''} joined recently`,
        link: '/employees/list',
        read: true,
      });
    }

    // Absent today
    const today        = new Date().toISOString().split('T')[0];
    const absentToday  = attendanceData.filter(a => a.date === today && a.status === 'absent');
    if (absentToday.length > 0) {
      notes.push({
        id: 'absent-today',
        icon: Clock,
        color: 'var(--danger)',
        text: `${absentToday.length} employee${absentToday.length > 1 ? 's' : ''} absent today`,
        link: '/attendance/daily',
        read: true,
      });
    }

    return notes;
  }, [leaveRequests, payrollData, employees, attendanceData]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className={`header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar toggle */}
      <button className="header-toggle"
        onClick={() => { toggleSidebar(); setMobileSidebarOpen(o => !o); }}
        aria-label="Toggle sidebar">
        <Menu size={18} />
      </button>

      {/* Search */}
      <div className="header-search">
        <Search size={14} className="header-search-icon" />
        <input
          type="text"
          placeholder="Search employees, reports…"
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          aria-label="Search"
        />
      </div>

      {/* Right-hand actions */}
      <div className="header-actions">
        {/* Theme toggle */}
        <button className="header-btn" onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

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

              {notifications.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No notifications right now
                </div>
              ) : (
                notifications.map(n => {
                  const NIcon = n.icon;
                  return (
                    <div key={n.id} className="dropdown-item" style={{ opacity: n.read ? 0.65 : 1, gap: 12, cursor: 'pointer' }}
                      onClick={() => { navigate(n.link); setShowNotif(false); }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${n.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <NIcon size={14} color={n.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.825rem', lineHeight: 1.4 }}>{n.text}</div>
                        {!n.read && (
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', marginTop: 4 }} />
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer' }}>
                  View all notifications
                </span>
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
              <div className="header-user-role">{user?.role}</div>
            </div>
            <Avatar name={user?.name} size="sm" />
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </div>

          {showProfile && (
            <div className="dropdown-menu">
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                <div style={{ marginTop: 6 }}>
                  <Badge status={user?.role?.toLowerCase()} label={user?.role} dot={false} />
                </div>
              </div>
              <div className="dropdown-item" onClick={() => { navigate('/settings/profile'); setShowProfile(false); }}>
                <User size={15} /> My Profile
              </div>
              <div className="dropdown-item" onClick={() => { navigate('/settings'); setShowProfile(false); }}>
                <Settings size={15} /> Settings
              </div>
              <div className="dropdown-item">
                <HelpCircle size={15} /> Help & Support
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-item danger" onClick={() => { logout(); navigate('/login'); }}>
                <LogOut size={15} /> Sign Out
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
