import React, { useState, useMemo } from 'react';
import { Calendar, Download, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/shared/Badge';

const EmployeeAttendance = () => {
  const { attendanceData } = useApp();
  const { user } = useAuth();

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7); // "YYYY-MM"

  const [monthFilter, setMonthFilter] = useState(currentMonth);
  const [statusFilter, setStatusFilter] = useState('');

  // Only this employee's attendance
  const myAttendance = useMemo(() =>
    attendanceData.filter(a => a.employeeId === user?.id || a.email === user?.email),
    [attendanceData, user]
  );

  const filtered = useMemo(() => {
    let list = [...myAttendance];
    if (monthFilter) list = list.filter(a => a.date?.startsWith(monthFilter));
    if (statusFilter) list = list.filter(a => a.status === statusFilter);
    return list.sort((a, b) => b.date?.localeCompare(a.date || ''));
  }, [myAttendance, monthFilter, statusFilter]);

  const summaryAll = useMemo(() => ({
    present:  myAttendance.filter(a => a.status === 'present').length,
    absent:   myAttendance.filter(a => a.status === 'absent').length,
    late:     myAttendance.filter(a => a.late || a.status === 'late').length,
    leave:    myAttendance.filter(a => a.status === 'leave').length,
    totalHrs: myAttendance.reduce((s, a) => s + (Number(a.hours) || 0), 0).toFixed(1),
  }), [myAttendance]);

  const summaryFiltered = useMemo(() => ({
    present:  filtered.filter(a => a.status === 'present').length,
    absent:   filtered.filter(a => a.status === 'absent').length,
    late:     filtered.filter(a => a.late || a.status === 'late').length,
    totalHrs: filtered.reduce((s, a) => s + (Number(a.hours) || 0), 0).toFixed(1),
  }), [filtered]);

  const handleExport = () => {
    const header = 'Date,Check In,Check Out,Hours,Overtime,Status\n';
    const rows = filtered.map(a =>
      `${a.date},${a.checkIn || ''},${a.checkOut || ''},${a.hours || ''},${a.overtime || 0},${a.status}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my_attendance_${monthFilter}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">My Attendance</h1>
            <p className="page-subtitle">Your personal attendance history</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleExport}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { icon: CheckCircle, label: 'Present Days',    value: summaryAll.present,  color: 'var(--success)', bg: 'var(--success-light)' },
          { icon: XCircle,     label: 'Absent Days',     value: summaryAll.absent,   color: 'var(--danger)',  bg: 'var(--danger-light)'  },
          { icon: AlertCircle, label: 'Late Arrivals',   value: summaryAll.late,     color: 'var(--warning)', bg: 'var(--warning-light)' },
          { icon: Calendar,    label: 'Leave Days',      value: summaryAll.leave,    color: 'var(--info)',    bg: 'var(--info-light)'    },
          { icon: Clock,       label: 'Total Hours',     value: `${summaryAll.totalHrs}h`, color: 'var(--primary)', bg: 'var(--primary-light)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-icon" style={{ background: s.bg }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Month:</label>
            <input
              type="month"
              className="form-control"
              style={{ width: 160 }}
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
            />
          </div>
          <select
            className="form-control form-select"
            style={{ width: 160 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="leave">On Leave</option>
            <option value="half-day">Half Day</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {filtered.length} records · {summaryFiltered.present} present · {summaryFiltered.totalHrs}h worked
          </span>
        </div>
      </div>

      {/* Attendance Table */}
      {myAttendance.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📅</div>
          <div className="empty-state-title">No attendance records yet</div>
          <div className="empty-state-desc">Your attendance will appear here once marked</div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Overtime</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((a, i) => {
                const d = a.date ? new Date(a.date) : null;
                const dayName = d ? d.toLocaleDateString('en-IN', { weekday: 'short' }) : '—';
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 500, fontSize: '0.875rem' }}>{a.date}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{dayName}</td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {a.checkIn ? (
                        <span style={{ color: 'var(--success)', fontWeight: 500 }}>{a.checkIn}</span>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {a.checkOut ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 500 }}>{a.checkOut}</span>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {a.hours ? `${a.hours}h` : '—'}
                    </td>
                    <td style={{ fontSize: '0.875rem', color: a.overtime > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                      {a.overtime > 0 ? `+${a.overtime}h` : '—'}
                    </td>
                    <td><Badge status={a.status} /></td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No records found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeAttendance;
