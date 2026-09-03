import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, DollarSign, Star, CheckCircle,
  TrendingUp, LogIn, LogOut, AlertCircle, PlaneTakeoff,
  Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/shared/Badge';
import { formatINR } from '../../utils/currency';
import AIChatPanel from '../../components/ai/AIChatPanel';
import { useAI } from '../../hooks/useAI';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, sub, color, bg, onClick }) => (
  <div className="stat-card" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
    <div className="stat-card-icon" style={{ background: bg }}>
      <Icon size={22} color={color} />
    </div>
    <div className="stat-card-value">{value}</div>
    <div className="stat-card-label">{label}</div>
    {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
  </div>
);

const InfoRow = ({ label, value, highlight }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>
    <span style={{ fontSize: '0.875rem', fontWeight: highlight ? 600 : 500, color: highlight ? 'var(--primary)' : 'var(--text-primary)' }}>{value || '—'}</span>
  </div>
);

const EmployeeDashboard = () => {
  const { attendanceData, leaveRequests, payrollData, performanceReviews, doCheckIn, doCheckOut } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];
  const todayDisplay = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Filter data for this employee only (match by email since that's on user object)
  const myAttendance = useMemo(() =>
    attendanceData.filter(a => a.employeeId === user?.id || a.email === user?.email),
    [attendanceData, user]
  );

  const myLeaveRequests = useMemo(() =>
    leaveRequests.filter(r => r.employeeId === user?.id || r.email === user?.email),
    [leaveRequests, user]
  );

  const myPayroll = useMemo(() =>
    payrollData.filter(p => p.employeeId === user?.id || p.email === user?.email),
    [payrollData, user]
  );

  const myPerformance = useMemo(() =>
    performanceReviews.filter(r => r.employeeId === user?.id || r.email === user?.email),
    [performanceReviews, user]
  );

  // Today's attendance
  const todayRecord = myAttendance.find(a => a.date === today);
  const checkedIn  = !!todayRecord?.checkIn;
  const checkedOut = !!todayRecord?.checkOut;

  const handleCheckIn = async () => {
    try {
      const result = await doCheckIn();
      toast.success(result.message);
    } catch (err) {
      toast.error(err.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      const result = await doCheckOut();
      toast.success(result.message);
    } catch (err) {
      toast.error(err.message || 'Check-out failed');
    }
  };

  // Summary metrics
  const presentDays = myAttendance.filter(a => a.status === 'present').length;
  const pendingLeave = myLeaveRequests.filter(r => r.status === 'pending').length;
  const approvedLeave = myLeaveRequests.filter(r => r.status === 'approved').length;

  const totalLeave = 34; // annual + sick + casual per policy
  const usedLeave = approvedLeave;
  const remainingLeave = Math.max(0, totalLeave - usedLeave);

  const latestPayroll = myPayroll.length > 0 ? myPayroll[myPayroll.length - 1] : null;
  const latestReview = myPerformance.length > 0 ? myPerformance[myPerformance.length - 1] : null;

  const monthlySalaryDisplay = latestPayroll
    ? formatINR((latestPayroll.basic || 0) + (latestPayroll.hra || 0) + (latestPayroll.allowances || 0) + (latestPayroll.bonus || 0) - ((latestPayroll.tax || 0) + (latestPayroll.insurance || 0) + (latestPayroll.otherDeductions || 0)))
    : 'N/A';

  // Recent activity
  const activities = useMemo(() => {
    const acts = [];
    myAttendance.slice(-3).reverse().forEach(a => {
      acts.push({ type: 'attendance', text: `Attendance marked — ${a.status} on ${a.date}`, time: a.date, color: a.status === 'present' ? 'var(--success)' : 'var(--danger)', bg: a.status === 'present' ? 'var(--success-light)' : 'var(--danger-light)' });
    });
    myLeaveRequests.slice(-3).reverse().forEach(r => {
      acts.push({ type: 'leave', text: `${r.leaveType} request (${r.status}) — ${r.startDate} to ${r.endDate}`, time: r.appliedDate || r.startDate, color: 'var(--primary)', bg: 'var(--primary-light)' });
    });
    myPayroll.slice(-2).reverse().forEach(p => {
      acts.push({ type: 'payroll', text: `Payslip for ${p.month} ${p.year || ''} — ${p.status}`, time: p.paymentDate || '', color: 'var(--teal)', bg: 'var(--info-light)' });
    });
    return acts.sort((a, b) => b.time?.localeCompare(a.time || '') || 0).slice(0, 6);
  }, [myAttendance, myLeaveRequests, myPayroll]);

  // ── AI ──────────────────────────────────────────────────────────────────
  const ai = useAI(user);

  const buildEmployeeContext = useCallback(() => ({
    myAttendance,
    myLeave: myLeaveRequests,
    myPayroll,
    myPerformance,
    userProfile: { department: user?.department, designation: user?.designation },
  }), [myAttendance, myLeaveRequests, myPayroll, myPerformance, user]);

  const handleEmployeeChat = useCallback(async (message) => {
    const result = await ai.employeeChat(message, buildEmployeeContext());
    if (!result) return 'AI Assistant is temporarily unavailable. Please check your connection and try again.';
    if (!result.success) return result.message || 'AI Assistant is temporarily unavailable. Please try again.';
    return result.answer || 'I could not generate a response. Please try rephrasing your question.';
  }, [ai, buildEmployeeContext]);

  // AI Weekly Summary state
  const [weeklySummary, setWeeklySummary] = useState('');
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  const loadWeeklySummary = useCallback(async () => {
    setWeeklyLoading(true);
    const result = await ai.employeeWeeklySummary(buildEmployeeContext());
    if (result?.success && result.summary) {
      setWeeklySummary(result.summary);
    }
    setWeeklyLoading(false);
  }, [ai, buildEmployeeContext]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">My Dashboard</h1>
            <p className="page-subtitle">{todayDisplay}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {!checkedIn && (
              <button className="btn btn-primary" onClick={handleCheckIn}>
                <LogIn size={14} /> Check In
              </button>
            )}
            {checkedIn && !checkedOut && (
              <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={handleCheckOut}>
                <LogOut size={14} /> Check Out
              </button>
            )}
            {checkedIn && checkedOut && (
              <div style={{ padding: '8px 16px', background: 'var(--success-light)', color: 'var(--success)', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} /> Day Complete
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard
          icon={Clock} label="Present Days (Month)"
          value={presentDays || 0}
          sub="This month"
          color="#4f46e5" bg="#eef2ff"
          onClick={() => navigate('/employee/attendance')}
        />
        <StatCard
          icon={PlaneTakeoff} label="Available Leave"
          value={remainingLeave}
          sub={`${usedLeave} used of ${totalLeave} total`}
          color="#10b981" bg="#d1fae5"
          onClick={() => navigate('/employee/leave')}
        />
        <StatCard
          icon={AlertCircle} label="Pending Leave"
          value={pendingLeave}
          sub="Awaiting approval"
          color="#f59e0b" bg="#fef3c7"
          onClick={() => navigate('/employee/leave')}
        />
        <StatCard
          icon={DollarSign} label="Net Salary (Month)"
          value={latestPayroll ? monthlySalaryDisplay : 'N/A'}
          sub={latestPayroll ? `${latestPayroll.month || ''}` : 'No payroll yet'}
          color="#14b8a6" bg="#ccfbf1"
          onClick={() => navigate('/employee/payroll')}
        />
        <StatCard
          icon={Star} label="Performance Rating"
          value={latestReview ? `${latestReview.overallRating}/5 ★` : 'N/A'}
          sub={latestReview ? latestReview.reviewPeriod : 'No review yet'}
          color="#f59e0b" bg="#fef3c7"
          onClick={() => navigate('/employee/performance')}
        />
        <StatCard
          icon={TrendingUp} label="Total Reviews"
          value={myPerformance.length}
          sub="Performance reviews"
          color="#8b5cf6" bg="#ede9fe"
          onClick={() => navigate('/employee/performance')}
        />
      </div>

      {/* Two-column row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Today's Attendance */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Today's Attendance</h3>
            <span className="badge badge-info">{today}</span>
          </div>
          <div className="card-body">
            {todayRecord ? (
              <>
                <InfoRow label="Status" value={<Badge status={todayRecord.status} />} />
                <InfoRow label="Check In" value={todayRecord.checkIn || '—'} />
                <InfoRow label="Check Out" value={todayRecord.checkOut || 'Not yet'} />
                <InfoRow label="Working Hours" value={todayRecord.hours ? `${todayRecord.hours}h` : 'In progress'} highlight />
              </>
            ) : (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>⏰</div>
                <div className="empty-state-title" style={{ fontSize: '0.9rem' }}>Not checked in yet</div>
                <div className="empty-state-desc">Click "Check In" to mark your attendance</div>
              </div>
            )}
          </div>
        </div>

        {/* Leave Summary */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Leave Summary</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/employee/leave')}>View all</button>
          </div>
          <div className="card-body">
            <InfoRow label="Total Entitlement" value={`${totalLeave} days`} />
            <InfoRow label="Used Leave" value={`${usedLeave} days`} />
            <InfoRow label="Remaining Leave" value={`${remainingLeave} days`} highlight />
            <InfoRow label="Pending Requests" value={pendingLeave} />
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Leave utilization</span>
                <span style={{ fontWeight: 600 }}>{totalLeave > 0 ? Math.round((usedLeave / totalLeave) * 100) : 0}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: `${totalLeave > 0 ? (usedLeave / totalLeave) * 100 : 0}%`,
                  background: usedLeave / totalLeave > 0.8 ? 'var(--danger)' : 'var(--primary)'
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Payroll Summary */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Payroll Summary</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/employee/payroll')}>View payslips</button>
          </div>
          <div className="card-body">
            {latestPayroll ? (
              <>
                <InfoRow label="Pay Period" value={`${latestPayroll.month} ${latestPayroll.year || ''}`} />
                <InfoRow label="Gross Salary" value={formatINR((latestPayroll.basic||0)+(latestPayroll.hra||0)+(latestPayroll.allowances||0)+(latestPayroll.bonus||0))} />
                <InfoRow label="Deductions" value={`−${formatINR((latestPayroll.tax||0)+(latestPayroll.insurance||0)+(latestPayroll.otherDeductions||0))}`} />
                <InfoRow label="Net Salary" value={monthlySalaryDisplay} highlight />
                <InfoRow label="Payment Status" value={<Badge status={latestPayroll.status} />} />
              </>
            ) : (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>💰</div>
                <div className="empty-state-title" style={{ fontSize: '0.9rem' }}>No payroll records</div>
                <div className="empty-state-desc">Payslips will appear here once generated</div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {activities.length > 0 ? (
              activities.map((act, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: act.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Activity size={14} color={act.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{act.text}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{act.time}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '32px 20px' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
                <div className="empty-state-title" style={{ fontSize: '0.9rem' }}>No activity yet</div>
                <div className="empty-state-desc">Your activity will appear here</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Weekly Summary */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1rem' }}>🤖</span>
            </div>
            <h3 className="card-title">Your AI Weekly Summary</h3>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={loadWeeklySummary}
            disabled={weeklyLoading}
          >
            {weeklyLoading ? 'Generating...' : weeklySummary ? '↻ Refresh' : 'Generate Summary'}
          </button>
        </div>
        <div className="card-body">
          {weeklyLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[70, 55, 80, 50].map((w, i) => (
                <div key={i} className="skeleton" style={{ height: 13, borderRadius: 4, width: `${w}%` }} />
              ))}
            </div>
          ) : weeklySummary ? (
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>
              {weeklySummary}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Click "Generate Summary" to get an AI-powered overview of your week — attendance, leave, payroll, and performance.
            </div>
          )}
        </div>
      </div>

      {/* Employee AI Assistant */}
      <AIChatPanel
        title="🤖 My AI Assistant"
        onSend={handleEmployeeChat}
        loading={ai.loading}
        defaultOpen={false}
        suggestions={[
          'How many leaves do I have?',
          'Show my attendance this month',
          'What is my current performance rating?',
          'What is the company leave policy?',
        ]}
        placeholder="Ask about your attendance, leave, payroll, performance or company policies..."
      />
    </div>
  );
};

export default EmployeeDashboard;
