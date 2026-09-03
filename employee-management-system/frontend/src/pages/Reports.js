import React, { useState, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Download, FileText, Users, Clock, PlaneTakeoff,
  DollarSign, Star, ChevronRight, Printer, Filter, Bot
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatINRCompact } from '../utils/currency';
import AIChatPanel from '../components/ai/AIChatPanel';
import { useAI } from '../hooks/useAI';
import toast from 'react-hot-toast';

const REPORT_CATEGORIES = [
  {
    id: 'employee', label: 'Employee Reports', icon: Users, color: 'var(--primary)', bg: 'var(--primary-light)',
    reports: [
      { id: 'emp-list',       name: 'Employee List',                desc: 'Complete list of all employees with details' },
      { id: 'dept-wise',      name: 'Department-wise Employees',    desc: 'Employee distribution across departments' },
      { id: 'active-inactive',name: 'Active / Inactive Employees',  desc: 'Employee status breakdown' },
      { id: 'new-joiners',    name: 'New Joiners',                   desc: 'Employees who joined this month/quarter' },
    ],
  },
  {
    id: 'attendance', label: 'Attendance Reports', icon: Clock, color: 'var(--info)', bg: 'var(--info-light)',
    reports: [
      { id: 'daily-att',   name: 'Daily Attendance',   desc: 'Day-wise attendance summary' },
      { id: 'monthly-att', name: 'Monthly Attendance',  desc: 'Monthly attendance analysis' },
      { id: 'absenteeism', name: 'Absenteeism Report',  desc: 'Employees with high absence rates' },
      { id: 'late-arrivals',name: 'Late Arrivals',      desc: 'Employees who arrive late frequently' },
      { id: 'overtime',    name: 'Overtime Report',     desc: 'Overtime hours by employee' },
    ],
  },
  {
    id: 'leave', label: 'Leave Reports', icon: PlaneTakeoff, color: 'var(--purple)', bg: 'var(--purple-light)',
    reports: [
      { id: 'leave-summary',  name: 'Leave Summary',           desc: 'Overall leave statistics' },
      { id: 'emp-leave-hist', name: 'Employee Leave History',   desc: 'Individual leave records' },
      { id: 'dept-leave',     name: 'Department Leave Report',  desc: 'Leave analysis by department' },
      { id: 'pending-leave',  name: 'Pending Leave Requests',   desc: 'All unapproved leave requests' },
    ],
  },
  {
    id: 'payroll', label: 'Payroll Reports (₹ INR)', icon: DollarSign, color: 'var(--teal)', bg: 'var(--teal-light)',
    reports: [
      { id: 'monthly-payroll', name: 'Monthly Payroll',   desc: 'Payroll summary for selected month (₹)' },
      { id: 'salary-summary',  name: 'Salary Summary',    desc: 'Salary breakdown by department (₹)' },
      { id: 'deductions',      name: 'Deductions Report', desc: 'Tax, PF, insurance and other deductions (₹)' },
      { id: 'payslip-report',  name: 'Payslip Report',    desc: 'Bulk payslip generation (₹ INR)' },
    ],
  },
  {
    id: 'performance', label: 'Performance Reports', icon: Star, color: 'var(--warning)', bg: 'var(--warning-light)',
    reports: [
      { id: 'emp-perf',    name: 'Employee Performance',  desc: 'Individual performance ratings' },
      { id: 'dept-perf',   name: 'Department Performance',desc: 'Average performance by department' },
      { id: 'perf-ratings',name: 'Performance Ratings',   desc: 'Rating distribution across teams' },
    ],
  },
];

// INR-aware tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="value" style={{ color: p.color }}>
          {p.name}:{' '}
          {typeof p.value === 'number' && p.value > 1000
            ? formatINR(p.value)
            : p.value}
        </div>
      ))}
    </div>
  );
};

const perfByDept = [
  { dept: 'Engineering', avg: 4.5 },
  { dept: 'HR',          avg: 4.3 },
  { dept: 'Marketing',   avg: 4.1 },
  { dept: 'Sales',       avg: 4.4 },
  { dept: 'Finance',     avg: 4.2 },
  { dept: 'Design',      avg: 4.0 },
];

const Reports = () => {
  const { employees, departments, leaveRequests, payrollData, attendanceData, performanceReviews } = useApp();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('employee');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [search,     setSearch]     = useState('');

  // AI Report Generator state
  const [aiReport, setAiReport]     = useState('');
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const ai = useAI(user);

  const buildContext = useCallback(() => ({
    employees,
    attendance: attendanceData,
    leave: leaveRequests,
    payroll: payrollData,
    performance: performanceReviews || [],
  }), [employees, attendanceData, leaveRequests, payrollData, performanceReviews]);

  const handleGenerateAIReport = useCallback(async () => {
    setAiReportLoading(true);
    setAiReport('');
    const dateRange = dateFrom && dateTo ? { from: dateFrom, to: dateTo } : null;
    const result = await ai.generateReport(activeCategory, dateRange, deptFilter || null, buildContext());
    if (result?.success) {
      setAiReport(result.report);
    } else {
      setAiReport(result?.message || 'Failed to generate report. Please try again.');
    }
    setAiReportLoading(false);
  }, [ai, activeCategory, dateFrom, dateTo, deptFilter, buildContext]);

  const handleReportChat = useCallback(async (message) => {
    const result = await ai.adminChat(message, buildContext());
    if (!result) return 'AI Assistant is temporarily unavailable. Please check your connection and try again.';
    if (!result.success) return result.message || 'AI Assistant is temporarily unavailable. Please try again.';
    return result.answer || 'I could not generate a response. Please try rephrasing your question.';
  }, [ai, buildContext]);

  const category = REPORT_CATEGORIES.find(c => c.id === activeCategory);
  const Icon     = category?.icon;

  const handleExport = (format, reportName) =>
    toast.success(`Exporting "${reportName}" as ${format.toUpperCase()}`);

  const handlePrint = () => {
    toast.success('Opening print dialog…');
    window.print();
  };

  // Build department distribution from live employee data
  const deptDist = departments.map(d => ({
    name:      d.name,
    employees: employees.filter(e => e.department === d.name).length,
    color:     ['#4f46e5','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316'][departments.indexOf(d) % 8],
  })).filter(d => d.employees > 0);

  // Build salary distribution from live employees
  const salaryByDept = departments.map(d => {
    const emps = employees.filter(e => e.department === d.name);
    const avg  = emps.length > 0 ? Math.round(emps.reduce((s, e) => s + (e.salary || 0), 0) / emps.length) : 0;
    return { dept: d.name.slice(0, 6), avg };
  }).filter(d => d.avg > 0);

  // Payroll trend from actual payroll records
  const payrollTrend = (() => {
    const byMonth = {};
    payrollData.forEach(p => {
      const key = `${p.month} ${p.year}`;
      const net = (p.basic || 0) + (p.hra || 0) + (p.allowances || 0) + (p.bonus || 0)
                - (p.tax  || 0) - (p.insurance || 0) - (p.otherDeductions || 0);
      byMonth[key] = (byMonth[key] || 0) + net;
    });
    return Object.entries(byMonth).map(([month, payroll]) => ({ month, payroll }));
  })();

  // Leave stats from live requests
  const leaveStatData = ['Annual Leave','Sick Leave','Casual Leave','Other'].map((name, i) => ({
    name,
    value: leaveRequests.filter(r => r.leaveType === name).length || 0,
    color: ['#4f46e5','#ef4444','#3b82f6','#8b5cf6'][i],
  })).filter(s => s.value > 0);

  // Attendance from live data
  const attByDay = ['Mon','Tue','Wed','Thu','Fri'].map(day => ({
    day,
    present: attendanceData.filter(a => a.status === 'present').length,
    absent:  attendanceData.filter(a => a.status === 'absent').length,
    late:    attendanceData.filter(a => a.late).length,
  }));

  const EmptyChart = ({ message }) => (
    <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', flexDirection: 'column', gap: 8 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FileText size={18} color="var(--text-muted)" />
      </div>
      {message || 'No data yet — add records to see charts'}
    </div>
  );

  const renderChart = () => {
    switch (activeCategory) {
      case 'employee':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Department Distribution</h3></div>
              <div className="card-body" style={{ paddingTop: 8 }}>
                {deptDist.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={deptDist} barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="employees" name="Employees" radius={4}>
                        {deptDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart message="Add employees to see department distribution" />}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Employment Type</h3></div>
              <div className="card-body" style={{ paddingTop: 8 }}>
                {employees.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Full-time', value: employees.filter(e => e.employmentType === 'Full-time').length  },
                          { name: 'Contract',  value: employees.filter(e => e.employmentType === 'Contract').length   },
                          { name: 'Part-time', value: employees.filter(e => e.employmentType === 'Part-time').length  },
                          { name: 'Intern',    value: employees.filter(e => e.employmentType === 'Intern').length     },
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {['#4f46e5','#10b981','#f59e0b','#8b5cf6'].map((c, i) => <Cell key={i} fill={c} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyChart message="Add employees to see employment types" />}
              </div>
            </div>
          </div>
        );

      case 'attendance':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Attendance Summary</h3></div>
              <div className="card-body" style={{ paddingTop: 8 }}>
                {attendanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={attByDay} barSize={14}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="present" fill="#10b981" radius={3} name="Present" />
                      <Bar dataKey="absent"  fill="#ef4444" radius={3} name="Absent"  />
                      <Bar dataKey="late"    fill="#f59e0b" radius={3} name="Late"    />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart message="Mark attendance to see charts" />}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Attendance Status Breakdown</h3></div>
              <div className="card-body" style={{ paddingTop: 8 }}>
                {attendanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Present', value: attendanceData.filter(a => a.status === 'present').length },
                          { name: 'Absent',  value: attendanceData.filter(a => a.status === 'absent').length  },
                          { name: 'Late',    value: attendanceData.filter(a => a.status === 'late').length    },
                          { name: 'Leave',   value: attendanceData.filter(a => a.status === 'leave').length   },
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {['#10b981','#ef4444','#f59e0b','#3b82f6'].map((c, i) => <Cell key={i} fill={c} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyChart message="Mark attendance to see breakdown" />}
              </div>
            </div>
          </div>
        );

      case 'leave':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Leave Type Distribution</h3></div>
              <div className="card-body" style={{ paddingTop: 8 }}>
                {leaveStatData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={leaveStatData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name"
                        label={({ name, value }) => `${name}: ${value}`}>
                        {leaveStatData.map((s, i) => <Cell key={i} fill={s.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyChart message="Submit leave requests to see distribution" />}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Leave Status Summary</h3></div>
              <div className="card-body" style={{ paddingTop: 8 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { status: 'Approved', count: leaveRequests.filter(r => r.status === 'approved').length },
                    { status: 'Pending',  count: leaveRequests.filter(r => r.status === 'pending').length  },
                    { status: 'Rejected', count: leaveRequests.filter(r => r.status === 'rejected').length },
                  ]} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="status" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Requests" radius={4}>
                      <Cell fill="#10b981" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      case 'payroll':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Payroll Trend (₹ INR)</h3></div>
              <div className="card-body" style={{ paddingTop: 8 }}>
                {payrollTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={payrollTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}
                        tickFormatter={v => formatINRCompact(v)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="payroll" stroke="#14b8a6" strokeWidth={2.5}
                        dot={{ r: 4, fill: '#14b8a6' }} name="Payroll (₹)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <EmptyChart message="Generate payroll to see trends" />}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Avg Salary by Department (₹ INR)</h3></div>
              <div className="card-body" style={{ paddingTop: 8 }}>
                {salaryByDept.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={salaryByDept} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="dept" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}
                        tickFormatter={v => formatINRCompact(v)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avg" fill="#4f46e5" radius={4} name="Avg Salary (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart message="Add employees with salaries to see this chart" />}
              </div>
            </div>
          </div>
        );

      case 'performance':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Avg Rating by Department</h3></div>
              <div className="card-body" style={{ paddingTop: 8 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={perfByDept} barSize={24} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="dept" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avg" fill="#f59e0b" radius={4} name="Avg Rating" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Rating Distribution</h3></div>
              <div className="card-body" style={{ paddingTop: 8 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { rating: '1 — Poor',           count: 0 },
                    { rating: '2 — Needs Imp.',     count: 0 },
                    { rating: '3 — Meets',          count: 0 },
                    { rating: '4 — Very Good',      count: 0 },
                    { rating: '5 — Excellent',      count: 0 },
                  ]} barSize={30}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="rating" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Employees" radius={4}>
                      {['#ef4444','#f97316','#f59e0b','#3b82f6','#10b981'].map((c, i) => <Cell key={i} fill={c} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Reports & Analytics</h1>
            <p className="page-subtitle">Generate, view, and export detailed reports · Currency: ₹ INR</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline btn-sm" onClick={handlePrint}><Printer size={14} /> Print</button>
            <button className="btn btn-outline btn-sm" onClick={() => handleExport('csv', category?.label)}><Download size={14} /> Export CSV</button>
            <button className="btn btn-primary btn-sm"  onClick={() => handleExport('pdf', category?.label)}><Download size={14} /> Export PDF</button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <Filter size={14} /> Filters:
          </div>
          <input type="date" className="form-control" style={{ width: 150 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>to</span>
          <input type="date" className="form-control" style={{ width: 150 }} value={dateTo}   onChange={e => setDateTo(e.target.value)} />
          <select className="form-control form-select" style={{ width: 180 }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <input className="form-control" style={{ width: 180 }} placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
        {/* Category sidebar */}
        <div className="card" style={{ overflow: 'hidden', height: 'fit-content' }}>
          {REPORT_CATEGORIES.map(cat => {
            const CatIcon  = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <div key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
                padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                background: isActive ? cat.bg : 'transparent',
                display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: isActive ? cat.color : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CatIcon size={16} color={isActive ? 'white' : cat.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: isActive ? cat.color : 'var(--text-primary)' }}>{cat.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cat.reports.length} reports</div>
                </div>
                {isActive && <ChevronRight size={14} color={cat.color} />}
              </div>
            );
          })}
        </div>

        {/* Charts + report list */}
        <div>
          <div style={{ marginBottom: 20 }}>{renderChart()}</div>

          {/* AI Report Generator */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={15} color="var(--primary)" />
                </div>
                <h3 className="card-title">Generate AI Report</h3>
                <span style={{ fontSize: '0.68rem', padding: '2px 8px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 20, fontWeight: 600, border: '1px solid var(--primary-mid)' }}>
                  AI Powered
                </span>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleGenerateAIReport}
                disabled={aiReportLoading}
                style={{ minWidth: 140 }}
              >
                <Bot size={13} />
                {aiReportLoading ? 'Generating...' : 'Generate AI Report'}
              </button>
            </div>
            <div className="card-body">
              {aiReportLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[80, 65, 90, 55, 75].map((w, i) => (
                    <div key={i} className="skeleton" style={{ height: 14, borderRadius: 4, width: `${w}%` }} />
                  ))}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                    AI is generating your {category?.label?.toLowerCase()} report...
                  </div>
                </div>
              ) : aiReport ? (
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-primary)', background: 'var(--bg)', borderRadius: 10, padding: 16 }}>
                  {aiReport}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '8px 0' }}>
                  Click "Generate AI Report" to create an executive summary for the selected report category.
                  <br />
                  <span style={{ fontSize: '0.78rem' }}>Use the date range and department filters above to scope the report.</span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {Icon && <Icon size={18} color={category?.color} />}
                <h3 className="card-title">{category?.label}</h3>
              </div>
            </div>
            <div style={{ padding: 0 }}>
              {category?.reports.map((rep, i) => (
                <div key={rep.id} style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
                  borderBottom: i < category.reports.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: category.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={16} color={category.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{rep.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{rep.desc}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => handleExport('csv', rep.name)}><Download size={12} /> CSV</button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleExport('pdf', rep.name)}><Download size={12} /> PDF</button>
                    <button className="btn btn-ghost   btn-sm" onClick={handlePrint}><Printer size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Reports Chat */}
          <div style={{ marginTop: 20 }}>
            <AIChatPanel
              title="Ask AI about Reports"
              onSend={handleReportChat}
              loading={ai.loading}
              suggestions={[
                'What are the key HR trends this month?',
                'Which department needs attention?',
                'Summarize attendance and leave together',
                'What is the total payroll this period?',
              ]}
              placeholder="Ask about any report data..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
