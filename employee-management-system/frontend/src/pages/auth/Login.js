import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Shield, Mail, Lock, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const Login = () => {
  const [form, setForm]         = useState({ email: '', password: '', remember: false });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);
  const { login, loginWithGoogle, loading, hasAnyAccount } = useAuth();
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
      // Route based on role: Employee → employee portal, everyone else → admin dashboard
      if (res.role === 'Employee') {
        navigate('/employee/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.error);
    }
  };

  // ── Google Sign-In ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_client_id_here') return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    };

    // Script may already be loaded or still loading
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const script = document.getElementById('google-gsi-script');
      if (script) script.addEventListener('load', initGoogle);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoogleCallback = async (credentialResponse) => {
    setGoogleLoading(true);
    setError('');
    const res = await loginWithGoogle(credentialResponse);
    setGoogleLoading(false);
    if (res.success) {
      toast.success(res.isNew ? 'Account created via Google!' : 'Welcome back!');
      navigate(res.role === 'Employee' ? '/employee/dashboard' : '/dashboard');
    } else {
      setError(res.error || 'Google sign-in failed. Please try again.');
    }
  };

  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_client_id_here') {
      setError('Google sign-in is not configured. Set REACT_APP_GOOGLE_CLIENT_ID in frontend/.env');
      return;
    }
    if (!window.google?.accounts?.id) {
      setError('Google sign-in is not available. Please refresh and try again.');
      return;
    }
    setError('');
    setGoogleLoading(true);
    window.google.accounts.id.prompt((notification) => {
      // prompt() is async — loading state is cleared in the callback or on dismissal
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // One Tap was suppressed — fall back to the rendered button flow
        setGoogleLoading(false);
        if (googleBtnRef.current) {
          const btn = googleBtnRef.current.querySelector('[role="button"], div[tabindex]');
          if (btn) btn.click();
        }
      }
    });
  };

  const noAccounts = !hasAnyAccount();
  const isGoogleConfigured = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your_google_client_id_here';

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

          {/* ── Continue with Google ── */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={loading || googleLoading}
            className="google-btn"
          >
            {googleLoading ? (
              <>
                <div className="google-btn-spinner" />
                Connecting to Google...
              </>
            ) : (
              <>
                {/* Official Google "G" SVG */}
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Hidden Google-rendered button (used as fallback for One Tap suppression) */}
          {isGoogleConfigured && (
            <div ref={googleBtnRef} style={{ display: 'none' }}>
              <div
                className="g_id_signin"
                data-type="standard"
                data-size="large"
                data-theme="outline"
                data-text="continue_with"
                data-shape="rectangular"
                data-logo_alignment="left"
              />
            </div>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>or sign in with email</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

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

      <style>{`
        @media (max-width: 768px) { .auth-left { display: none !important; } }
        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 11px 16px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          color: #0f172a;
          font-size: 0.9rem;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          letter-spacing: -0.01em;
        }
        .google-btn:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transform: translateY(-1px);
        }
        .google-btn:focus-visible {
          outline: 2px solid #4f46e5;
          outline-offset: 2px;
        }
        .google-btn:active:not(:disabled) { transform: scale(0.98); }
        .google-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .google-btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e2e8f0;
          border-top-color: #4285F4;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};

export default Login;
