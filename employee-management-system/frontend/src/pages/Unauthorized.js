import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleRedirect = () => {
    if (!user) { navigate('/login'); return; }
    if (user.role === 'Employee') navigate('/employee/dashboard');
    else navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 40 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: 'var(--danger-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <ShieldOff size={36} color="var(--danger)" />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>
          Access Denied
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: 32, lineHeight: 1.6 }}>
          You don't have permission to access this page.
          {user && user.role === 'Employee' && ' This area is restricted to administrators.'}
        </p>
        <button className="btn btn-primary" onClick={handleRedirect}>
          {user?.role === 'Employee' ? '← Back to My Dashboard' : '← Back to Dashboard'}
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
