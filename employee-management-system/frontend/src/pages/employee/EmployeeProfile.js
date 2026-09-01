import React, { useState } from 'react';
import {
  Briefcase, Mail, Phone,
  Building2, FileText, Download, Edit2, Save, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/shared/Avatar';
import Badge from '../../components/shared/Badge';
import toast from 'react-hot-toast';

const TABS = ['Personal Info', 'Employment', 'Documents'];

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
    <span style={{ width: 180, flexShrink: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{value || '—'}</span>
  </div>
);

const EmployeeProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    phone:   user?.phone   || '',
    address: user?.address || '',
    city:    user?.city    || '',
    state:   user?.state   || '',
    country: user?.country || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    if (updateProfile) updateProfile(form);
    toast.success('Profile updated');
    setSaving(false);
    setEditing(false);
  };

  const documents = [
    { name: 'Resume / CV',            type: 'PDF',  date: 'Aug 2026' },
    { name: 'ID Proof',               type: 'Image',date: 'Aug 2026' },
    { name: 'Address Proof',          type: 'PDF',  date: 'Aug 2026' },
    { name: 'Education Certificate',  type: 'PDF',  date: 'Aug 2026' },
    { name: 'Offer Letter',           type: 'PDF',  date: 'Aug 2026' },
  ];

  const tabs = {
    'Personal Info': (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          {!editing ? (
            <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
              <Edit2 size={14} /> Edit Editable Fields
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>
                <X size={14} /> Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 16 }}>Personal Details</h4>
            <InfoRow label="Full Name"   value={user?.name} />
            <InfoRow label="Email"       value={user?.email} />
            {editing ? (
              <div style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 180, flexShrink: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Phone</span>
                <input className="form-control" style={{ flex: 1 }} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Phone number" />
              </div>
            ) : (
              <InfoRow label="Phone" value={user?.phone || form.phone} />
            )}
            <InfoRow label="Employee ID" value={`EMP-${String(user?.id || '').slice(-4).padStart(3, '0')}`} />
            <InfoRow label="Role"        value={user?.role} />
          </div>
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: 16 }}>Address</h4>
            {editing ? (
              <>
                {[['address','Street Address'],['city','City'],['state','State'],['country','Country']].map(([key, label]) => (
                  <div key={key} style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 180, flexShrink: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
                    <input className="form-control" style={{ flex: 1 }} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={label} />
                  </div>
                ))}
              </>
            ) : (
              <>
                <InfoRow label="Street Address" value={user?.address || form.address} />
                <InfoRow label="City"           value={user?.city    || form.city}    />
                <InfoRow label="State"          value={user?.state   || form.state}   />
                <InfoRow label="Country"        value={user?.country || form.country} />
              </>
            )}
          </div>
        </div>
      </div>
    ),
    'Employment': (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: 16 }}>Employment Details</h4>
          <InfoRow label="Employee ID"       value={`EMP-${String(user?.id || '').slice(-4).padStart(3, '0')}`} />
          <InfoRow label="Department"        value={user?.department}     />
          <InfoRow label="Designation"       value={user?.designation}    />
          <InfoRow label="Employment Type"   value="Full-time"            />
          <InfoRow label="Employment Status" value={<Badge status="active" />} />
        </div>
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: 16 }}>Org Info</h4>
          <InfoRow label="Work Location"     value="Head Office"          />
          <InfoRow label="Reporting Manager" value="—"                    />
          <InfoRow label="Joined"            value="—"                    />
          <InfoRow label="Probation"         value="Completed"            />
        </div>
      </div>
    ),
    'Documents': (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {documents.map(doc => (
            <div key={doc.name} className="file-item">
              <div style={{ width: 36, height: 36, background: 'var(--primary-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={14} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{doc.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{doc.type} · Uploaded {doc.date}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-outline btn-sm" onClick={() => toast.success('Opening document…')}>View</button>
                <button className="btn btn-outline btn-sm" onClick={() => toast.success('Downloading…')}>
                  <Download size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--info-light)', borderRadius: 10, padding: 14, marginTop: 16, fontSize: '0.8rem', color: 'var(--info)' }}>
          Contact HR to upload or update your documents.
        </div>
      </div>
    ),
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">View and manage your personal information</p>
      </div>

      {/* Profile Header Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{
          padding: '32px 32px 24px',
          background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--surface) 100%)',
          borderRadius: '14px 14px 0 0',
        }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ position: 'relative' }}>
              <Avatar name={user?.name} size="2xl" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>{user?.name}</h2>
              <div style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>{user?.designation || 'Employee'}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge status="active" />
                <span className="badge badge-primary">{user?.role}</span>
              </div>
              <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
                {[
                  { icon: Briefcase, text: `EMP-${String(user?.id || '').slice(-4).padStart(3,'0')}` },
                  { icon: Building2, text: user?.department  || 'Department' },
                  { icon: Mail,      text: user?.email       || '' },
                  { icon: Phone,     text: user?.phone       || form.phone || 'Phone' },
                ].filter(i => i.text).map(({ icon: Icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <Icon size={13} /> {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ padding: '0 24px' }}>
          {TABS.map((t, i) => (
            <div key={t} className={`tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>
          ))}
        </div>
        <div className="card-body">
          {tabs[TABS[activeTab]]}
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfilePage;
