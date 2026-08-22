import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LEAVE_TYPES } from '../../data/sampleData';
import toast from 'react-hot-toast';

const ApplyLeave = () => {
  const navigate = useNavigate();
  const { addLeaveRequest, employees, leaveBalances } = useApp();
  const { user } = useAuth();
  const [form, setForm] = useState({ employee: '', leaveType: '', startDate: '', endDate: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const days = form.startDate && form.endDate ? (() => {
    const d = Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / 86400000) + 1;
    return d > 0 ? d : 0;
  })() : 0;

  const selectedEmp = employees.find(e => e.id === form.employee || e.name === form.employee);
  const balance = leaveBalances.find(b => b.employeeId === selectedEmp?.id);

  const validate = () => {
    const errs = {};
    if (!form.employee) errs.employee = 'Select an employee';
    if (!form.leaveType) errs.leaveType = 'Select leave type';
    if (!form.startDate) errs.startDate = 'Select start date';
    if (!form.endDate) errs.endDate = 'Select end date';
    if (!form.reason) errs.reason = 'Provide a reason';
    if (form.startDate && form.endDate && form.endDate < form.startDate) errs.endDate = 'End date cannot be before start date';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    addLeaveRequest({
      employeeId: selectedEmp?.id || form.employee,
      employeeName: selectedEmp?.name || form.employee,
      department: selectedEmp?.department || '',
      leaveType: form.leaveType,
      startDate: form.startDate,
      endDate: form.endDate,
      days,
      reason: form.reason,
    });
    toast.success('Leave request submitted successfully');
    setSubmitting(false);
    navigate('/leave/requests');
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Leave</span><span className="breadcrumb-sep">/</span><span>Apply Leave</span></div>
        <h1 className="page-title">Apply for Leave</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Leave Application</h3></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="form-group">
                  <label className="form-label">Employee <span className="required">*</span></label>
                  <select className={`form-control form-select ${errors.employee ? 'error' : ''}`} value={form.employee} onChange={e => set('employee', e.target.value)}>
                    <option value="">Select employee</option>
                    {employees.map(e => <option key={e._id} value={e.id}>{e.name}</option>)}
                  </select>
                  {errors.employee && <div className="form-error">{errors.employee}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Leave Type <span className="required">*</span></label>
                  <select className={`form-control form-select ${errors.leaveType ? 'error' : ''}`} value={form.leaveType} onChange={e => set('leaveType', e.target.value)}>
                    <option value="">Select leave type</option>
                    {LEAVE_TYPES.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                  {errors.leaveType && <div className="form-error">{errors.leaveType}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date <span className="required">*</span></label>
                  <input type="date" className={`form-control ${errors.startDate ? 'error' : ''}`} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
                  {errors.startDate && <div className="form-error">{errors.startDate}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">End Date <span className="required">*</span></label>
                  <input type="date" className={`form-control ${errors.endDate ? 'error' : ''}`} value={form.endDate} onChange={e => set('endDate', e.target.value)} min={form.startDate} />
                  {errors.endDate && <div className="form-error">{errors.endDate}</div>}
                </div>
              </div>

              {days > 0 && (
                <div style={{ background: 'var(--primary-light)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Calendar size={16} color="var(--primary)" />
                  <span style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 500 }}>
                    Duration: <strong>{days} working day{days > 1 ? 's' : ''}</strong>
                  </span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Reason <span className="required">*</span></label>
                <textarea className={`form-control ${errors.reason ? 'error' : ''}`} rows={4} value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Describe the reason for your leave request..." />
                {errors.reason && <div className="form-error">{errors.reason}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Supporting Document (optional)</label>
                <div className="file-upload-area" style={{ padding: 20 }}>
                  <Upload size={18} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--text-muted)' }} />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Upload medical certificate or supporting document</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-outline" onClick={() => navigate('/leave/requests')}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Leave Request'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Leave Balance Panel */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><h3 className="card-title">Leave Balance</h3></div>
            <div className="card-body" style={{ padding: 16 }}>
              {balance ? (
                LEAVE_TYPES.slice(0, 3).map(type => {
                  const key = type.name.split(' ')[0].toLowerCase();
                  const bal = balance[key];
                  if (!bal) return null;
                  const remaining = bal.total - bal.used - bal.pending;
                  return (
                    <div key={type.name} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{type.name}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>{remaining}/{bal.total}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(remaining / bal.total) * 100}%`, background: remaining > 5 ? 'var(--success)' : remaining > 2 ? 'var(--warning)' : 'var(--danger)' }} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{bal.used} used · {bal.pending} pending</div>
                    </div>
                  );
                })
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>Select an employee to see leave balance</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="card-title">Leave Types</h3></div>
            <div className="card-body" style={{ padding: 16 }}>
              {LEAVE_TYPES.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.8rem' }}>{t.name}</span>
                  <span className={`badge badge-${t.color}`} style={{ fontSize: '0.7rem' }}>{t.days} days</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeave;
