import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/shared/Avatar';
import { LEAVE_TYPES } from '../../data/sampleData';

// Leave entitlements per policy
const ENTITLEMENTS = {
  'Annual Leave':   18,
  'Sick Leave':     10,
  'Casual Leave':   6,
  'Maternity Leave': 90,
  'Paternity Leave': 10,
};

const LeaveBalance = () => {
  const { leaveRequests, employees } = useApp();
  const [search, setSearch] = useState('');

  // Compute per-employee leave balance from actual leave requests in MongoDB
  const balanceByEmployee = useMemo(() => {
    const map = {};

    // Collect unique employee identifiers from leave requests
    leaveRequests.forEach(r => {
      const key = r.employeeId || r.email;
      if (!key) return;
      if (!map[key]) {
        map[key] = {
          employeeId: r.employeeId,
          email:      r.email,
          employeeName: r.employeeName || '',
          department:   r.department   || '',
          used:   {},
          pending: {},
        };
      }
      // Accumulate used / pending days per leave type
      if (r.status === 'approved') {
        map[key].used[r.leaveType] = (map[key].used[r.leaveType] || 0) + (r.days || 0);
      } else if (r.status === 'pending') {
        map[key].pending[r.leaveType] = (map[key].pending[r.leaveType] || 0) + (r.days || 0);
      }
    });

    return Object.values(map);
  }, [leaveRequests]);

  const filtered = balanceByEmployee.filter(b =>
    b.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    b.department.toLowerCase().includes(search.toLowerCase())
  );

  const BalanceBar = ({ total, used, pending, color = 'var(--success)' }) => {
    const remaining = Math.max(0, total - used - pending);
    const usedPct   = total > 0 ? Math.min((used     / total) * 100, 100) : 0;
    const pendPct   = total > 0 ? Math.min((pending  / total) * 100, 100 - usedPct) : 0;
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{remaining} left</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>of {total}</span>
        </div>
        <div className="progress-bar" style={{ position: 'relative', height: 8 }}>
          <div className="progress-fill" style={{
            width: `${usedPct}%`,
            background: remaining > 5 ? 'var(--success)' : remaining > 2 ? 'var(--warning)' : 'var(--danger)',
          }} />
          {pending > 0 && (
            <div style={{
              position: 'absolute', top: 0, left: `${usedPct}%`, height: '100%',
              width: `${pendPct}%`, background: 'var(--warning)', opacity: 0.5,
            }} />
          )}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>
          {used} used{pending > 0 ? ` · ${pending} pending` : ''}
        </div>
      </div>
    );
  };

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
          <input className="form-control" placeholder="Search employee or department..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No leave requests yet</div>
          <div className="empty-state-desc">Leave balances are computed automatically once employees submit leave requests.</div>
        </div>
      ) : (
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
                const annual  = { total: ENTITLEMENTS['Annual Leave'],  used: bal.used['Annual Leave']  || 0, pending: bal.pending['Annual Leave']  || 0 };
                const sick    = { total: ENTITLEMENTS['Sick Leave'],    used: bal.used['Sick Leave']    || 0, pending: bal.pending['Sick Leave']    || 0 };
                const casual  = { total: ENTITLEMENTS['Casual Leave'],  used: bal.used['Casual Leave']  || 0, pending: bal.pending['Casual Leave']  || 0 };
                const totalUsed = annual.used + sick.used + casual.used;
                const totalRemaining = (annual.total - annual.used) + (sick.total - sick.used) + (casual.total - casual.used);

                return (
                  <tr key={bal.employeeId || bal.email}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={bal.employeeName} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{bal.employeeName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bal.department}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <BalanceBar total={annual.total} used={annual.used} pending={annual.pending} />
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <BalanceBar total={sick.total} used={sick.used} pending={sick.pending} />
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <BalanceBar total={casual.total} used={casual.used} pending={casual.pending} />
                    </td>
                    <td><span style={{ fontWeight: 600, color: 'var(--danger)' }}>{totalUsed} days</span></td>
                    <td><span style={{ fontWeight: 600, color: 'var(--success)' }}>{totalRemaining} days</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Leave Types Config */}
      <div style={{ marginTop: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Leave Types Configuration</h3>
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
