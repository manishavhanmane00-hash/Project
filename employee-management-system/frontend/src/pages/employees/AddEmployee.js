import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Upload, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/shared/Avatar';
import { formatINR } from '../../utils/currency';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, label: 'Personal Info' },
  { id: 2, label: 'Employment' },
  { id: 3, label: 'Salary' },
  { id: 4, label: 'Documents' },
];

const initialForm = {
  firstName: '', lastName: '', dob: '', gender: '', email: '', phone: '', altPhone: '',
  address: '', city: '', state: '', country: 'USA', postal: '',
  department: '', designation: '', manager: '', joiningDate: '', employmentType: 'Full-time',
  workLocation: '', status: 'active', probation: '3 months',
  salary: '', hra: '', allowances: '', bonus: '', deductions: '',
  paymentMethod: 'Bank Transfer', bankAccount: '', bankName: '',
  documents: [],
};

const FormField = ({ label, required, error, children, hint }) => (
  <div className="form-group">
    <label className="form-label">{label}{required && <span className="required">*</span>}</label>
    {children}
    {hint && <div className="form-hint">{hint}</div>}
    {error && <div className="form-error">{error}</div>}
  </div>
);

const AddEmployee = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addEmployee, updateEmployee, employees, departments, designations } = useApp();
  const isEdit = Boolean(id);
  const existingEmp = isEdit ? employees.find(e => e._id === id) : null;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => {
    if (existingEmp) {
      return { ...initialForm, ...existingEmp, firstName: existingEmp.firstName || existingEmp.name?.split(' ')[0] || '', lastName: existingEmp.lastName || existingEmp.name?.split(' ')[1] || '' };
    }
    return initialForm;
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const validate = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.firstName) errs.firstName = 'Required';
      if (!form.lastName) errs.lastName = 'Required';
      if (!form.email) errs.email = 'Required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
      if (!form.phone) errs.phone = 'Required';
      if (!form.dob) errs.dob = 'Required';
      if (!form.gender) errs.gender = 'Required';
    }
    if (s === 2) {
      if (!form.department) errs.department = 'Required';
      if (!form.designation) errs.designation = 'Required';
      if (!form.joiningDate) errs.joiningDate = 'Required';
    }
    if (s === 3) {
      if (!form.salary) errs.salary = 'Required';
    }
    return errs;
  };

  const next = () => {
    const errs = validate(step);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const prev = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(step);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    const empData = {
      ...form,
      name: `${form.firstName} ${form.lastName}`.trim(),
      salary: Number(form.salary),
      hra: Number(form.hra) || 0,
      allowances: Number(form.allowances) || 0,
      bonus: Number(form.bonus) || 0,
      deductions: Number(form.deductions) || 0,
    };
    if (isEdit) {
      updateEmployee(id, empData);
      toast.success('Employee updated successfully');
    } else {
      addEmployee(empData);
      toast.success('Employee created successfully');
    }
    setSaving(false);
    navigate('/employees/list');
  };

  const StepCircle = ({ s }) => {
    const done = step > s;
    const active = step === s;
    return (
      <div style={{ display: 'flex', alignItems: 'center', flex: s < STEPS.length ? 1 : 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: '0.875rem',
            background: done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--surface)',
            color: (done || active) ? 'white' : 'var(--text-muted)',
            border: `2px solid ${done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--border)'}`
          }}>
            {done ? <Check size={16} /> : s}
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 500, color: done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {STEPS[s - 1].label}
          </span>
        </div>
        {s < STEPS.length && (
          <div style={{ flex: 1, height: 2, background: step > s ? 'var(--success)' : 'var(--border)', margin: '0 8px', marginBottom: 22 }} />
        )}
      </div>
    );
  };

  const renderStep1 = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', overflow: 'hidden', cursor: 'pointer' }}>
          {form.firstName ? <Avatar name={`${form.firstName} ${form.lastName}`} size="xl" /> : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <Upload size={20} /><div style={{ fontSize: '0.65rem', marginTop: 4 }}>Upload</div>
            </div>
          )}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Profile photo (optional)</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <FormField label="First Name" required error={errors.firstName}>
          <input className={`form-control ${errors.firstName ? 'error' : ''}`} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="John" />
        </FormField>
        <FormField label="Last Name" required error={errors.lastName}>
          <input className={`form-control ${errors.lastName ? 'error' : ''}`} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Doe" />
        </FormField>
        <FormField label="Date of Birth" required error={errors.dob}>
          <input type="date" className={`form-control ${errors.dob ? 'error' : ''}`} value={form.dob} onChange={e => set('dob', e.target.value)} />
        </FormField>
        <FormField label="Gender" required error={errors.gender}>
          <select className={`form-control form-select ${errors.gender ? 'error' : ''}`} value={form.gender} onChange={e => set('gender', e.target.value)}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </FormField>
        <FormField label="Email" required error={errors.email}>
          <input type="email" className={`form-control ${errors.email ? 'error' : ''}`} value={form.email} onChange={e => set('email', e.target.value)} placeholder="john.doe@acmecorp.com" />
        </FormField>
        <FormField label="Phone" required error={errors.phone}>
          <input className={`form-control ${errors.phone ? 'error' : ''}`} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
        </FormField>
        <FormField label="Alternate Phone">
          <input className="form-control" value={form.altPhone} onChange={e => set('altPhone', e.target.value)} placeholder="Optional" />
        </FormField>
      </div>
      <FormField label="Address">
        <input className="form-control" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" />
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
        <FormField label="City">
          <input className="form-control" value={form.city} onChange={e => set('city', e.target.value)} placeholder="New York" />
        </FormField>
        <FormField label="State">
          <input className="form-control" value={form.state} onChange={e => set('state', e.target.value)} placeholder="NY" />
        </FormField>
        <FormField label="Country">
          <input className="form-control" value={form.country} onChange={e => set('country', e.target.value)} placeholder="USA" />
        </FormField>
        <FormField label="Postal Code">
          <input className="form-control" value={form.postal} onChange={e => set('postal', e.target.value)} placeholder="10001" />
        </FormField>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
      <FormField label="Department" required error={errors.department}>
        <select className={`form-control form-select ${errors.department ? 'error' : ''}`} value={form.department} onChange={e => set('department', e.target.value)}>
          <option value="">Select department</option>
          {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        </select>
      </FormField>
      <FormField label="Designation / Role" required error={errors.designation}>
        <select className={`form-control form-select ${errors.designation ? 'error' : ''}`} value={form.designation} onChange={e => set('designation', e.target.value)}>
          <option value="">Select designation</option>
          {designations.filter(d => !form.department || d.department === form.department).map(d => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Manager / Reporting To">
        <input className="form-control" value={form.manager} onChange={e => set('manager', e.target.value)} placeholder="Manager name" />
      </FormField>
      <FormField label="Joining Date" required error={errors.joiningDate}>
        <input type="date" className={`form-control ${errors.joiningDate ? 'error' : ''}`} value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} />
      </FormField>
      <FormField label="Employment Type">
        <select className="form-control form-select" value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Contract">Contract</option>
          <option value="Intern">Intern</option>
        </select>
      </FormField>
      <FormField label="Work Location">
        <select className="form-control form-select" value={form.workLocation} onChange={e => set('workLocation', e.target.value)}>
          <option value="">Select location</option>
          <option value="HQ - New York">HQ - New York</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Branch - LA">Branch - LA</option>
        </select>
      </FormField>
      <FormField label="Employee Status">
        <select className="form-control form-select" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on-leave">On Leave</option>
        </select>
      </FormField>
      <FormField label="Probation Period">
        <select className="form-control form-select" value={form.probation} onChange={e => set('probation', e.target.value)}>
          <option value="N/A">N/A</option>
          <option value="1 month">1 month</option>
          <option value="3 months">3 months</option>
          <option value="6 months">6 months</option>
        </select>
      </FormField>
    </div>
  );

  const renderStep3 = () => {
    const gross = (Number(form.salary) + Number(form.hra || 0) + Number(form.allowances || 0) + Number(form.bonus || 0));
    const net = gross - Number(form.deductions || 0);
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <FormField label="Basic Salary (₹/year)" required error={errors.salary}>
            <input type="number" className={`form-control ${errors.salary ? 'error' : ''}`} value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="0" min="0" />
          </FormField>
          <FormField label="HRA (₹/year)">
            <input type="number" className="form-control" value={form.hra} onChange={e => set('hra', e.target.value)} placeholder="0" min="0" />
          </FormField>
          <FormField label="Other Allowances (₹/year)">
            <input type="number" className="form-control" value={form.allowances} onChange={e => set('allowances', e.target.value)} placeholder="0" min="0" />
          </FormField>
          <FormField label="Bonus ($/year)">
            <input type="number" className="form-control" value={form.bonus} onChange={e => set('bonus', e.target.value)} placeholder="0" min="0" />
          </FormField>
          <FormField label="Deductions (TDS + PF + Insurance, ₹/year)">
            <input type="number" className="form-control" value={form.deductions} onChange={e => set('deductions', e.target.value)} placeholder="0" min="0" />
          </FormField>
          <FormField label="Payment Method">
            <select className="form-control form-select" value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
              <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
            </select>
          </FormField>
          <FormField label="Bank Account Number">
            <input className="form-control" value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} placeholder="Account number" />
          </FormField>
          <FormField label="Bank Name">
            <input className="form-control" value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="Bank name" />
          </FormField>
        </div>
        {form.salary && (
          <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: 12, padding: 20, marginTop: 8 }}>
            <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 12 }}>Salary Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[['Gross Salary', gross], ['Total Deductions', Number(form.deductions || 0)], ['Net Salary', net]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l}</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: l === 'Net Salary' ? 'var(--success)' : 'var(--text-primary)' }}>
                    {formatINR(v)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStep4 = () => (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div className="file-upload-area">
          <div className="file-upload-icon"><Upload size={22} /></div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>Drag & drop files here or click to browse</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PDF, JPG, PNG up to 10MB</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {['Resume / CV', 'ID Proof (Passport / Driver\'s License)', 'Address Proof', 'Education Certificate', 'Offer Letter', 'Other Documents'].map(doc => (
          <div key={doc} className="file-item">
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Upload size={14} color="var(--primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{doc}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No file selected</div>
            </div>
            <button className="btn-icon" style={{ background: 'none' }}>
              <Upload size={14} />
            </button>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--success-light)', borderRadius: 10, padding: 16, marginTop: 20, color: 'var(--success)', fontSize: '0.875rem' }}>
        <strong>Note:</strong> Document uploads are optional. You can add documents later from the employee profile.
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">
          <span className="text-primary" style={{ cursor: 'pointer' }} onClick={() => navigate('/employees/list')}>Employees</span>
          <span className="breadcrumb-sep">/</span>
          <span>{isEdit ? 'Edit Employee' : 'Add Employee'}</span>
        </div>
        <h1 className="page-title">{isEdit ? `Edit: ${existingEmp?.name}` : 'Add New Employee'}</h1>
      </div>

      <div className="card">
        <div className="card-body">
          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
            {STEPS.map(s => <StepCircle key={s.id} s={s.id} />)}
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => navigate('/employees/list')}>Cancel</button>
                <button type="button" className="btn btn-ghost" onClick={() => toast.success('Draft saved')}>Save Draft</button>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {step > 1 && (
                  <button type="button" className="btn btn-outline" onClick={prev}>← Previous</button>
                )}
                {step < STEPS.length ? (
                  <button type="button" className="btn btn-primary" onClick={next}>
                    Next Step <ChevronRight size={14} />
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : isEdit ? '✓ Update Employee' : '✓ Create Employee'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;
