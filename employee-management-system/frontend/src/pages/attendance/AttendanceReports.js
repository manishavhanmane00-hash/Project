import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, TrendingUp, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { ATTENDANCE_OVERVIEW, DEPT_DISTRIBUTION } from '../../data/sampleData';

const deptAttendance = [
  { name: 'Engineering', rate: 96.2 },
  { name: 'HR', rate: 98.0 },
  { name: 'Marketing', rate: 92.5 },
  { name: 'Sales', rate: 89.8 },
  { name: 'Finance', rate: 97.0 },
  { name: 'Operations', rate: 94.3 },
  { name: 'Design', rate: 90.1 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map((p, i) => <div key={i} className="value" style={{ color: p.color }}>{p.name}: {p.value}{typeof p.value === 'number' && p.value < 100 && p.value > 1 ? '%' : ''}</div>)}
    </div>
  );
};

const AttendanceReports = () => (
  <div>
    <div className="page-header">
      <div className="breadcrumb"><span>Attendance</span><span className="breadcrumb-sep">/</span><span>Reports</span></div>
      <div className="page-header-top">
        <div>
          <h1 className="page-title">Attendance Reports</h1>
          <p className="page-subtitle">Analytics and insights for August 2026</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline btn-sm"><Download size={14} /> Export PDF</button>
          <button className="btn btn-outline btn-sm"><Download size={14} /> Export CSV</button>
        </div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
      {[
        { icon: CheckCircle, label: 'Avg Attendance Rate', value: '94.2%', color: 'var(--success)', bg: 'var(--success-light)' },
        { icon: TrendingUp, label: 'Present Days (Month)', value: '1,847', color: 'var(--primary)', bg: 'var(--primary-light)' },
        { icon: AlertCircle, label: 'Absent Days (Month)', value: '113', color: 'var(--danger)', bg: 'var(--danger-light)' },
        { icon: Clock, label: 'Late Arrivals (Month)', value: '89', color: 'var(--warning)', bg: 'var(--warning-light)' },
      ].map(s => (
        <div key={s.label} className="stat-card">
          <div className="stat-card-icon" style={{ background: s.bg }}><s.icon size={22} color={s.color} /></div>
          <div className="stat-card-value">{s.value}</div>
          <div className="stat-card-label">{s.label}</div>
        </div>
      ))}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
      <div className="card">
        <div className="card-header"><h3 className="card-title">Weekly Attendance Overview</h3></div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ATTENDANCE_OVERVIEW}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="present" fill="#10b981" radius={3} name="Present" />
              <Bar dataKey="absent" fill="#ef4444" radius={3} name="Absent" />
              <Bar dataKey="late" fill="#f59e0b" radius={3} name="Late" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Department Attendance Rate</h3></div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={deptAttendance} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" domain={[80, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rate" name="Attendance Rate" fill="#4f46e5" radius={3} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    {/* Department Detail Table */}
    <div className="card">
      <div className="card-header"><h3 className="card-title">Department-wise Summary</h3></div>
      <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
        <table className="table">
          <thead>
            <tr><th>Department</th><th>Total Days</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance %</th></tr>
          </thead>
          <tbody>
            {deptAttendance.map(d => {
              const total = 22; const present = Math.round(total * d.rate / 100); const absent = total - present;
              return (
                <tr key={d.name}>
                  <td style={{ fontWeight: 500 }}>{d.name}</td>
                  <td>{total}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{present}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{absent}</td>
                  <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{Math.round(absent * 0.4)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${d.rate}%`, background: d.rate >= 95 ? 'var(--success)' : d.rate >= 90 ? 'var(--warning)' : 'var(--danger)' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, minWidth: 40 }}>{d.rate}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default AttendanceReports;
