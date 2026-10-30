import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Route-level permission guard. Wrap a page element with the module key that
 * gates it. If the current user's role lacks access, an "access blocked" panel
 * is shown instead of the page content (and the underlying data is never fetched
 * because the page component is not rendered).
 *
 * Admin always passes. Enforcement is also applied on the backend APIs, so this
 * is defence-in-depth, not the only line of defence.
 */
const AccessDenied = () => (
  <div style={{ padding: 48, textAlign: 'center' }}>
    <div style={{
      maxWidth: 440, margin: '0 auto', background: 'var(--surface)',
      border: '1px solid var(--border)', borderRadius: 12, padding: 32,
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔒</div>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 8 }}>Access Restricted</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
        You don’t have permission to view this module. If you believe this is a
        mistake, contact your administrator.
      </p>
    </div>
  </div>
);

const ProtectedModule = ({ moduleKey, children }) => {
  const { canAccess } = useAuth();
  if (!canAccess(moduleKey)) return <AccessDenied />;
  return children;
};

export default ProtectedModule;
