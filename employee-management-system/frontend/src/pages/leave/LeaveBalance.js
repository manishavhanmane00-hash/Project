import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/shared/Avatar';
import { LEAVE_TYPES } from '../../data/sampleData';

const LeaveBalance = () => {
  const { leaveBalances, employees } = useApp();
  const [search, setSearch] = useState('');

  const filtered = leaveBalances.filter(b => b.employeeName.toLowerCase().includes(search.toLowerCase()));

  const getBalance = (b, key) => {
    const d = b[key];
    if (!d) return { total: 0, used: 0, pending: 0, remaining: 0 };
    return { ...d, remaining: d.total - d.used - d.pending };
  };

  const BalanceBar = ({ data }) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{data.remaining} left</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>of {data.total}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{
          width: data.total > 0 ? `${(data.remaining / data.total) * 100}%` : '0%',
          background: data.remaining > 5 ? 'var(--success)' : data.remaining > 2 ? 'var(--warning)' : 'var(--danger)'
        }} />
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>{data.used} used{data.pending > 0 ? ` · ${data.pending} pending` : ''}</div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Leave</span><span className="breadcrumb-sep">/</span><span>Leave Balance</span></div>
        <h1 className="page-title">Leave Balance</h1>
        <p className="page-subtitle">Annual leave allocation and balance for all employees</p>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div className="search-input-wrapper">
          <Search size={14} className="search-icon" />
          <input className="form-control" placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Annual Leave</th>
              <th>Sick Leave</th>
              <th>Casual Leave</th>
              <th>Total Used</th>
              <th>Total Remaining</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(bal => {
              const annual = getBalance(bal, 'annual');
              const sick = getBalance(bal, 'sick');
              const casual = getBalance(bal, 'casual');
              const totalUsed = annual.used + sick.used + casual.used;
              const totalRemaining = annual.remaining + sick.remaining + casual.remaining;
              const emp = employees.find(e => e.id === bal.employeeId);
              return (
                <tr key={bal.employeeId}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={bal.employeeName} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{bal.employeeName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bal.department}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ minWidth: 140 }}><BalanceBar data={annual} /></td>
                  <td style={{ minWidth: 140 }}><BalanceBar data={sick} /></td>
                  <td style={{ minWidth: 140 }}><BalanceBar data={casual} /></td>
                  <td><span style={{ fontWeight: 600, color: 'var(--danger)' }}>{totalUsed} days</span></td>
                  <td><span style={{ fontWeight: 600, color: 'var(--success)' }}>{totalRemaining} days</span></td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No employees found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Leave Types Config */}
      <div style={{ marginTop: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Leave Types Configuration</h3>
            <button className="btn btn-primary btn-sm">+ Add Leave Type</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: 24 }}>
            {LEAVE_TYPES.map(t => (
              <div key={t.id} style={{ background: 'var(--bg)', borderRadius: 10, padding: '16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.name}</span>
                  <span className={`badge badge-${t.color}`}>{t.days} days</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalance;
