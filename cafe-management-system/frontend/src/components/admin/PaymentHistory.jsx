import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const METHODS = ['', 'Cash', 'UPI', 'GPay', 'PhonePe', 'Bank Transfer', 'Razorpay'];

/**
 * PaymentHistory — Admin view of all transactions with method breakdown
 */
export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ method: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filter.method) params.append('method', filter.method);

      const { data } = await api.get(`/admin/payments?${params}`);
      setPayments(data.data);
      setBreakdown(data.breakdown || []);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalRevenue = breakdown.reduce((sum, b) => sum + b.total, 0);

  return (
    <div>
      <h4 className="fw-bold mb-4" style={{ color: 'var(--cafe-brown-dark)' }}>
        <i className="bi bi-credit-card me-2"></i>Payment History
      </h4>

      {/* Breakdown Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="stat-card" style={{ background: '#e8f5e9' }}>
            <div className="stat-icon">💰</div>
            <div className="stat-value" style={{ color: '#2e7d32' }}>₹{totalRevenue.toLocaleString()}</div>
            <div className="stat-label text-muted">Total Revenue</div>
          </div>
        </div>
        {breakdown.map((b) => (
          <div key={b._id} className="col-6 col-md-4 col-lg-2">
            <div className="stat-card" style={{ background: '#fff8e1' }}>
              <div className="stat-value" style={{ color: '#f57f17', fontSize: '1.3rem' }}>₹{b.total.toLocaleString()}</div>
              <div className="stat-label">{b._id}</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{b.count} txn(s)</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="card-cafe p-3 mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-sm-4">
            <label className="form-label fw-semibold small">Filter by Method</label>
            <select
              className="form-select form-select-sm"
              value={filter.method}
              onChange={(e) => { setFilter({ method: e.target.value }); setPage(1); }}
            >
              {METHODS.map((m) => <option key={m} value={m}>{m || 'All Methods'}</option>)}
            </select>
          </div>
          <div className="col-sm-4">
            <button className="btn btn-sm btn-cafe-outline" onClick={() => { setFilter({ method: '' }); setPage(1); }}>
              <i className="bi bi-x-circle me-1"></i>Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-cafe p-3">
        {loading ? (
          <div className="text-center py-4"><div className="spinner-border spinner-cafe" role="status" /></div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover table-cafe mb-0">
                <thead>
                  <tr>
                    <th>Receipt No.</th>
                    <th>Customer</th>
                    <th>Order ID</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-muted py-4">No payments found</td></tr>
                  ) : payments.map((p) => (
                    <tr key={p._id}>
                      <td className="font-monospace" style={{ fontSize: '0.78rem' }}>{p.receiptNumber || '-'}</td>
                      <td>
                        <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{p.user?.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{p.user?.email}</div>
                      </td>
                      <td className="font-monospace text-muted" style={{ fontSize: '0.75rem' }}>
                        #{p.order?._id?.slice(-6).toUpperCase()}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{p.method}</span>
                      </td>
                      <td className="fw-bold" style={{ color: 'var(--cafe-brown)' }}>₹{p.amount}</td>
                      <td>
                        <span className={`badge ${p.status === 'Completed' ? 'bg-success' : p.status === 'Failed' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.78rem' }}>
                        {new Date(p.createdAt).toLocaleString()}
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
