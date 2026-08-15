import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-card text-center">
        <div className="auth-logo">☕</div>
        <h2 className="auth-title">Brew &amp; Bite</h2>
        <p className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>
          Your favourite cafe, now online.<br />Order fresh, track live, enjoy more.
        </p>
        <button className="btn btn-cafe w-100 mb-3" onClick={() => navigate('/login')}>
          <i className="bi bi-box-arrow-in-right me-2"></i>Login
        </button>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
          New here?{' '}
          <span
            role="button"
            className="fw-semibold"
            style={{ color: 'var(--cafe-brown)', cursor: 'pointer' }}
            onClick={() => navigate('/signup')}
          >
            Create an account
          </span>
        </p>
      </div>
    </div>
  );
}
