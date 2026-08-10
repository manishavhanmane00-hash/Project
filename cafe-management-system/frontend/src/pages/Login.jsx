import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [welcome, setWelcome] = useState(null); // { name, role }

  // Auto-dismiss welcome popup and redirect after 2.5s
  useEffect(() => {
    if (!welcome) return;
    const timer = setTimeout(() => {
      setWelcome(null);
      navigate(welcome.role === 'admin' ? '/admin' : '/dashboard');
    }, 2500);
    return () => clearTimeout(timer);
  }, [welcome, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.data, data.data.token);
      setWelcome({ name: data.data.name, role: data.data.role });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Welcome Popup Overlay */}
      {welcome && (
        <div className="welcome-overlay">
          <div className="welcome-popup">
            <div className="welcome-popup-icon">☕</div>
            <h4 className="welcome-popup-title">Welcome back, {welcome.name}!</h4>
            <p className="welcome-popup-sub">Taking you to your dashboard...</p>
            <div className="welcome-popup-bar">
              <div className="welcome-popup-bar-fill"></div>
            </div>
          </div>
        </div>
      )}

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">☕</div>
          <h2 className="auth-title">Brew &amp; Bite</h2>
          <p className="text-center text-muted mb-4" style={{ fontSize: '0.9rem' }}>
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Email Address</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                <input type="email" name="email" className="form-control" placeholder="you@example.com"
                  value={form.email} onChange={handleChange} required autoComplete="email" />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">Password</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-lock"></i></span>
                <input type="password" name="password" className="form-control" placeholder="Enter your password"
                  value={form.password} onChange={handleChange} required autoComplete="current-password" />
              </div>
            </div>

            <button type="submit" className="btn btn-cafe w-100" disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2" />Signing in...</>
                : <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>}
            </button>
          </form>

          <hr className="my-4" />
          <p className="text-center text-muted" style={{ fontSize: '0.9rem' }}>
            New customer?{' '}
            <Link to="/signup" className="fw-semibold" style={{ color: 'var(--cafe-brown)' }}>
              Create an account
            </Link>
          </p>

          <div className="alert alert-light border mt-3 p-2" style={{ fontSize: '0.78rem' }}>
            <strong>Demo Admin:</strong> admin@cafe.com / Admin@123
          </div>
        </div>
      </div>
    </>
  );
}
