import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    toast.success('Password reset successfully!');
    navigate('/login');
  };

  return (
    <div className="auth-page" style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40, width: '100%', maxWidth: 420, boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, background: '#4f46e5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={22} color="white" />
          </div>
          <div><div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}><span style={{ color: '#4f46e5' }}>Acme</span>Corp EMS</div></div>
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Reset password</h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 28 }}>Enter your new password below.</p>

        <form onSubmit={handleSubmit}>
          {[
            { label: 'New Password', name: 'password', placeholder: 'Minimum 6 characters' },
            { label: 'Confirm Password', name: 'confirm', placeholder: 'Re-enter your password' },
          ].map(field => (
            <div key={field.name} style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', color: '#0f172a', marginBottom: 6 }}>{field.label}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form[field.name]}
                  onChange={e => setForm(f => ({ ...f, [field.name]: e.target.value }))}
                  placeholder={field.placeholder} required
                  style={{ width: '100%', padding: '10px 40px 10px 38px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', background: '#f8fafc' }}
                />
                {field.name === 'password' && (
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '11px', borderRadius: 10, background: '#4f46e5', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1, marginTop: 8 }}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#4f46e5', fontSize: '0.875rem', fontWeight: 500 }}>
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
