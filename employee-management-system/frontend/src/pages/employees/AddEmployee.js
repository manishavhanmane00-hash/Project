import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, Upload, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/shared/Avatar';
import { formatINR } from '../../utils/currency';
import {
  DEFAULT_COUNTRY, COUNTRIES, INDIAN_STATES, INDIAN_WORK_LOCATIONS,
  isValidIndianMobile, isValidPinCode, normalizeIndianMobile, formatIndianMobile,
} from '../../data/indiaGeo';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, label: 'Personal Info' },
  { id: 2, label: 'Employment' },
  { id: 3, label: 'Salary' },
  { id: 4, label: 'Account & Login' },
  { id: 5, label: 'Documents' },
];

const initialForm = {
  firstName: '', lastName: '', dob: '', gender: '', email: '', phone: '', altPhone: '',
  address: '', city: '', state: '', country: DEFAULT_COUNTRY, postal: '',
  department: '', designation: '', manager: '', joiningDate: '', employmentType: 'Full-time',
  workLocation: '', status: 'active', probation: '3 months',
  salary: '', hra: '', allowances: '', bonus: '', deductions: '',
  paymentMethod: 'Bank Transfer', bankAccount: '', bankName: '',
  // Login account (only used when creating a new employee)
  password: '', confirmPassword: '', loginRole: 'Employee',
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
  const [searchParams] = useSearchParams();
  const {
    addEmployee, updateEmployee, employees, departments, designations,
    getEmployeeDraft, saveEmployeeDraft,
  } = useApp();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const existingEmp = isEdit ? employees.find(e => e._id === id) : null;

  // Key used to remember the active draft across page refreshes (scoped per user).
  const DRAFT_KEY = `ems-active-draft-${user?._id || user?.id || 'anon'}`;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => {
    if (existingEmp) {
      return {
        ...initialForm,
        ...existingEmp,
        firstName: existingEmp.firstName || existingEmp.name?.split(' ')[0] || '',
        lastName: existingEmp.lastName || existingEmp.name?.split(' ').slice(1).join(' ') || '',
      };
    }
    return initialForm;
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  // Id of the draft currently being edited (null until first Save Draft / resume).
  const [draftId, setDraftId] = useState(null);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  // Merge a loaded draft document into the form state.
  const loadDraftIntoForm = useCallback((draft) => {
    setForm(f => ({
      ...initialForm,
      ...f,
      ...draft,
      country: draft.country || DEFAULT_COUNTRY,
      phone: normalizeIndianMobile(draft.phone || ''),
      // Login credentials are never stored on a draft.
      password: '', confirmPassword: '',
      loginRole: draft.loginRole || 'Employee',
    }));
    if (draft.draftStep) setStep(Math.min(Math.max(1, draft.draftStep), STEPS.length));
  }, []);

  // ── Resume a draft ──────────────────────────────────────────────────────────
  // Priority: ?draft=<id> query param, then the per-user localStorage pointer.
  useEffect(() => {
    if (isEdit) return; // editing a real employee — never load a draft
    const queryDraftId = searchParams.get('draft');
    const storedDraftId = localStorage.getItem(DRAFT_KEY);
    const resumeId = queryDraftId || storedDraftId;
    if (!resumeId) return;

    let cancelled = false;
    (async () => {
      try {
        const draft = await getEmployeeDraft(resumeId);
        if (cancelled || !draft) return;
        setDraftId(draft._id);
        localStorage.setItem(DRAFT_KEY, draft._id);
        loadDraftIntoForm(draft);
        toast.success('Resumed your saved draft');
      } catch {
        // Draft no longer exists (e.g. finalized or discarded) — clear the pointer.
        localStorage.removeItem(DRAFT_KEY);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit]);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.firstName) errs.firstName = 'Required';
      if (!form.lastName) errs.lastName = 'Required';
      if (!form.email) errs.email = 'Required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address';
      if (!form.phone) errs.phone = 'Required';
      else if (!isValidIndianMobile(form.phone)) errs.phone = 'Enter a valid 10-digit Indian mobile number';
      if (form.altPhone && !isValidIndianMobile(form.altPhone)) errs.altPhone = 'Enter a valid 10-digit Indian mobile number';
      if (form.country === 'India' && form.postal && !isValidPinCode(form.postal)) errs.postal = 'PIN code must be exactly 6 digits';
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
    if (s === 4 && !isEdit) {
      // Initial login password is required when creating a new employee so they
      // can sign in with their auto-generated Employee ID.
      if (!form.password) errs.password = 'Set an initial password for the employee';
      else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
      if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match';
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

  // Build the payload sent to the backend (shared by draft + finalize).
  const buildPayload = () => ({
    ...form,
    name: `${form.firstName} ${form.lastName}`.trim(),
    phone: normalizeIndianMobile(form.phone),
    altPhone: form.altPhone ? normalizeIndianMobile(form.altPhone) : '',
    salary: Number(form.salary) || 0,
    hra: Number(form.hra) || 0,
    allowances: Number(form.allowances) || 0,
    bonus: Number(form.bonus) || 0,
    deductions: Number(form.deductions) || 0,
  });

  // ── Save Draft ──────────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    const payload = buildPayload();
    // A draft never carries login credentials.
    delete payload.password;
    delete payload.confirmPassword;
    payload.draftStep = step;
    try {
      const draft = await saveEmployeeDraft(draftId, payload);
      setDraftId(draft._id);
      localStorage.setItem(DRAFT_KEY, draft._id);
      toast.success('Draft saved. You can resume it anytime.');
    } catch (err) {
      toast.error(err.message || 'Failed to save draft. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(step);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    const empData = buildPayload();
    // confirmPassword is a UI-only field — never send it to the backend.
    delete empData.confirmPassword;
    try {
      if (isEdit) {
        // Never change the login password through the edit form.
        delete empData.password;
        delete empData.loginRole;
        await updateEmployee(id, empData);
        toast.success('Employee updated successfully');
      } else {
        // If this employee started as a draft, pass the id so the backend
        // promotes the draft into a real record and clears it.
        if (draftId) empData.draftId = draftId;
        const created = await addEmployee(empData);
        const newId = created?.employeeId ? ` (ID: ${created.employeeId})` : '';
        toast.success(`Employee created successfully${newId}. They can log in with their Employee ID.`);
        // Draft has been finalized — clear the pointer.
        localStorage.removeItem(DRAFT_KEY);
      }
      navigate('/employees/list');
    } catch (err) {
      toast.error(err.message || 'Failed to save employee. Please try again.');
    } finally {
      setSaving(false);
    }
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

  const isIndia = form.country === 'India';

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
          <input className={`form-control ${errors.firstName ? 'error' : ''}`} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Enter first name" />
        </FormField>
        <FormField label="Last Name" required error={errors.lastName}>
          <input className={`form-control ${errors.lastName ? 'error' : ''}`} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Enter last name" />
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
          <input type="email" className={`form-control ${errors.email ? 'error' : ''}`} value={form.email} onChange={e => set('email', e.target.value)} placeholder="Enter email address" />
        </FormField>
        <FormField label="Mobile Number" required error={errors.phone} hint={form.phone ? formatIndianMobile(form.phone) : 'Format: +91 XXXXX XXXXX'}>
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: '0.875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>+91</span>
            <input
              className={`form-control ${errors.phone ? 'error' : ''}`}
              style={{ borderRadius: '0 8px 8px 0' }}
              value={form.phone}
              onChange={e => set('phone', normalizeIndianMobile(e.target.value))}
              placeholder="Enter 10-digit mobile number"
              inputMode="numeric"
              maxLength={10}
            />
          </div>
        </FormField>
        <FormField label="Alternate Mobile Number" error={errors.altPhone}>
          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: '0.875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>+91</span>
            <input
              className={`form-control ${errors.altPhone ? 'error' : ''}`}
              style={{ borderRadius: '0 8px 8px 0' }}
              value={form.altPhone}
              onChange={e => set('altPhone', normalizeIndianMobile(e.target.value))}
              placeholder="Optional"
              inputMode="numeric"
              maxLength={10}
            />
          </div>
        </FormField>
      </div>
      <FormField label="Address">
        <input className="form-control" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Enter full address" />
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 16px' }}>
        <FormField label="City">
          <input className="form-control" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Enter city" />
        </FormField>
        <FormField label="State">
          {isIndia ? (
            <select className="form-control form-select" value={form.state} onChange={e => set('state', e.target.value)}>
              <option value="">Select state</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input className="form-control" value={form.state} onChange={e => set('state', e.target.value)} placeholder="Enter state" />
          )}
        </FormField>
        <FormField label="Country">
          <select className="form-control form-select" value={form.country} onChange={e => { set('country', e.target.value); if (e.target.value !== 'India') set('state', form.state); }}>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>
        <FormField label="PIN Code" error={errors.postal} hint={isIndia ? 'Exactly 6 digits' : undefined}>
          <input
            className={`form-control ${errors.postal ? 'error' : ''}`}
            value={form.postal}
            onChange={e => set('postal', isIndia ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value)}
            placeholder={isIndia ? 'Enter 6-digit PIN code' : 'Enter postal code'}
            inputMode={isIndia ? 'numeric' : undefined}
            maxLength={isIndia ? 6 : undefined}
          />
        </FormField>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
      <FormField label="Department" required error={errors.department}>
        <select className={`form-control form-select ${errors.department ? 'error' : ''}`} value={form.department} onChange={e => set('department', e.target.value)}>
          <option value="">Select department</option>
          {departments.map(d => <option key={d._id || d.id || d.name} value={d.name}>{d.name}</option>)}
        </select>
      </FormField>
      <FormField label="Designation / Role" required error={errors.designation}>
        <input
          className={`form-control ${errors.designation ? 'error' : ''}`}
          value={form.designation}
          onChange={e => set('designation', e.target.value)}
          placeholder="e.g. Software Engineer"
          list="designation-list"
        />
        <datalist id="designation-list">
          {designations.map((d, i) => <option key={i} value={typeof d === 'string' ? d : d.name} />)}
        </datalist>
      </FormField>
      <FormField label="Manager / Reporting To">
        <input className="form-control" value={form.manager} onChange={e => set('manager', e.target.value)} placeholder="Enter manager name" />
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
          {INDIAN_WORK_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
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
            <input type="number" className={`form-control ${errors.salary ? 'error' : ''}`} value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="Enter basic salary" min="0" />
          </FormField>
          <FormField label="HRA (₹/year)">
            <input type="number" className="form-control" value={form.hra} onChange={e => set('hra', e.target.value)} placeholder="Enter HRA" min="0" />
          </FormField>
          <FormField label="Other Allowances (₹/year)">
            <input type="number" className="form-control" value={form.allowances} onChange={e => set('allowances', e.target.value)} placeholder="Enter allowances" min="0" />
          </FormField>
          <FormField label="Bonus (₹/year)">
            <input type="number" className="form-control" value={form.bonus} onChange={e => set('bonus', e.target.value)} placeholder="Enter bonus" min="0" />
          </FormField>
          <FormField label="Deductions (TDS + PF + Insurance, ₹/year)">
            <input type="number" className="form-control" value={form.deductions} onChange={e => set('deductions', e.target.value)} placeholder="Enter deductions" min="0" />
          </FormField>
          <FormField label="Payment Method">
            <select className="form-control form-select" value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
              <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
            </select>
          </FormField>
          <FormField label="Bank Account Number">
            <input className="form-control" value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} placeholder="Enter account number" />
          </FormField>
          <FormField label="Bank Name">
            <input className="form-control" value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="Enter bank name" />
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
      <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: 12, padding: 16, marginBottom: 24, color: 'var(--primary)', fontSize: '0.875rem' }}>
        <strong>Login account:</strong> A unique <strong>Employee ID</strong> is generated automatically on save.
        The employee signs in with that ID and the password you set below. They can change it after logging in.
      </div>

      {isEdit ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Passwords cannot be changed from the edit form. Use <strong>Reset Password</strong> from the employee list to issue a new password.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <FormField label="Login Role" hint="Controls which features this account can access.">
            <select className="form-control form-select" value={form.loginRole} onChange={e => set('loginRole', e.target.value)}>
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
              <option value="HR">HR</option>
            </select>
          </FormField>
          <div />
          <FormField label="Initial Password" required error={errors.password} hint="Minimum 6 characters.">
            <input type="password" className={`form-control ${errors.password ? 'error' : ''}`} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Set an initial password" autoComplete="new-password" />
          </FormField>
          <FormField label="Confirm Password" required error={errors.confirmPassword}>
            <input type="password" className={`form-control ${errors.confirmPassword ? 'error' : ''}`} value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Re-enter the password" autoComplete="new-password" />
          </FormField>
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div className="file-upload-area">
          <div className="file-upload-icon"><Upload size={22} /></div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>Drag & drop files here or click to browse</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PDF, JPG, PNG up to 10MB</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {['Resume / CV', 'ID Proof (Aadhaar / PAN)', 'Address Proof', 'Education Certificate', 'Offer Letter', 'Other Documents'].map(doc => (
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
        {!isEdit && draftId && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Editing a saved draft — changes are kept until you finalize.</div>
        )}
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
            {step === 5 && renderStep5()}

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => navigate('/employees/list')}>Cancel</button>
                {!isEdit && (
                  <button type="button" className="btn btn-ghost" onClick={handleSaveDraft} disabled={savingDraft}>
                    {savingDraft ? 'Saving…' : 'Save Draft'}
                  </button>
                )}
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
