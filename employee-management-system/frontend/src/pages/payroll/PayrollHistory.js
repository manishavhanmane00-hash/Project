import React, { useState } from 'react';
import { Download, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/shared/Avatar';
import Badge from '../../components/shared/Badge';
import { formatINR } from '../../utils/currency';
import toast from 'react-hot-toast';

const PayrollHistory = () => {
  const { payrollData, approvePayroll } = useApp();
  const [filter, setFilter] = useState('');

  const pending  = payrollData.filter(p => p.status === 'pending').length;
  const approved = payrollData.filter(p => p.status === 'approved').length;

  const filtered = payrollData.filter(p => !filter || p.status === filter);

  const getNet = (p) =>
    p.net || Math.round((p.basic + p.hra + p.allowances + p.bonus) - p.tax - p.insurance - p.otherDeductions);

  const totalPayroll = Math.round(filtered.reduce((s, p) => s + getNet(p), 0));

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Payroll</span><span className="breadcrumb-sep">/</span><span>History</span></div>
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Payroll History</h1>
            <p className="page-subtitle">Review and approve generated payroll records</p>
          </div>
          <button className="btn btn-outline btn-sm"><Download size={14} /> Export</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Payroll (Shown)', value: formatINR(totalPayroll), color: 'var(--primary)' },
          { label: 'Pending Approval',      value: pending,                 color: 'var(--warning)' },
          { label: 'Approved',              value: approved,                color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'pending', 'approved'].map(s => (
            <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(s)}>
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {payrollData.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No payroll records yet</div>
          <div className="empty-state-desc">Generate payroll from the Generate Payroll page to see records here.</div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Employee</th><th>Period</th><th>Basic</th><th>Allowances</th>
                <th>Bonus</th><th>Deductions</th><th>Net Salary</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const net        = getNet(p);
                const deductions = (p.tax || 0) + (p.insurance || 0) + (p.otherDeductions || 0);
                return (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={p.employeeName} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.employeeName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.department}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{p.month} {p.year}</td>
                    <td>{formatINR(p.basic)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatINR((p.hra || 0) + (p.allowances || 0))}</td>
                    <td style={{ color: 'var(--success)' }}>{formatINR(p.bonus || 0)}</td>
                    <td style={{ color: 'var(--danger)' }}>−{formatINR(deductions)}</td>
                    <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatINR(net)}</span></td>
                    <td><Badge status={p.status} /></td>
                    <td>
                      <div className="table-actions">
                        {p.status === 'pending' && (
                          <button className="btn btn-sm btn-success"
                            onClick={() => { approvePayroll(p.id); toast.success(`Payroll approved for ${p.employeeName}`); }}>
                            <CheckCircle size={12} /> Approve
                          </button>
                        )}
                        <button className="btn-icon" title="Download Payslip"><Download size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records match the selected filter</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PayrollHistory;
