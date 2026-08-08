import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const STATUSES = ['', 'Placed', 'Preparing', 'Ready', 'Out for Delivery', 'Completed', 'Cancelled'];

const STATUS_NEXT = {
  Placed: 'Preparing',
  Preparing: 'Ready',
  Ready: 'Out for Delivery',
  'Out for Delivery': 'Completed',
};

/**
 * OrdersTable — Admin view of all orders with status filters and update actions
 */
export default function OrdersTable() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', date: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (filters.status) params.append('status', filters.status);
      if (filters.date) params.append('date', filters.date);

      const { data } = await api.get(`/admin/orders?${params}`);
      setOrders(data.data);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success(`Updated → ${status}`);
      fetchOrders();
    } catch {
      toast.error('Status update failed');
    }
  };

  return (
    <div>
      <h4 className="fw-bold mb-4" style={{ color: 'var(--cafe-brown-dark)' }}>
        <i className="bi bi-bag-check me-2"></i>All Orders
        <span className="badge bg-secondary ms-2">{total}</span>
      </h4>

      {/* Filters */}
      <div className="card-cafe p-3 mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-sm-4">
            <label className="form-label fw-semibold small">Filter by Status</label>
            <select
              className="form-select form-select-sm"
              value={filters.status}
              onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
            </select>
          </div>
          <div className="col-sm-4">
            <label className="form-label fw-semibold small">Filter by Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={filters.date}
              onChange={(e) => { setFilters({ ...filters, date: e.target.value }); setPage(1); }}
            />
          </div>
          <div className="col-sm-4">
            <button
              className="btn btn-sm btn-cafe-outline"
              onClick={() => { setFilters({ status: '', date: '' }); setPage(1); }}
            >
              <i className="bi bi-x-circle me-1"></i>Clear Filters
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
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={8} className="text-center text-muted py-4">No orders found</td></tr>
                  ) : orders.map((order) => (
                    <tr key={order._id}>
                      <td className="font-monospace text-muted" style={{ fontSize: '0.78rem' }}>
                        #{order._id.slice(-8).toUpperCase()}
                      </td>
                      <td>
                        <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{order.user?.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{order.user?.email}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', maxWidth: 160 }}>
                          {order.items.slice(0, 2).map((i, idx) => (
                            <div key={idx}>{i.name} ×{i.quantity}</div>
                          ))}
                          {order.items.length > 2 && <div className="text-muted">+{order.items.length - 2} more</div>}
                        </div>
                      </td>
                      <td className="fw-bold" style={{ color: 'var(--cafe-brown)' }}>₹{order.totalAmount}</td>
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>{order.paymentMethod}</div>
                        <span className={`badge ${order.paymentStatus === 'Paid' ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: '0.7rem' }}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                      <td className="text-muted" style={{ fontSize: '0.78rem' }}>
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td>
                        {STATUS_NEXT[order.status] && (
                          <button
                            className="btn btn-sm btn-cafe me-1 mb-1"
                            onClick={() => updateStatus(order._id, STATUS_NEXT[order.status])}
                            style={{ fontSize: '0.72rem' }}
                          >
                            → {STATUS_NEXT[order.status]}
                          </button>
                        )}
                        {!['Completed', 'Cancelled'].includes(order.status) && (
                          <button
                            className="btn btn-sm btn-outline-danger mb-1"
                            onClick={() => updateStatus(order._id, 'Cancelled')}
                            style={{ fontSize: '0.72rem' }}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <span className="text-muted small">
                  Page {page} of {pages} ({total} total)
                </span>
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
