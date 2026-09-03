import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Users, UserCheck, UserMinus, Clock, AlertCircle, Calendar,
  DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Cake, Star
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/shared/Avatar';
import Badge from '../components/shared/Badge';
import { formatINR, formatINRCompact } from '../utils/currency';
import {
  DASHBOARD_STATS, EMPLOYEE_GROWTH, ATTENDANCE_OVERVIEW,
  LEAVE_STATS, DEPT_DISTRIBUTION, PAYROLL_OVERVIEW,
  RECENT_ACTIVITIES, UPCOMING_EVENTS
} from '../data/sampleData';
import AIInsightsPanel from '../components/ai/AIInsightsPanel';
import AIChatPanel from '../components/ai/AIChatPanel';
import { useAI } from '../hooks/useAI';

const StatCard = ({ icon: Icon, label, value, change, changeType, color, bg }) => (
  <div className="stat-card">
    <div className="stat-card-icon" style={{ background: bg }}>
      <Icon size={22} color={color} />
    </div>
    <div className="stat-card-value">
      {typeof value === 'number' && value > 999
        ? formatINRCompact(value)
        : value}
    </div>
    <div className="stat-card-label">{label}</div>
    {change && (
      <div className={`stat-card-trend ${changeType}`}>
        {changeType === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
        {change}
      </div>
    )}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="value" style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { employees, leaveRequests, attendanceData, payrollData, performanceReviews } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const pendingLeave = leaveRequests.filter(r => r.status === 'pending');

  // ── AI state ──────────────────────────────────────────────────────────────
  const ai = useAI(user);
  const [aiInsights, setAiInsights] = useState([]);
  const [insightsLoaded, setInsightsLoaded] = useState(false);

  const buildContext = useCallback(() => ({
    employees,
    attendance: attendanceData,
    leave: leaveRequests,
    payroll: payrollData,
    performance: performanceReviews,
  }), [employees, attendanceData, leaveRequests, payrollData, performanceReviews]);

  const loadInsights = useCallback(async () => {
    const result = await ai.adminInsights(buildContext());
    if (result?.success && result.insights) {
      setAiInsights(result.insights);
      setInsightsLoaded(true);
    }
  }, [ai, buildContext]);

  const handleAdminChat = useCallback(async (message) => {
    const result = await ai.adminChat(message, buildContext());
    if (!result) return 'AI Assistant is temporarily unavailable. Please check your connection and try again.';
    if (!result.success) return result.message || 'AI Assistant is temporarily unavailable. Please try again.';
    return result.answer || 'I could not generate a response. Please try rephrasing your question.';
  }, [ai, buildContext]);

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceData.filter(a => a.date === today);
  const presentToday = todayAttendance.filter(a => a.status === 'present').length;
  const absentToday = todayAttendance.filter(a => a.status === 'absent').length;
  const avgAttendance = todayAttendance.length > 0
    ? Math.round((presentToday / todayAttendance.length) * 100)
    : 0;
  const monthlyPayrollTotal = payrollData.reduce((s, p) =>
    s + (p.basic||0)+(p.hra||0)+(p.allowances||0)+(p.bonus||0)-(p.tax||0)-(p.insurance||0)-(p.otherDeductions||0), 0
  );

  const stats = [
    { icon: Users,     label: 'Total Employees',      value: employees.length,                                                       change: null, changeType: 'up',   color: '#4f46e5', bg: '#eef2ff' },
    { icon: UserCheck, label: 'Active Employees',      value: employees.filter(e=>e.status==='active').length,                        change: null, changeType: 'up',   color: '#10b981', bg: '#d1fae5' },
    { icon: Calendar,  label: 'On Leave Today',        value: employees.filter(e=>e.status==='on-leave').length,                      change: null, changeType: 'down', color: '#f59e0b', bg: '#fef3c7' },
    { icon: UserCheck, label: 'Present Today',         value: presentToday,                                                           change: null, changeType: 'up',   color: '#3b82f6', bg: '#dbeafe' },
    { icon: UserMinus, label: 'Absent Today',          value: absentToday,                                                            change: null, changeType: 'up',   color: '#ef4444', bg: '#fee2e2' },
    { icon: AlertCircle,label: 'Pending Leave',        value: pendingLeave.length,                                                    change: null, changeType: 'down', color: '#8b5cf6', bg: '#ede9fe' },
    { icon: DollarSign, label: 'Monthly Payroll (₹)',  value: monthlyPayrollTotal,                                                    change: null, changeType: 'up',   color: '#14b8a6', bg: '#ccfbf1' },
    { icon: TrendingUp, label: 'Avg Attendance',       value: `${avgAttendance}%`,                                                    change: null, changeType: 'up',   color: '#f97316', bg: '#ffedd5' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.name || 'Admin'} — here's what's happening today.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline btn-sm">
              <Clock size={14} /> Today: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/employees/add')}>
              + Add Employee
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* AI Insights + Ask AI */}
      <AIInsightsPanel
        insights={aiInsights}
        loading={ai.loading && !insightsLoaded}
        error={ai.error}
        onRefresh={loadInsights}
        title="🤖 AI HR Insights"
      />
      <AIChatPanel
        title="Ask AI — HR Assistant"
        onSend={handleAdminChat}
        loading={ai.loading}
        suggestions={[
          'How many employees are currently active?',
          'Which department has the highest absenteeism?',
          'How many leave requests are pending?',
          'Give me a summary of this month\'s attendance.',
        ]}
        placeholder="Ask about employees, attendance, leave, payroll..."
      />

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Employee Growth */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Employee Growth</h3>
            <span className="badge badge-success"><span className="badge-dot" />+20 this year</span>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={EMPLOYEE_GROWTH}>
                <defs>
                  <linearGradient id="empGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[70, 105]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="employees" stroke="#4f46e5" strokeWidth={2.5} fill="url(#empGrad)" dot={false} name="Employees" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">By Department</h3>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={DEPT_DISTRIBUTION} cx="50%" cy="50%" outerRadius={55} dataKey="employees" nameKey="name">
                  {DEPT_DISTRIBUTION.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                  <div className="custom-tooltip"><div className="label">{payload[0].name}</div><div className="value">{payload[0].value} employees</div></div>
                ) : null} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {DEPT_DISTRIBUTION.slice(0, 4).map(d => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{d.employees}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Attendance Overview */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Attendance This Week</h3>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ATTENDANCE_OVERVIEW} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="present" fill="#10b981" radius={3} name="Present" />
                <Bar dataKey="absent" fill="#ef4444" radius={3} name="Absent" />
                <Bar dataKey="late" fill="#f59e0b" radius={3} name="Late" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leave Statistics */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Leave Statistics</h3>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={LEAVE_STATS} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" nameKey="name" paddingAngle={3}>
                  {LEAVE_STATS.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                  <div className="custom-tooltip"><div className="label">{payload[0].name}</div><div className="value">{payload[0].value} requests</div></div>
                ) : null} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: -8 }}>
              {LEAVE_STATS.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payroll Overview */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Payroll Trend</h3>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={PAYROLL_OVERVIEW}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => formatINRCompact(v)} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="custom-tooltip"><div className="label">{label}</div><div className="value">{formatINR(payload[0].value)}</div></div>
                ) : null} />
                <Line type="monotone" dataKey="payroll" stroke="#14b8a6" strokeWidth={2.5} dot={{ fill: '#14b8a6', r: 4 }} name="Payroll" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        {/* Recent Employees */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Employees</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/employees/list')}>View all</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {employees.slice(0, 5).map(emp => (
              <div key={emp._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => navigate(`/employees/${emp._id}`)}>
                <Avatar name={emp.name} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.designation}</div>
                </div>
                <Badge status={emp.status} dot={true} />
              </div>
            ))}
          </div>
        </div>

        {/* Pending Leave Requests */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Pending Leave</h3>
            <span className="badge badge-warning">{pendingLeave.length} pending</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {pendingLeave.slice(0, 5).map(req => (
              <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => navigate('/leave/approval')}>
                <Avatar name={req.employeeName} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{req.employeeName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.leaveType} · {req.days} day{req.days > 1 ? 's' : ''}</div>
                </div>
                <Badge status="pending" />
              </div>
            ))}
            {pendingLeave.length === 0 && (
              <div className="empty-state" style={{ padding: 32 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No pending requests</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity & Events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Recent Activity */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <h3 className="card-title">Recent Activity</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {RECENT_ACTIVITIES.slice(0, 4).map(act => (
                <div key={act.id} style={{ display: 'flex', gap: 10, padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Star size={14} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{act.text}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{act.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Upcoming Events</h3>
            </div>
            <div className="card-body" style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {UPCOMING_EVENTS.slice(0, 3).map(ev => (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: ev.type === 'birthday' ? '#fee2e2' : '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Cake size={14} color={ev.type === 'birthday' ? '#ef4444' : '#10b981'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{ev.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ev.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1200px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 900px) {
          .charts-row { grid-template-columns: 1fr !important; }
          .bottom-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
