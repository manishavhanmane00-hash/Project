import React, { useState } from 'react';
import {
  Building2, User, Users, Shield, Bell, PlaneTakeoff,
  DollarSign, Clock, Settings as SettingsIcon, ChevronRight,
  Save, Camera, UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/shared/Avatar';
import Modal from '../components/shared/Modal';
import toast from 'react-hot-toast';

const SETTINGS_SECTIONS = [
  { id: 'company',       label: 'Company Profile',     icon: Building2     },
  { id: 'profile',       label: 'My Profile',          icon: User          },
  { id: 'users',         label: 'User Management',     icon: Users         },
  { id: 'roles',         label: 'Roles & Permissions', icon: Shield        },
  { id: 'notifications', label: 'Notifications',       icon: Bell          },
  { id: 'leave',         label: 'Leave Settings',      icon: PlaneTakeoff  },
  { id: 'payroll',       label: 'Payroll Settings',    icon: DollarSign    },
  { id: 'attendance',    label: 'Attendance Settings', icon: Clock         },
  { id: 'general',       label: 'General Settings',    icon: SettingsIcon  },
];

const PERMISSIONS = {
  Admin:    { employees: true,  attendance: true,  leave: true,  payroll: true,  performance: true,  reports: true,  settings: true,  departments: true  },
  HR:       { employees: true,  attendance: true,  leave: true,  payroll: true,  performance: false, reports: true,  settings: false, departments: true  },
  Manager:  { employees: false, attendance: true,  leave: true,  payroll: false, performance: true,  reports: true,  settings: false, departments: false },
  Employee: { employees: false, attendance: false, leave: true,  payroll: false, performance: false, reports: false, settings: false, departments: false },
};

/* ── Reusable field component ──────────────────────────────────────────── */
const Field = ({ label, defaultValue, type = 'text', hint, value, onChange }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    {onChange
      ? <input type={type} className="form-control" value={value} onChange={onChange} />
      : <input type={type} className="form-control" defaultValue={defaultValue} />}
    {hint && <div className="form-hint">{hint}</div>}
  </div>
);

/* ── Toggle switch ─────────────────────────────────────────────────────── */
const Toggle = ({ label, desc, defaultChecked }) => {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer', flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
        <span style={{ position: 'absolute', inset: 0, borderRadius: 12, background: checked ? 'var(--primary)' : 'var(--border)', transition: 'background 0.2s' }}>
          <span style={{ position: 'absolute', left: checked ? 22 : 2, top: 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </span>
      </label>
    </div>
  );
};

/* ── Section content ───────────────────────────────────────────────────── */
const SectionContent = ({ section, user, registry }) => {
  const [saving, setSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const { register } = useAuth();

  const [company, setCompany] = useState({
    name: '', website: '', industry: '', size: '', email: '', phone: '', address: '',
    city: '', state: '', country: 'India', timezone: 'Asia/Kolkata',
    currency: 'INR (₹)', fiscalYear: 'April',
  });

  const [profileForm, setProfileForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName:  user?.name?.split(' ').slice(1).join(' ') || '',
    email:     user?.email || '',
    phone: '', currentPassword: '', newPassword: '', confirmPassword: '',
  });

  const [inviteForm, setInviteForm] = useState({ name: '', email: '', password: '', role: 'Employee', department: '' });

  const DEPTS = ['Engineering','Human Resources','Marketing','Sales','Finance','Operations','Design','Legal'];

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    toast.success('Settings saved');
    setSaving(false);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    const res = await register(inviteForm);
    if (res.success) {
      toast.success(`Account created for ${inviteForm.name}`);
      setInviteOpen(false);
      setInviteForm({ name: '', email: '', password: '', role: 'Employee', department: '' });
    } else {
      toast.error(res.error);
    }
  };

  switch (section) {
    /* ── Company Profile ─────────────────────────────────────────────── */
    case 'company':
      return (
        <div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 28, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 80, height: 80, borderRadius: 16, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>
                {company.name ? company.name[0].toUpperCase() : 'C'}
              </div>
              <button style={{ position: 'absolute', bottom: -4, right: -4, width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                <Camera size={12} />
              </button>
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{company.name || 'Your Company'}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Update your company logo and details</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {[['Company Name','name'],['Website','website'],['Industry','industry'],['Company Size','size'],['Email','email'],['Phone','phone']].map(([label, key]) => (
              <Field key={key} label={label} value={company[key]} onChange={e => setCompany(c => ({ ...c, [key]: e.target.value }))} type={key === 'email' ? 'email' : 'text'} />
            ))}
          </div>
          <Field label="Headquarters Address" value={company.address} onChange={e => setCompany(c => ({ ...c, address: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select className="form-control form-select" value={company.timezone} onChange={e => setCompany(c => ({ ...c, timezone: e.target.value }))}>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-control form-select" value={company.currency} onChange={e => setCompany(c => ({ ...c, currency: e.target.value }))}>
                <option value="INR (₹)">INR — Indian Rupee (₹)</option>
                <option value="USD ($)">USD — US Dollar ($)</option>
                <option value="EUR (€)">EUR — Euro (€)</option>
                <option value="GBP (£)">GBP — British Pound (£)</option>
              </select>
              <div className="form-hint">Default: ₹ INR (Indian Rupee)</div>
            </div>
            <div className="form-group">
              <label className="form-label">Fiscal Year Start</label>
              <select className="form-control form-select" value={company.fiscalYear} onChange={e => setCompany(c => ({ ...c, fiscalYear: e.target.value }))}>
                <option value="April">April (Indian FY)</option>
                <option value="January">January</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      );

    /* ── My Profile ──────────────────────────────────────────────────── */
    case 'profile':
      return (
        <div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 28, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Avatar name={user?.name} size="xl" />
              <button style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                <Camera size={12} />
              </button>
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user?.role} — {user?.designation || user?.department}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="First Name" value={profileForm.firstName} onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))} />
            <Field label="Last Name"  value={profileForm.lastName}  onChange={e => setProfileForm(f => ({ ...f, lastName:  e.target.value }))} />
            <Field label="Email"      value={profileForm.email}     onChange={e => setProfileForm(f => ({ ...f, email:     e.target.value }))} type="email" />
            <Field label="Phone"      value={profileForm.phone}     onChange={e => setProfileForm(f => ({ ...f, phone:     e.target.value }))} />
          </div>
          <div className="divider" />
          <h4 style={{ fontWeight: 600, marginBottom: 16 }}>Change Password</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <Field label="Current Password" type="password" value={profileForm.currentPassword} onChange={e => setProfileForm(f => ({ ...f, currentPassword: e.target.value }))} />
            <Field label="New Password"     type="password" value={profileForm.newPassword}     onChange={e => setProfileForm(f => ({ ...f, newPassword:     e.target.value }))} />
            <Field label="Confirm Password" type="password" value={profileForm.confirmPassword}  onChange={e => setProfileForm(f => ({ ...f, confirmPassword: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 10 }}>
            <button className="btn btn-outline" onClick={() => setProfileForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }))}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Save Profile</button>
          </div>
        </div>
      );

    /* ── User Management ─────────────────────────────────────────────── */
    case 'users':
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {registry.length} registered account{registry.length !== 1 ? 's' : ''}
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setInviteOpen(true)}>
              <UserPlus size={14} /> Create Account
            </button>
          </div>

          {registry.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-title">No other accounts</div>
              <div className="empty-state-desc">Create accounts for HR managers, department heads, and employees.</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead><tr><th>User</th><th>Role</th><th>Department</th><th>Status</th></tr></thead>
                <tbody>
                  {registry.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={u.name} size="sm" />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${u.role === 'Admin' ? 'primary' : u.role === 'HR' ? 'purple' : u.role === 'Manager' ? 'info' : 'gray'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>{u.department || '—'}</td>
                      <td><span className="badge badge-success">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Invite / create account modal */}
          <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Create New Account" size="md"
            footer={<>
              <button className="btn btn-outline" onClick={() => setInviteOpen(false)}>Cancel</button>
              <button className="btn btn-primary" form="invite-form" type="submit">Create Account</button>
            </>}
          >
            <form id="invite-form" onSubmit={handleInvite}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input className="form-control" required value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email <span className="required">*</span></label>
                  <input className="form-control" type="email" required value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} placeholder="email@company.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Password <span className="required">*</span></label>
                  <input className="form-control" type="password" required minLength={6} value={inviteForm.password} onChange={e => setInviteForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-control form-select" value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}>
                    {['Admin','HR','Manager','Employee'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-control form-select" value={inviteForm.department} onChange={e => setInviteForm(f => ({ ...f, department: e.target.value }))}>
                    <option value="">Select department</option>
                    {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </form>
          </Modal>
        </div>
      );

    /* ── Roles & Permissions ─────────────────────────────────────────── */
    case 'roles':
      return (
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>Configure what each role can access and modify</p>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Permission</th>
                  {Object.keys(PERMISSIONS).map(r => <th key={r} style={{ textAlign: 'center' }}>{r}</th>)}
                </tr>
              </thead>
              <tbody>
                {['employees','attendance','leave','payroll','performance','reports','departments','settings'].map(perm => (
                  <tr key={perm}>
                    <td style={{ fontWeight: 500, textTransform: 'capitalize' }}>{perm}</td>
                    {Object.entries(PERMISSIONS).map(([role, perms]) => (
                      <td key={role} style={{ textAlign: 'center' }}>
                        <input type="checkbox" defaultChecked={perms[perm]} style={{ accentColor: 'var(--primary)', width: 15, height: 15 }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Save Permissions</button>
          </div>
        </div>
      );

    /* ── Notifications ───────────────────────────────────────────────── */
    case 'notifications':
      return (
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: 4 }}>Email Notifications</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>Choose which events trigger email alerts</p>
          <Toggle label="Leave Request Submitted"  desc="Notify manager when employee applies for leave" defaultChecked={true}  />
          <Toggle label="Leave Approved/Rejected"  desc="Notify employee of leave decision"              defaultChecked={true}  />
          <Toggle label="Payroll Generated"        desc="Notify HR when payroll is ready for review"     defaultChecked={true}  />
          <Toggle label="New Employee Added"       desc="Notify HR team when new employee joins"         defaultChecked={true}  />
          <Toggle label="Performance Review Due"   desc="Remind managers about upcoming reviews"         defaultChecked={false} />
          <Toggle label="Attendance Alerts"        desc="Alert when employee is absent 3+ consecutive days" defaultChecked={true} />
          <div className="divider" />
          <h4 style={{ fontWeight: 600, marginBottom: 4 }}>In-App Notifications</h4>
          <Toggle label="Real-time Leave Notifications" defaultChecked={true}  />
          <Toggle label="Attendance Reminders"          defaultChecked={false} />
          <Toggle label="Payroll Alerts"                defaultChecked={true}  />
          <Toggle label="System Announcements"          defaultChecked={true}  />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Save Preferences</button>
          </div>
        </div>
      );

    /* ── Leave Settings ──────────────────────────────────────────────── */
    case 'leave':
      return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Annual Leave (days/year)"     defaultValue="18" type="number" />
            <Field label="Sick Leave (days/year)"       defaultValue="10" type="number" />
            <Field label="Casual Leave (days/year)"     defaultValue="6"  type="number" />
            <Field label="Maternity Leave (days)"       defaultValue="182" type="number" hint="As per Indian Maternity Benefit Act" />
            <Field label="Paternity Leave (days)"       defaultValue="15" type="number" />
            <Field label="Leave Carry Forward (days)"   defaultValue="5"  type="number" />
          </div>
          <div className="divider" />
          <Toggle label="Allow Half-Day Leave"                               desc="Employees can apply for half-day leave"   defaultChecked={true}  />
          <Toggle label="Allow Leave Carry Forward"                          desc="Unused leave carries to next year"        defaultChecked={true}  />
          <Toggle label="Require Approval for All Leave"                                                                     defaultChecked={true}  />
          <Toggle label="Auto-approve Sick Leave with Medical Certificate"                                                   defaultChecked={false} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Save Settings</button>
          </div>
        </div>
      );

    /* ── Payroll Settings ────────────────────────────────────────────── */
    case 'payroll':
      return (
        <div>
          <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.875rem', color: 'var(--primary)' }}>
            <strong>Default currency: ₹ INR (Indian Rupee)</strong> — all salary, payroll, and payslip calculations use INR.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Payroll Date (day of month)" defaultValue="28"       type="number" hint="Day of month when salaries are disbursed" />
            <Field label="Currency"                    defaultValue="INR (₹)"  hint="Indian Rupee — locked to INR" />
            <Field label="Income Tax (TDS) Rate (%)"   defaultValue="10"       type="number" hint="Default TDS deduction %" />
            <Field label="PF Contribution (%)"         defaultValue="12"       type="number" hint="Employee PF deduction %" />
            <Field label="Health Insurance (%)"        defaultValue="2"        type="number" />
            <Field label="Payroll Cycle"               defaultValue="Monthly"  />
            <Field label="Fiscal Year Start"           defaultValue="April"    hint="Indian fiscal year starts April" />
            <Field label="Professional Tax (₹/month)"  defaultValue="200"      type="number" />
          </div>
          <div className="divider" />
          <Toggle label="Auto-generate Payslips"      desc="Automatically generate payslips on payroll date" defaultChecked={true}  />
          <Toggle label="Email Payslips to Employees" desc="Send payslip via email on payment date"          defaultChecked={true}  />
          <Toggle label="Include Bonus in Regular Payroll"                                                    defaultChecked={false} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Save Settings</button>
          </div>
        </div>
      );

    /* ── Attendance Settings ─────────────────────────────────────────── */
    case 'attendance':
      return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Work Start Time"               defaultValue="09:00" type="time" />
            <Field label="Work End Time"                 defaultValue="18:00" type="time" />
            <Field label="Late Threshold (minutes)"      defaultValue="15"    type="number" hint="Minutes after work start to mark as late" />
            <Field label="Half Day (hours)"              defaultValue="4"     type="number" />
            <Field label="Overtime Threshold (hrs/day)"  defaultValue="8"     type="number" />
            <Field label="Working Days"                  defaultValue="Monday – Friday" />
          </div>
          <div className="divider" />
          <Toggle label="Allow Remote Check-in"          desc="Employees can check in from any location" defaultChecked={true}  />
          <Toggle label="Geofencing for Attendance"      desc="Restrict check-in to office location"     defaultChecked={false} />
          <Toggle label="Auto-mark Absent After Grace Period"                                             defaultChecked={true}  />
          <Toggle label="Send Daily Attendance Summary"                                                   defaultChecked={true}  />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Save Settings</button>
          </div>
        </div>
      );

    /* ── General Settings ────────────────────────────────────────────── */
    case 'general':
      return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Application Name"   defaultValue="EMS Portal"      />
            <Field label="Default Language"   defaultValue="English (India)"  />
            <Field label="Date Format"        defaultValue="DD/MM/YYYY"       />
            <Field label="Time Format"        defaultValue="12-hour (AM/PM)"  />
          </div>
          <div className="divider" />
          <Toggle label="Compact View"                    desc="Reduce padding and spacing throughout the app" defaultChecked={false} />
          <Toggle label="Show Employee Photos"                                                                 defaultChecked={true}  />
          <Toggle label="Enable Two-Factor Authentication"                                                     defaultChecked={false} />
          <Toggle label="Auto Session Timeout (30 min)"                                                       defaultChecked={true}  />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Save Settings</button>
          </div>
        </div>
      );

    default:
      return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Select a settings category</div>;
  }
};

/* ── Settings Page ─────────────────────────────────────────────────────── */
const Settings = ({ initialSection }) => {
  const { user, getRegistry } = useAuth();
  const [activeSection, setActiveSection] = useState(initialSection || 'company');

  const registry = getRegistry ? getRegistry() : [];
  const section  = SETTINGS_SECTIONS.find(s => s.id === activeSection);
  const Icon     = section?.icon;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your application preferences and configurations</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
        {/* Sidebar */}
        <div className="card" style={{ overflow: 'hidden', height: 'fit-content' }}>
          {SETTINGS_SECTIONS.map(s => {
            const SIcon    = s.icon;
            const isActive = activeSection === s.id;
            return (
              <div key={s.id} onClick={() => setActiveSection(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                cursor: 'pointer', borderBottom: '1px solid var(--border)',
                background: isActive ? 'var(--primary-light)' : 'transparent',
                color:      isActive ? 'var(--primary)'       : 'var(--text-secondary)',
                fontWeight: isActive ? 600                    : 400,
                fontSize: '0.875rem', transition: 'all 0.15s',
              }}
                onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'var(--bg)')}
                onMouseLeave={e => !isActive && (e.currentTarget.style.background = '')}
              >
                <SIcon size={16} />
                <span style={{ flex: 1 }}>{s.label}</span>
                {isActive && <ChevronRight size={14} />}
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {Icon && <Icon size={18} color="var(--primary)" />}
              <h3 className="card-title">{section?.label}</h3>
            </div>
          </div>
          <div className="card-body">
            <SectionContent
              section={activeSection}
              user={user}
              registry={registry}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
