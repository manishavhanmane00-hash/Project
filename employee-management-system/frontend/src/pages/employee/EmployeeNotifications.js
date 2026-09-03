import React, { useState, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import AIChatPanel from '../../components/ai/AIChatPanel';
import { useAI } from '../../hooks/useAI';
import toast from 'react-hot-toast';

const NOTIF_ICONS = {
  leave:        { icon: '🏖️', color: 'var(--primary)',  bg: 'var(--primary-light)' },
  payroll:      { icon: '💰', color: 'var(--success)',  bg: 'var(--success-light)' },
  attendance:   { icon: '🕐', color: 'var(--info)',     bg: 'var(--info-light)'    },
  performance:  { icon: '⭐', color: 'var(--warning)',  bg: 'var(--warning-light)' },
  announcement: { icon: '📢', color: 'var(--purple)',   bg: 'var(--primary-light)' },
  default:      { icon: '🔔', color: 'var(--text-muted)', bg: 'var(--bg)'          },
};

const EmployeeNotifications = () => {
  const { notifications, markNotifRead, markAllNotifsRead, deleteNotif } = useApp();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');

  const ai = useAI(user);
  const handleNotifAI = useCallback(async (message) => {
    const notifContext = (notifications || []).slice(0, 20).map(n => ({
      type: n.type,
      message: n.message,
      read: n.isRead || n.read,
      date: n.createdAt,
    }));
    const result = await ai.employeeChat(message, {
      myAttendance: [], myLeave: [], myPayroll: [], myPerformance: [],
      notifications: notifContext, userProfile: {},
    });
    if (!result) return 'AI Assistant is temporarily unavailable.';
    if (!result.success) return result.message || 'AI Assistant is temporarily unavailable.';
    return result.answer || 'I could not generate a response.';
  }, [ai, notifications]);

  const filtered = (notifications || []).filter(n => {
    const read = n.isRead || n.read;
    if (filter === 'unread') return !read;
    if (filter === 'read')   return  read;
    return true;
  });

  const unreadCount = (notifications || []).filter(n => !(n.isRead || n.read)).length;

  const handleMarkRead  = (id) => markNotifRead(id);
  const handleMarkAll   = () => { markAllNotifsRead(); toast.success('All notifications marked as read'); };
  const handleDelete    = (id) => { deleteNotif(id); toast.success('Notification deleted'); };

  const formatTime = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {unreadCount > 0 && (
              <button className="btn btn-outline btn-sm" onClick={handleMarkAll}>
                <CheckCheck size={14} /> Mark All Read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card" style={{ marginBottom: 16, padding: '10px 16px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {[['all','All'], ['unread','Unread'], ['read','Read']].map(([v, l]) => (
            <button
              key={v}
              className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(v)}
            >
              {l}
              {v === 'unread' && unreadCount > 0 && (
                <span className="badge badge-danger" style={{ marginLeft: 6, fontSize: '0.65rem' }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>
            <Bell size={48} color="var(--text-muted)" />
          </div>
          <div className="empty-state-title">
            {filter === 'unread' ? 'No unread notifications'
              : filter === 'read' ? 'No read notifications'
              : 'No notifications yet'}
          </div>
          <div className="empty-state-desc">
            {filter === 'all' &&
              'Notifications about your leave, payroll, attendance, and performance will appear here'}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {filtered.map(n => {
              const cfg = NOTIF_ICONS[n.type] || NOTIF_ICONS.default;
              const nid = n._id || n.id;
              const isRead = n.isRead || n.read;
              return (
                <div
                  key={nid}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '16px 20px', borderBottom: '1px solid var(--border)',
                    background: isRead ? 'transparent' : 'var(--primary-light)',
                    transition: 'background 0.2s', cursor: 'pointer',
                  }}
                  onClick={() => !isRead && handleMarkRead(nid)}
                >
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: cfg.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0, fontSize: '1.2rem',
                  }}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.875rem', lineHeight: 1.5,
                      color: isRead ? 'var(--text-secondary)' : 'var(--text-primary)',
                      fontWeight: isRead ? 400 : 500,
                    }}>
                      {n.title && <strong>{n.title}: </strong>}{n.message}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {formatTime(n.createdAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                    {!isRead && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginRight: 6 }} />
                    )}
                    {!isRead && (
                      <button
                        className="btn-icon"
                        title="Mark as read"
                        onClick={(e) => { e.stopPropagation(); handleMarkRead(nid); }}
                        style={{ background: 'none' }}
                      >
                        <Check size={14} color="var(--success)" />
                      </button>
                    )}
                    <button
                      className="btn-icon danger"
                      title="Delete"
                      onClick={(e) => { e.stopPropagation(); handleDelete(nid); }}
                      style={{ background: 'none' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Notification Assistant */}
      <div style={{ marginTop: 24 }}>
        <AIChatPanel
          title="AI Notification Summary"
          onSend={handleNotifAI}
          loading={ai.loading}
          suggestions={[
            'Summarize my recent notifications',
            'What important updates do I have?',
            'Is my leave request approved?',
            'Do I have any payroll notifications?',
          ]}
          placeholder="Ask about your notifications..."
        />
      </div>
    </div>
  );
};

export default EmployeeNotifications;
