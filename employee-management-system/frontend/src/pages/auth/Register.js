import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, User, Mail, Lock, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const { register, loading, hasAnyAccount } = useAuth();
  const navigate = useNavigate();
  const isFirstUser = !hasAnyAccount();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'Admin', designation: '', department: '' });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())       errs.name     = 'Full name is required';
    if (!form.email.trim())      errs.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.password)          errs.password = 'Password is required';
    else if (form.password.length < 6)         errs.password = 'Minimum 6 characters';
    if (form.password !== form.confirm)        errs.confirm  = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const res = await register({
      name:        form.name.trim(),
      email:       form.email.trim().toLowerCase(),
      password:    form.password,
      role:        isFirstUser ? 'Admin' : form.role,
      designation: form.designation,
      department:  form.department,
    });

    if (res.success) {
      toast.success(res.isFirstUser ? 'Admin account created! Welcome.' : 'Account created successfully.');
      navigate('/dashboard');
    } else {
      setErrors({ email: res.error });
    }
  };

  const inputStyle = (err) => ({
    width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10,
    border: `1.5px solid ${err ? '#ef4444' : '#e2e8f0'}`,
    fontSize: '0.875rem', outline: 'none', background: '#f8fafc', color: '#0f172a'
  });

  const ROLES = ['Admin', 'HR', 'Manager', 'Employee'];
  const DEPTS = ['Engineering', 'Human Resources', 'Marketing', 'Sales', 'Finance', 'Operations', 'Design', 'Legal'];

  return (
    <div className="auth-page" style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40, width: '100%', maxWidth: 500, boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, background: '#4f46e5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={22} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}><span style={{ color: '#4f46e5' }}>EMS</span> Portal</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Employee Management System</div>
          </div>
        </div>

        {isFirstUser && (
          <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.875rem', color: '#4338ca', display: 'flex', gap: 10 }}>
            <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>You're creating the <strong>first account</strong>. It will automatically be assigned the <strong>Admin</strong> role with full system access.</span>
          </div>
        )}

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          {isFirstUser ? 'Set up your admin account' : 'Create new account'}
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 24 }}>
          {isFirstUser ? 'This will be the primary administrator account.' : 'Fill in the details to register a new user.'}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Full name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', color: '#0f172a', marginBottom: 6 }}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" style={inputStyle(errors.name)} />
            </div>
            {errors.name && <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>{errors.name}</div>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', color: '#0f172a', marginBottom: 6 }}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" autoComplete="email" style={inputStyle(errors.email)} />
            </div>
            {errors.email && <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>{errors.email}</div>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', color: '#0f172a', marginBottom: 6 }}>Password <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Minimum 6 characters" style={inputStyle(errors.password)} />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>{errors.password}</div>}
          </div>

          {/* Confirm password */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', color: '#0f172a', marginBottom: 6 }}>Confirm Password <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type={showPass ? 'text' : 'password'} value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="Re-enter your password" style={inputStyle(errors.confirm)} />
            </div>
            {errors.confirm && <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>{errors.confirm}</div>}
          </div>

          {/* Role (only for non-first-user admins) */}
          {!isFirstUser && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', color: '#0f172a', marginBottom: 6 }}>Role</label>
                <select value={form.role} onChange={e => set('role', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', background: '#f8fafc', color: '#0f172a', appearance: 'none' }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', color: '#0f172a', marginBottom: 6 }}>Department</label>
                <select value={form.department} onChange={e => set('department', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', background: '#f8fafc', color: '#0f172a', appearance: 'none' }}>
                  <option value="">Select dept.</option>
                  {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', marginTop: 8, padding: '11px', borderRadius: 10, background: '#4f46e5', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1 }}>
            {loading ? 'Creating account…' : isFirstUser ? 'Create Admin Account' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#4f46e5', fontSize: '0.875rem', fontWeight: 500 }}>
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
