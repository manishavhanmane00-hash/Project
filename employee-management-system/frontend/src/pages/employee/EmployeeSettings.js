import React, { useState } from 'react';
import { Save, User, Bell, Shield, LogOut, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/shared/Avatar';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  { id: 'account',      label: 'My Account',   icon: User    },
  { id: 'notifications',label: 'Notifications', icon: Bell    },
  { id: 'security',     label: 'Security',      icon: Shield  },
];

const Toggle = ({ label, desc, checked, onChange }) => {
  const [val, setVal] = useState(checked);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer', flexShrink: 0 }}>
        <input type="checkbox" checked={val} onChange={e => { setVal(e.target.checked); onChange && onChange(e.target.checked); }} style={{ opacity: 0, width: 0, height: 0 }} />
        <span style={{ position: 'absolute', inset: 0, borderRadius: 12, background: val ? 'var(--primary)' : 'var(--border)', transition: 'background 0.2s' }}>
          <span style={{ position: 'absolute', left: val ? 22 : 2, top: 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </span>
      </label>
    </div>
  );
};

const EmployeeSettings = () => {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState('account');

  // Account form
  const [profile, setProfile] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName:  user?.name?.split(' ').slice(1).join(' ') || '',
    email:     user?.email || '',
    phone:     user?.phone || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [pwd, setPwd] = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });
  const [savingPwd, setSavingPwd] = useState(false);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const result = await updateProfile({
      name: `${profile.firstName} ${profile.lastName}`.trim(),
      phone: profile.phone,
    });
    setSavingProfile(false);
    if (result?.success !== false) {
      toast.success('Profile updated successfully');
    } else {
      toast.error(result?.error || 'Failed to update profile. Please try again.');
    }
  };

  const handleChangePwd = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwd.current) errs.current = 'Enter current password';
    if (!pwd.newPwd || pwd.newPwd.length < 6) errs.newPwd = 'New password must be at least 6 characters';
    if (pwd.newPwd !== pwd.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length > 0) { setPwdErrors(errs); return; }

    setSavingPwd(true);
    const res = await changePassword(pwd.current, pwd.newPwd);
    setSavingPwd(false);
    if (!res.success) {
      setPwdErrors({ current: res.error || 'Password change failed' });
      return;
    }
    toast.success('Password changed successfully');
    setPwd({ current: '', newPwd: '', confirm: '' });
    setPwdErrors({});
  };

  const renderAccount = () => (
    <div>
      <div style={{ display: 'flex', gap: 20, marginBottom: 28, alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Avatar name={user?.name} size="xl" />
        </div>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.name}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user?.role} — {user?.designation || user?.department}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        {[['First Name', 'firstName', 'text'], ['Last Name', 'lastName', 'text'], ['Email', 'email', 'email', true], ['Phone', 'phone', 'text']].map(([label, key, type, disabled]) => (
          <div key={key} className="form-group">
            <label className="form-label">{label}</label>
            <input
              type={type}
              className="form-control"
              value={profile[key]}
              disabled={disabled}
              onChange={e => setProfile(f => ({ ...f, [key]: e.target.value }))}
              style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            />
            {disabled && <div className="form-hint">Email cannot be changed. Contact Admin.</div>}
          </div>
        ))}
      </div>

      {/* No theme preference section */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button className="btn btn-primary" onClick={handleSaveProfile} disabled={savingProfile}>
          <Save size={14} /> {savingProfile ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div>
      <h4 style={{ fontWeight: 600, marginBottom: 4 }}>Email Notifications</h4>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>Choose what email alerts you receive</p>
      <Toggle label="Leave Approved/Rejected"    desc="Get notified when your leave request is decided"   checked={true}  />
      <Toggle label="Payslip Available"          desc="Get notified when your payslip is generated"       checked={true}  />
      <Toggle label="Attendance Alerts"          desc="Get reminders to mark your attendance"             checked={false} />
      <Toggle label="Performance Review"         desc="Get notified when a review is completed"           checked={true}  />
      <Toggle label="Company Announcements"      desc="Receive company-wide announcements"                checked={true}  />

      <div className="divider" />
      <h4 style={{ fontWeight: 600, marginBottom: 4 }}>In-App Notifications</h4>
      <Toggle label="Leave Status Updates"                                                                 checked={true}  />
      <Toggle label="Payroll Notifications"                                                                checked={true}  />
      <Toggle label="Attendance Reminders"                                                                 checked={false} />
      <Toggle label="System Announcements"                                                                 checked={true}  />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button className="btn btn-primary" onClick={() => toast.success('Notification preferences saved')}>
          <Save size={14} /> Save Preferences
        </button>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div>
      <h4 style={{ fontWeight: 600, marginBottom: 16 }}>Change Password</h4>
      <form onSubmit={handleChangePwd}>
        <div style={{ maxWidth: 400 }}>
          {[
            ['Current Password', 'current'],
            ['New Password',     'newPwd'],
            ['Confirm Password', 'confirm'],
          ].map(([label, key]) => (
            <div key={key} className="form-group">
              <label className="form-label">{label} <span className="required">*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd[key] ? 'text' : 'password'}
                  className={`form-control ${pwdErrors[key] ? 'error' : ''}`}
                  value={pwd[key]}
                  onChange={e => { setPwd(f => ({ ...f, [key]: e.target.value })); setPwdErrors(f => ({ ...f, [key]: '' })); }}
                  placeholder={label}
                />
                <button
                  type="button"
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setShowPwd(f => ({ ...f, [key]: !f[key] }))}
                >
                  {showPwd[key] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {pwdErrors[key] && <div className="form-error">{pwdErrors[key]}</div>}
            </div>
          ))}
          <div className="form-hint" style={{ marginBottom: 16 }}>Password must be at least 6 characters</div>
          <button type="submit" className="btn btn-primary" disabled={savingPwd}>
            <Shield size={14} /> {savingPwd ? 'Changing…' : 'Change Password'}
          </button>
        </div>
      </form>

      <div className="divider" />
      <h4 style={{ fontWeight: 600, marginBottom: 16, color: 'var(--danger)' }}>Danger Zone</h4>
      <div style={{ border: '1px solid var(--danger)', borderRadius: 10, padding: 20 }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>Sign Out</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          Sign out from your current session
        </div>
        <button
          className="btn"
          style={{ background: 'var(--danger)', color: 'white' }}
          onClick={() => { logout(); navigate('/login'); }}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );

  const activeSection = SECTIONS.find(s => s.id === section);
  const SectionIcon = activeSection?.icon;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
        {/* Sidebar */}
        <div className="card" style={{ overflow: 'hidden', height: 'fit-content' }}>
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const isActive = section === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setSection(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                  cursor: 'pointer', borderBottom: '1px solid var(--border)',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400, fontSize: '0.875rem', transition: 'all 0.15s',
                }}
              >
                <Icon size={16} />
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {SectionIcon && <SectionIcon size={18} color="var(--primary)" />}
              <h3 className="card-title">{activeSection?.label}</h3>
            </div>
          </div>
          <div className="card-body">
            {section === 'account'       && renderAccount()}
            {section === 'notifications' && renderNotifications()}
            {section === 'security'      && renderSecurity()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSettings;
