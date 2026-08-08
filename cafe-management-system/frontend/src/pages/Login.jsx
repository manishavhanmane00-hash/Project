import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Login Page — shared by both customers and admin
 * Backend determines role from credentials and returns JWT with role
 */
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.data, data.data.token);
      toast.success(data.message || 'Welcome back!');
      // Redirect based on role
      navigate(data.data.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock"></i></span>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-cafe w-100"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" />Signing in...</>
            ) : (
              <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>
            )}
          </button>
        </form>

        <hr className="my-4" />
        <p className="text-center text-muted" style={{ fontSize: '0.9rem' }}>
          New customer?{' '}
          <Link to="/signup" className="fw-semibold" style={{ color: 'var(--cafe-brown)' }}>
            Create an account
          </Link>
        </p>

        {/* Demo credentials hint */}
        <div className="alert alert-light border mt-3 p-2" style={{ fontSize: '0.78rem' }}>
          <strong>Demo Admin:</strong> admin@cafe.com / Admin@123
        </div>
      </div>
    </div>
  );
}
