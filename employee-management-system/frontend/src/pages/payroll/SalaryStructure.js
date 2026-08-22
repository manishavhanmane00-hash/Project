import React, { useState } from 'react';
import { Search, Edit2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/shared/Avatar';
import Modal from '../../components/shared/Modal';
import { formatINR } from '../../utils/currency';
import toast from 'react-hot-toast';

const SalaryStructure = () => {
  const { employees, updateEmployee } = useApp();
  const [search, setSearch] = useState('');
  const [editEmp, setEditEmp] = useState(null);
  const [form, setForm] = useState({});

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (emp) => {
    setEditEmp(emp);
    setForm({ salary: emp.salary, hra: emp.hra || 0, allowances: emp.allowances || 0, bonus: emp.bonus || 0, deductions: emp.deductions || 0 });
  };

  const gross = Number(form.salary || 0) + Number(form.hra || 0) + Number(form.allowances || 0) + Number(form.bonus || 0);
  const net   = gross - Number(form.deductions || 0);

  const handleSave = () => {
    updateEmployee(editEmp._id, {
      ...form,
      salary:     Number(form.salary),
      hra:        Number(form.hra),
      allowances: Number(form.allowances),
      bonus:      Number(form.bonus),
      deductions: Number(form.deductions),
    });
    toast.success('Salary structure updated');
    setEditEmp(null);
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Payroll</span><span className="breadcrumb-sep">/</span><span>Salary Structure</span></div>
        <h1 className="page-title">Salary Structure</h1>
        <p className="page-subtitle">Configure compensation for each employee (₹ INR)</p>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div className="search-input-wrapper">
          <Search size={14} className="search-icon" />
          <input className="form-control" placeholder="Search employee or department…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ width: 64, height: 64, background: 'var(--bg)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Search size={28} color="var(--text-muted)" />
          </div>
          <div className="empty-state-title">No employees yet</div>
          <div className="empty-state-desc">Add employees first to configure their salary structure.</div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th><th>Basic Salary</th><th>HRA</th><th>Allowances</th>
                <th>Bonus</th><th>Deductions</th><th>Net Salary</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => {
                const g = emp.salary + (emp.hra || 0) + (emp.allowances || 0) + (emp.bonus || 0);
                const n = g - (emp.deductions || 0);
                return (
                  <tr key={emp._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={emp.name} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{emp.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.department}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{formatINR(emp.salary)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatINR(emp.hra || 0)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatINR(emp.allowances || 0)}</td>
                    <td style={{ color: 'var(--success)' }}>{formatINR(emp.bonus || 0)}</td>
                    <td style={{ color: 'var(--danger)' }}>−{formatINR(emp.deductions || 0)}</td>
                    <td><span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{formatINR(n)}</span></td>
                    <td>
                      <button className="btn-icon primary" onClick={() => openEdit(emp)} title="Edit Salary"><Edit2 size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editEmp && (
        <Modal open={true} onClose={() => setEditEmp(null)} title={`Edit Salary: ${editEmp.name}`} size="md"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setEditEmp(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
            </>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {[['Basic Salary', 'salary'], ['HRA', 'hra'], ['Allowances', 'allowances'], ['Bonus', 'bonus'], ['Deductions', 'deductions']].map(([label, key]) => (
              <div key={key} className="form-group">
                <label className="form-label">{label} (₹/year)</label>
                <input type="number" className="form-control" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} min="0" />
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--primary-light)', borderRadius: 12, padding: 16, marginTop: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[['Gross', gross, 'var(--info)'], ['Deductions', Number(form.deductions || 0), 'var(--danger)'], ['Net Salary', net, 'var(--success)']].map(([l, v, c]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: c }}>{formatINR(v)}</div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SalaryStructure;
