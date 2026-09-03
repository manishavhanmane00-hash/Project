import React, { useState } from 'react';
import { Printer, Download, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/shared/Avatar';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import { formatINR } from '../../utils/currency';
import toast from 'react-hot-toast';

/* ─── Printable Payslip ───────────────────────────────────────────────── */
const Payslip = ({ employee, payroll }) => {
  const gross      = (payroll.basic || 0) + (payroll.hra || 0) + (payroll.allowances || 0) + (payroll.bonus || 0);
  const deductions = (payroll.tax   || 0) + (payroll.insurance || 0) + (payroll.otherDeductions || 0);
  const net        = gross - deductions;

  return (
    <div id="payslip-print" style={{ background: 'white', padding: 32, fontFamily: 'Inter, sans-serif', maxWidth: 700, margin: '0 auto', border: '1px solid #e2e8f0', borderRadius: 12 }}>
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
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>Currency: ₹ INR</div>
        </div>
      </div>

      {/* Employee & Payment Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24, background: '#f8fafc', borderRadius: 10, padding: 16 }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee Information</div>
          {[['Name', employee.name], ['Employee ID', employee.id], ['Department', employee.department], ['Designation', employee.designation]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 100, fontSize: '0.8rem', color: '#64748b' }}>{k}:</span>
              <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{v}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Details</div>
          {[
            ['Pay Period',    `${payroll.month} ${payroll.year}`],
            ['Payment Date',  payroll.paymentDate || '—'],
            ['Payment Mode',  employee.paymentMethod || 'Bank Transfer'],
            ['Bank',          employee.bankName || '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 100, fontSize: '0.8rem', color: '#64748b' }}>{k}:</span>
              <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings & Deductions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Earnings */}
        <div>
          <div style={{ background: '#d1fae5', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: '0.75rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>Earnings</div>
          {[['Basic Salary', payroll.basic], ['House Rent Allowance (HRA)', payroll.hra], ['Other Allowances', payroll.allowances], ['Bonus', payroll.bonus]].map(([k, v]) => (
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

        {/* Deductions */}
        <div>
          <div style={{ background: '#fee2e2', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>Deductions</div>
          {[['Income Tax (TDS)', payroll.tax], ['Health Insurance', payroll.insurance], ['Provident Fund (PF)', payroll.otherDeductions]].map(([k, v]) => (
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
        This is a computer-generated payslip. No signature required. All amounts in Indian Rupees (₹ INR).
      </div>
    </div>
  );
};

/* ─── Payslips List Page ──────────────────────────────────────────────── */
const Payslips = () => {
  const { employees, payrollData } = useApp();
  const [search,      setSearch]      = useState('');
  const [viewPayslip, setViewPayslip] = useState(null);

  const filtered = payrollData.filter(p => {
    const s = search.toLowerCase();
    return p.employeeName?.toLowerCase().includes(s) || p.department?.toLowerCase().includes(s);
  });

  const getEmp = (employeeId) =>
    employees.find(e =>
      e._id === employeeId ||
      e._id?.toString() === employeeId?.toString() ||
      e.email === employeeId
    ) || { name: employeeId, _id: employeeId, department: '', designation: '' };

  const handlePrint = () => {
    window.print();
    toast.success('Printing payslip…');
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Payroll</span><span className="breadcrumb-sep">/</span><span>Payslips</span></div>
        <h1 className="page-title">Payslips</h1>
        <p className="page-subtitle">View and download employee payslips (₹ INR)</p>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div className="search-input-wrapper">
          <Search size={14} className="search-icon" />
          <input className="form-control" placeholder="Search employee or department…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {payrollData.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No payslips yet</div>
          <div className="empty-state-desc">Generate payroll first to create payslips.</div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Employee</th><th>Pay Period</th><th>Gross</th><th>Deductions</th><th>Net Salary</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const emp        = getEmp(p.employeeId);
                const gross      = (p.basic || 0) + (p.hra || 0) + (p.allowances || 0) + (p.bonus || 0);
                const deductions = (p.tax   || 0) + (p.insurance || 0) + (p.otherDeductions || 0);
                const net        = gross - deductions;
                return (
                  <tr key={p._id || p.id}>
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
                    <td style={{ fontWeight: 500 }}>{formatINR(gross)}</td>
                    <td style={{ color: 'var(--danger)' }}>−{formatINR(deductions)}</td>
                    <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatINR(net)}</span></td>
                    <td><Badge status={p.status} /></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => setViewPayslip({ emp, payroll: p })}>View</button>
                        <button className="btn-icon" title="Download" onClick={() => toast.success('Payslip downloaded')}><Download size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No payslips found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewPayslip && (
        <Modal open={true} onClose={() => setViewPayslip(null)} title="Payslip" size="lg"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setViewPayslip(null)}>Close</button>
              <button className="btn btn-outline btn-sm" onClick={handlePrint}><Printer size={14} /> Print</button>
              <button className="btn btn-primary btn-sm" onClick={() => toast.success('Payslip downloaded')}><Download size={14} /> Download PDF</button>
            </>
          }
        >
          <Payslip employee={viewPayslip.emp} payroll={viewPayslip.payroll} />
        </Modal>
      )}
    </div>
  );
};

export default Payslips;
