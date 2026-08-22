import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/shared/Avatar';
import Badge from '../../components/shared/Badge';
import { formatINR } from '../../utils/currency';
import toast from 'react-hot-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const GeneratePayroll = () => {
  const { employees, payrollData, generatePayroll, departments } = useApp();
  const [month,      setMonth]      = useState(MONTHS[new Date().getMonth()]);
  const [year,       setYear]       = useState(String(new Date().getFullYear()));
  const [deptFilter, setDeptFilter] = useState('');
  const [selected,   setSelected]   = useState([]);
  const [processing, setProcessing] = useState(false);

  const filteredEmps   = employees.filter(e => !deptFilter || e.department === deptFilter);
  const allSelected    = filteredEmps.length > 0 && selected.length === filteredEmps.length;

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll    = () => setSelected(allSelected ? [] : filteredEmps.map(e => e._id));

  // Monthly salary breakdown from annual figures
  const calcPayroll = (emp) => {
    const basic     = Math.round(emp.salary / 12);
    const hra       = Math.round((emp.hra       || 0) / 12);
    const allowances= Math.round((emp.allowances || 0) / 12);
    const bonus     = Math.round((emp.bonus      || 0) / 12);
    const tax       = Math.round(basic * 0.10);   // 10 % TDS
    const insurance = Math.round(basic * 0.02);   // 2 % health insurance
    const pf        = Math.round(basic * 0.12);   // 12 % PF (employer + employee share reflected)
    const gross     = basic + hra + allowances + bonus;
    const net       = gross - tax - insurance - pf;
    return { basic, hra, allowances, bonus, tax, insurance, otherDeductions: pf, gross, net };
  };

  const totalGross = filteredEmps
    .filter(e => selected.includes(e._id))
    .reduce((sum, e) => sum + calcPayroll(e).gross, 0);

  const handleGenerate = async () => {
    if (selected.length === 0) { toast.error('Select at least one employee'); return; }
    setProcessing(true);
    await new Promise(r => setTimeout(r, 800));
    const emps = employees.filter(e => selected.includes(e._id));
    emps.forEach(emp => {
      const calc = calcPayroll(emp);
      const paymentMonth = String(MONTHS.indexOf(month) + 1).padStart(2, '0');
      generatePayroll({
        employeeId:   emp.id,
        employeeName: emp.name,
        department:   emp.department,
        month,
        year: Number(year),
        ...calc,
        paymentDate: `${year}-${paymentMonth}-28`,
      });
    });
    toast.success(`Payroll generated for ${emps.length} employee${emps.length > 1 ? 's' : ''}`);
    setSelected([]);
    setProcessing(false);
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Payroll</span><span className="breadcrumb-sep">/</span><span>Generate Payroll</span></div>
        <h1 className="page-title">Generate Payroll</h1>
        <p className="page-subtitle">Generate monthly payroll for employees (₹ INR)</p>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
              <label className="form-label">Month</label>
              <select className="form-control form-select" value={month} onChange={e => setMonth(e.target.value)}>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 100 }}>
              <label className="form-label">Year</label>
              <select className="form-control form-select" value={year} onChange={e => setYear(e.target.value)}>
                {['2024','2025','2026','2027'].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 180 }}>
              <label className="form-label">Department</label>
              <select className="form-control form-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="badge badge-info">{selected.length} / {filteredEmps.length} selected</span>
              {selected.length > 0 && (
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--success)' }}>
                  Total: {formatINR(totalGross)}
                </span>
              )}
            </div>
            <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}
              onClick={handleGenerate} disabled={processing || selected.length === 0}>
              {processing ? 'Generating…' : `Generate Payroll (${selected.length})`}
            </button>
          </div>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No employees found</div>
          <div className="empty-state-desc">Add employees before generating payroll.</div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={allSelected}
                    onChange={toggleAll} style={{ accentColor: 'var(--primary)' }} />
                </th>
                <th>Employee</th><th>Basic (Monthly)</th><th>HRA</th><th>Allowances</th>
                <th>Bonus</th><th>Deductions</th><th>Gross</th><th>Net Salary</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmps.map(emp => {
                const calc     = calcPayroll(emp);
                const existing = payrollData.find(
                  p => p.employeeId === emp.id && p.month === month && p.year === Number(year)
                );
                return (
                  <tr key={emp._id} style={{ background: selected.includes(emp._id) ? 'var(--primary-light)' : '' }}>
                    <td>
                      <input type="checkbox" checked={selected.includes(emp._id)}
                        onChange={() => toggleSelect(emp._id)} style={{ accentColor: 'var(--primary)' }} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={emp.name} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{emp.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.department}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatINR(calc.basic)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatINR(calc.hra)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatINR(calc.allowances)}</td>
                    <td style={{ color: 'var(--success)' }}>{formatINR(calc.bonus)}</td>
                    <td style={{ color: 'var(--danger)' }}>−{formatINR(calc.tax + calc.insurance + calc.otherDeductions)}</td>
                    <td style={{ fontWeight: 600 }}>{formatINR(calc.gross)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatINR(calc.net)}</td>
                    <td>
                      {existing
                        ? <Badge status={existing.status} />
                        : <span className="badge badge-gray">Not Generated</span>}
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
};

export default GeneratePayroll;
