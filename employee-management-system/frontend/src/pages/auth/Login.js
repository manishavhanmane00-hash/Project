import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Shield, Mail, Lock, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm]       = useState({ email: '', password: '', remember: false });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');
  const { login, loading, hasAnyAccount } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please enter your email and password'); return; }
    const res = await login(form.email, form.password, form.remember);
    if (res.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      setError(res.error);
    }
  };

  const noAccounts = !hasAnyAccount();

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div
        className="auth-left"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, color: 'white' }}
      >
        <div style={{ maxWidth: 400, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.2)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Shield size={40} color="white" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>EMS Portal</h1>
          <p style={{ opacity: 0.85, lineHeight: 1.7, fontSize: '1rem' }}>
            Complete Employee Management System — manage your workforce with powerful tools for HR, payroll, attendance, and performance.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 32 }}>
            {['Employee Records', 'Payroll (₹ INR)', 'Attendance Tracking', 'Performance Reviews'].map(f => (
              <div key={f} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 16px', fontSize: '0.875rem', fontWeight: 500 }}>
                ✓ {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(255,255,255,0.05)' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 40, width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ width: 44, height: 44, background: '#4f46e5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={22} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                <span style={{ color: '#4f46e5' }}>EMS</span> Portal
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Employee Management System</div>
            </div>
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Sign in</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 28 }}>
            Enter your credentials to access the system
          </p>

          {/* No-account banner */}
          {noAccounts && (
            <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.875rem', color: '#4338ca' }}>
              <strong>No accounts yet.</strong> Create the first admin account to get started.{' '}
              <Link to="/register" style={{ fontWeight: 600, color: '#4f46e5', textDecoration: 'underline' }}>
                Create account →
              </Link>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 14px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', color: '#ef4444', fontSize: '0.875rem' }}>
              <AlertCircle size={16} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', color: '#0f172a', marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@company.com" required autoComplete="email"
                  style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', background: '#f8fafc', color: '#0f172a' }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', color: '#0f172a', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type={showPass ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} placeholder="Enter your password" required autoComplete="current-password"
                  style={{ width: '100%', padding: '10px 40px 10px 38px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', background: '#f8fafc', color: '#0f172a' }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember + forgot */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: '#0f172a' }}>
                <input type="checkbox" name="remember" checked={form.remember} onChange={handleChange}
                  style={{ accentColor: '#4f46e5', width: 14, height: 14 }} />
                Remember me
              </label>
              <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: '#4f46e5', fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '11px', borderRadius: 10, background: '#4f46e5', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading
                ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Signing in...</>
                : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#4f46e5', fontWeight: 600 }}>
                <UserPlus size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 768px) { .auth-left { display: none !important; } }`}</style>
    </div>
  );
};

export default Login;
