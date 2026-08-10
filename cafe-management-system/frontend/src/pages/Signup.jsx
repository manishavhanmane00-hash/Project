import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      await api.post('/auth/signup', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      toast.success('🎉 Account created! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">☕</div>
        <h2 className="auth-title">Join Us!</h2>
        <p className="text-center text-muted mb-4" style={{ fontSize: '0.9rem' }}>
          Create your Brew &amp; Bite account
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Full Name</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-person"></i></span>
              <input type="text" name="name" className="form-control" placeholder="John Doe"
                value={form.name} onChange={handleChange} required />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Email Address</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-envelope"></i></span>
              <input type="email" name="email" className="form-control" placeholder="you@example.com"
                value={form.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Phone Number</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-telephone"></i></span>
              <input type="tel" name="phone" className="form-control" placeholder="+91 98765 43210"
                value={form.phone} onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock"></i></span>
              <input type="password" name="password" className="form-control" placeholder="Min 6 characters"
                value={form.password} onChange={handleChange} required minLength={6} />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Confirm Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock-fill"></i></span>
              <input type="password" name="confirmPassword" className="form-control" placeholder="Repeat your password"
                value={form.confirmPassword} onChange={handleChange} required />
            </div>
          </div>

          <button type="submit" className="btn btn-cafe w-100" disabled={loading}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" />Creating account...</>
              : <><i className="bi bi-person-plus me-2"></i>Create Account</>}
          </button>
        </form>

        <hr className="my-4" />
        <p className="text-center text-muted" style={{ fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" className="fw-semibold" style={{ color: 'var(--cafe-brown)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
