import React, { useState, useMemo } from 'react';
import { Search, Download, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Badge from '../../components/shared/Badge';
import Avatar from '../../components/shared/Avatar';
import Pagination from '../../components/shared/Pagination';

const PAGE_SIZE = 15;

const AttendanceHistory = () => {
  const { attendanceData, employees, departments } = useApp();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // Default to current month's date range
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const today = now.toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = [...attendanceData];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(a =>
        a.name?.toLowerCase().includes(s) ||
        (a.employeeId || '').toString().toLowerCase().includes(s)
      );
    }
    if (deptFilter) list = list.filter(a => a.department === deptFilter);
    if (statusFilter) list = list.filter(a => a.status === statusFilter);
    if (dateFrom) list = list.filter(a => a.date >= dateFrom);
    if (dateTo) list = list.filter(a => a.date <= dateTo);
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [attendanceData, search, deptFilter, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const total = filtered.length;
  const presentCount = filtered.filter(a => a.status === 'present').length;
  const absentCount = filtered.filter(a => a.status === 'absent').length;
  const lateCount = filtered.filter(a => a.late).length;

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Attendance</span><span className="breadcrumb-sep">/</span><span>History</span></div>
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Attendance History</h1>
            <p className="page-subtitle">View and analyze historical attendance records</p>
          </div>
          <button className="btn btn-outline btn-sm"><Download size={14} /> Export CSV</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Records', value: total, color: 'var(--primary)' },
          { label: 'Present', value: presentCount, color: 'var(--success)' },
          { label: 'Absent', value: absentCount, color: 'var(--danger)' },
          { label: 'Late Arrivals', value: lateCount, color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-wrapper" style={{ minWidth: 200 }}>
            <Search size={14} className="search-icon" />
            <input className="form-control" placeholder="Search employee..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-control form-select" style={{ width: 160 }} value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <select className="form-control form-select" style={{ width: 140 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="leave">On Leave</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
            <input type="date" className="form-control" style={{ width: 140 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span style={{ color: 'var(--text-muted)' }}>to</span>
            <input type="date" className="form-control" style={{ width: 140 }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th><th>Employee</th><th>Department</th><th>Check In</th><th>Check Out</th>
              <th>Hours</th><th>Overtime</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((a, i) => {
              const emp = employees.find(e =>
                e._id === a.employeeId ||
                e._id?.toString() === a.employeeId?.toString() ||
                e.email === a.email
              );
              return (
                <tr key={a._id || i}>
                  <td style={{ fontSize: '0.875rem', fontWeight: 500 }}>{a.date}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={a.name || emp?.name} size="sm" />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{a.name || emp?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{a.department}</td>
                  <td style={{ fontSize: '0.875rem' }}>{a.checkIn || '—'}</td>
                  <td style={{ fontSize: '0.875rem' }}>{a.checkOut || '—'}</td>
                  <td style={{ fontSize: '0.875rem' }}>{a.hours ? `${a.hours}h` : '—'}</td>
                  <td style={{ fontSize: '0.875rem', color: a.overtime > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                    {a.overtime > 0 ? `+${a.overtime}h` : '—'}
                  </td>
                  <td><Badge status={a.status} /></td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
};

export default AttendanceHistory;
