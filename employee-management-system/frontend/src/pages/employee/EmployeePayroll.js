import React, { useState, useMemo } from 'react';
import { Printer, Download, DollarSign, TrendingUp, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/shared/Badge';
import { formatINR } from '../../utils/currency';
import toast from 'react-hot-toast';

const TABS = ['Salary Overview', 'Payroll History', 'Payslip'];

const InfoRow = ({ label, value, highlight, negative }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>
    <span style={{ fontSize: '0.875rem', fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--success)' : negative ? 'var(--danger)' : 'var(--text-primary)' }}>
      {value}
    </span>
  </div>
);

const PayslipView = ({ payroll, user }) => {
  const gross = (payroll.basic || 0) + (payroll.hra || 0) + (payroll.allowances || 0) + (payroll.bonus || 0);
  const deductions = (payroll.tax || 0) + (payroll.insurance || 0) + (payroll.otherDeductions || 0);
  const net = gross - deductions;

  return (
    <div id="payslip-print" style={{ background: 'white', padding: 32, fontFamily: 'Inter, sans-serif', maxWidth: 700, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: '2px solid #4f46e5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: '#4f46e5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1rem' }}>E</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>EMS Portal</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Employee Management System</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ background: '#eef2ff', color: '#4f46e5', padding: '6px 14px', borderRadius: 20, fontSize: '0.875rem', fontWeight: 600 }}>PAYSLIP</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>{payroll.month} {payroll.year}</div>
        </div>
      </div>

      {/* Employee Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24, background: '#f8fafc', borderRadius: 10, padding: 16 }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee Information</div>
          {[['Name', user?.name], ['Employee ID', `EMP-${String(user?.id||'').slice(-4).padStart(3,'0')}`], ['Department', user?.department || '—'], ['Designation', user?.designation || '—']].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 100, fontSize: '0.8rem', color: '#64748b' }}>{k}:</span>
              <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{v}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Details</div>
          {[['Pay Period', `${payroll.month} ${payroll.year}`], ['Payment Date', payroll.paymentDate || '—'], ['Payment Mode', 'Bank Transfer'], ['Status', payroll.status]].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 100, fontSize: '0.8rem', color: '#64748b' }}>{k}:</span>
              <span style={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'capitalize' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings & Deductions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ background: '#d1fae5', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: '0.75rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>Earnings</div>
          {[['Basic Salary', payroll.basic], ['HRA', payroll.hra], ['Allowances', payroll.allowances], ['Bonus', payroll.bonus]].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 4px', borderBottom: '1px solid #f1f5f9', fontSize: '0.825rem' }}>
              <span style={{ color: '#475569' }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{formatINR(v || 0)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 4px', fontSize: '0.875rem', fontWeight: 700, borderTop: '2px solid #d1fae5', marginTop: 4 }}>
            <span style={{ color: '#065f46' }}>Gross Earnings</span>
            <span style={{ color: '#10b981' }}>{formatINR(gross)}</span>
          </div>
        </div>
        <div>
          <div style={{ background: '#fee2e2', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>Deductions</div>
          {[['Income Tax (TDS)', payroll.tax], ['Health Insurance', payroll.insurance], ['Provident Fund (PF)', payroll.otherDeductions]].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 4px', borderBottom: '1px solid #f1f5f9', fontSize: '0.825rem' }}>
              <span style={{ color: '#475569' }}>{k}</span>
              <span style={{ fontWeight: 600, color: '#ef4444' }}>−{formatINR(v || 0)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 4px', fontSize: '0.875rem', fontWeight: 700, borderTop: '2px solid #fee2e2', marginTop: 4 }}>
            <span style={{ color: '#991b1b' }}>Total Deductions</span>
            <span style={{ color: '#ef4444' }}>−{formatINR(deductions)}</span>
          </div>
        </div>
      </div>

      {/* Net Salary */}
      <div style={{ background: '#4f46e5', borderRadius: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>Net Salary</span>
        <span style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>{formatINR(net)}</span>
      </div>
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.75rem', color: '#94a3b8' }}>
        Computer-generated payslip — No signature required. All amounts in ₹ INR.
      </div>
    </div>
  );
};

const EmployeePayroll = () => {
  const { payrollData } = useApp();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const myPayroll = useMemo(() =>
    payrollData
      .filter(p => p.employeeId === user?.id || p.email === user?.email)
      .sort((a, b) => {
        const aStr = `${a.year}-${String(a.month).padStart(2,'0')}`;
        const bStr = `${b.year}-${String(b.month).padStart(2,'0')}`;
        return bStr.localeCompare(aStr);
      }),
    [payrollData, user]
  );

  const latestPayroll = myPayroll[0] || null;

  const gross = latestPayroll
    ? (latestPayroll.basic||0)+(latestPayroll.hra||0)+(latestPayroll.allowances||0)+(latestPayroll.bonus||0)
    : 0;
  const deductions = latestPayroll
    ? (latestPayroll.tax||0)+(latestPayroll.insurance||0)+(latestPayroll.otherDeductions||0)
    : 0;
  const net = gross - deductions;

  const handlePrint = () => {
    window.print();
    toast.success('Printing payslip…');
  };

  const renderOverview = () => (
    <div>
      {latestPayroll ? (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Basic Salary',     value: formatINR(latestPayroll.basic||0),   color: 'var(--primary)', bg: 'var(--primary-light)', icon: DollarSign },
              { label: 'Gross Salary',     value: formatINR(gross),                    color: 'var(--info)',    bg: 'var(--info-light)',    icon: TrendingUp  },
              { label: 'Total Deductions', value: `−${formatINR(deductions)}`,         color: 'var(--danger)', bg: 'var(--danger-light)', icon: FileText    },
              { label: 'Net Salary',       value: formatINR(net),                      color: 'var(--success)',bg: 'var(--success-light)', icon: DollarSign },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-card-icon" style={{ background: s.bg }}>
                  <s.icon size={22} color={s.color} />
                </div>
                <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Earnings Breakdown</h3></div>
              <div className="card-body">
                <InfoRow label="Basic Salary"       value={formatINR(latestPayroll.basic      || 0)} />
                <InfoRow label="House Rent (HRA)"   value={formatINR(latestPayroll.hra        || 0)} />
                <InfoRow label="Other Allowances"   value={formatINR(latestPayroll.allowances || 0)} />
                <InfoRow label="Bonus"              value={formatINR(latestPayroll.bonus      || 0)} />
                <InfoRow label="Gross Salary"       value={formatINR(gross)}                         highlight />
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="card-title">Deductions & Net Pay</h3></div>
              <div className="card-body">
                <InfoRow label="Income Tax (TDS)"   value={`−${formatINR(latestPayroll.tax           || 0)}`} negative />
                <InfoRow label="Health Insurance"   value={`−${formatINR(latestPayroll.insurance     || 0)}`} negative />
                <InfoRow label="Provident Fund"     value={`−${formatINR(latestPayroll.otherDeductions||0)}`} negative />
                <InfoRow label="Total Deductions"   value={`−${formatINR(deductions)}`}                       negative />
                <InfoRow label="Net Salary"         value={formatINR(net)}                                     highlight />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><h3 className="card-title">Payment Info</h3></div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <InfoRow label="Pay Period"    value={`${latestPayroll.month} ${latestPayroll.year || ''}`} />
              <InfoRow label="Payment Date"  value={latestPayroll.paymentDate || '—'} />
              <InfoRow label="Status"        value={<Badge status={latestPayroll.status} />} />
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>💰</div>
          <div className="empty-state-title">No payroll records yet</div>
          <div className="empty-state-desc">Your salary information will appear here once payroll is generated by HR</div>
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div>
      {myPayroll.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📊</div>
          <div className="empty-state-title">No payroll history</div>
          <div className="empty-state-desc">Payroll records will appear here once generated</div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Gross Salary</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Payment Date</th>
                <th>Status</th>
                <th>Payslip</th>
              </tr>
            </thead>
            <tbody>
              {myPayroll.map(p => {
                const g = (p.basic||0)+(p.hra||0)+(p.allowances||0)+(p.bonus||0);
                const d = (p.tax||0)+(p.insurance||0)+(p.otherDeductions||0);
                const n = g - d;
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.month} {p.year}</td>
                    <td>{formatINR(g)}</td>
                    <td style={{ color: 'var(--danger)' }}>−{formatINR(d)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatINR(n)}</td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{p.paymentDate || '—'}</td>
                    <td><Badge status={p.status} /></td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => { setSelectedPayslip(p); setActiveTab(2); }}>
                        <FileText size={12} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderPayslip = () => (
    <div>
      {myPayroll.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🧾</div>
          <div className="empty-state-title">No payslips available</div>
          <div className="empty-state-desc">Payslips will appear here once payroll is generated</div>
        </div>
      ) : (
        <>
          {/* Select payslip */}
          <div className="card" style={{ marginBottom: 16, padding: '12px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' }}>Select Payslip:</label>
              <select
                className="form-control form-select"
                style={{ maxWidth: 240 }}
                value={selectedPayslip?.id || (latestPayroll?.id || '')}
                onChange={e => setSelectedPayslip(myPayroll.find(p => p.id === e.target.value))}
              >
                {myPayroll.map(p => (
                  <option key={p.id} value={p.id}>{p.month} {p.year}</option>
                ))}
              </select>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={handlePrint}><Printer size={14} /> Print</button>
                <button className="btn btn-primary btn-sm" onClick={() => toast.success('Payslip downloaded')}><Download size={14} /> Download PDF</button>
              </div>
            </div>
          </div>
          <PayslipView payroll={selectedPayslip || latestPayroll} user={user} />
        </>
      )}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Payroll</h1>
        <p className="page-subtitle">View your salary information and payslips</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="tabs" style={{ padding: '0 24px' }}>
          {TABS.map((t, i) => (
            <div key={t} className={`tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>
          ))}
        </div>
        <div className="card-body">
          {activeTab === 0 && renderOverview()}
          {activeTab === 1 && renderHistory()}
          {activeTab === 2 && renderPayslip()}
        </div>
      </div>
    </div>
  );
};

export default EmployeePayroll;
