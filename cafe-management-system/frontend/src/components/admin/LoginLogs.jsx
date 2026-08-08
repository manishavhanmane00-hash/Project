import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

/**
 * LoginLogs — Admin view of user login activity with active/inactive status
 */
export default function LoginLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/login-logs?page=${p}&limit=20`);
      setLogs(data.data);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error('Failed to load login logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
    const interval = setInterval(() => fetchLogs(page), 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, [page]);

  return (
    <div>
      <h4 className="fw-bold mb-4" style={{ color: 'var(--cafe-brown-dark)' }}>
        <i className="bi bi-activity me-2"></i>Login Activity
        <span className="badge bg-secondary ms-2">{total}</span>
      </h4>

      <div className="card-cafe p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="text-muted small mb-0">
            <i className="bi bi-info-circle me-1"></i>
            Active status = last seen within 30 minutes. Auto-refreshes every 60s.
          </p>
          <button className="btn btn-sm btn-cafe-outline" onClick={() => fetchLogs(page)}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4"><div className="spinner-border spinner-cafe" role="status" /></div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover table-cafe mb-0">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Login Time</th>
                    <th>Last Activity</th>
                    <th>Logout Time</th>
                    <th>IP Address</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-muted py-4">No login records found</td></tr>
                  ) : logs.map((log) => (
                    <tr key={log._id}>
                      <td>
                        <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{log.userName}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{log.userEmail}</div>
                      </td>
                      <td>
                        <span className={`badge ${log.userRole === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                          {log.userRole}
                        </span>
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.82rem' }}>
                        {new Date(log.loginAt).toLocaleString()}
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.82rem' }}>
                        {log.lastActivity ? new Date(log.lastActivity).toLocaleString() : '-'}
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.82rem' }}>
                        {log.logoutAt ? new Date(log.logoutAt).toLocaleString() : '-'}
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.78rem' }}>
                        {log.ipAddress}
                      </td>
                      <td>
                        {log.isActive ? (
                          <span className="badge bg-success d-flex align-items-center gap-1" style={{ width: 'fit-content' }}>
                            <span className="rounded-circle bg-white" style={{ width: 6, height: 6, display: 'inline-block' }}></span>
                            Active
                          </span>
                        ) : (
                          <span className="badge bg-secondary">Inactive</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <span className="text-muted small">Page {page} of {pages} ({total} total)</span>
                <div className="btn-group btn-group-sm">
                  <button className="btn btn-cafe-outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                  <button className="btn btn-cafe-outline" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
