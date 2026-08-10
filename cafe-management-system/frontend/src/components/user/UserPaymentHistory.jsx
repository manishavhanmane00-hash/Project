import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const STATUS_BADGE = {
  Completed: 'bg-success',
  Pending: 'bg-warning text-dark',
  Failed: 'bg-danger',
  Refunded: 'bg-info text-dark',
};

const METHOD_ICON = {
  Cash: '💵', UPI: '📱', GPay: '🅖', PhonePe: '📲',
  'Bank Transfer': '🏦', Razorpay: '💳',
};

export default function UserPaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | Completed | Pending | Failed

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const { data } = await api.get('/payments/my');
        setPayments(data.data);
      } catch {
        toast.error('Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const filtered = filter === 'all' ? payments : payments.filter((p) => p.status === filter);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border spinner-cafe" role="status" />
        <p className="mt-3 text-muted">Loading payment history...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h5 className="fw-bold mb-0" style={{ color: 'var(--cafe-brown-dark)' }}>
          <i className="bi bi-credit-card me-2"></i>Payment History
        </h5>
        {/* Filter tabs */}
        <div className="btn-group btn-group-sm">
          {['all', 'Completed', 'Pending', 'Failed'].map((f) => (
            <button key={f} className={`btn ${filter === f ? 'btn-cafe' : 'btn-outline-secondary'}`}
              onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💳</div>
          <h4 className="fw-bold">No payments found</h4>
          <p className="text-muted">Your payment transactions will appear here.</p>
          <Link to="/dashboard/menu" className="btn btn-cafe mt-3">
            <i className="bi bi-grid me-2"></i>Browse Menu
          </Link>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map((payment) => (
            <div key={payment._id} className="card-cafe p-4">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                  {/* Payment ID */}
                  <div className="fw-bold" style={{ fontSize: '0.9rem' }}>
                    <span className="text-muted">Payment</span>{' '}
                    <span className="font-monospace">#{payment._id.slice(-8).toUpperCase()}</span>
                  </div>
                  {/* Receipt number */}
                  {payment.receiptNumber && (
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                      Receipt: <span className="font-monospace">{payment.receiptNumber}</span>
                    </div>
                  )}
                  {/* Linked order */}
                  {payment.order && (
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                      Order:{' '}
                      <span className="font-monospace">
                        #{(payment.order._id || payment.order).toString().slice(-8).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Date */}
                  <div className="text-muted small mt-1">
                    <i className="bi bi-calendar3 me-1"></i>
                    {new Date(payment.createdAt).toLocaleString()}
                  </div>
                  {/* Method */}
                  <div className="mt-1" style={{ fontSize: '0.85rem' }}>
                    <span className="me-1">{METHOD_ICON[payment.method] || '💰'}</span>
                    <span className="fw-semibold">{payment.method}</span>
                  </div>
                  {/* Razorpay payment ID if available */}
                  {payment.razorpayPaymentId && (
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Txn: <span className="font-monospace">{payment.razorpayPaymentId}</span>
                    </div>
                  )}
                </div>

                <div className="text-end">
                  <div className="fw-bold" style={{ color: 'var(--cafe-brown)', fontSize: '1.2rem' }}>
                    ₹{payment.amount}
                  </div>
                  <span className={`badge ${STATUS_BADGE[payment.status] || 'bg-secondary'} mt-1`}>
                    {payment.status}
                  </span>
                  {/* Receipt link */}
                  {payment.status === 'Completed' && payment.order && (
                    <div className="mt-2">
                      <Link
                        to={`/dashboard/orders/receipt/${payment.order._id || payment.order}`}
                        className="btn btn-sm btn-cafe-outline"
                      >
                        <i className="bi bi-receipt me-1"></i>Receipt
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Order items preview */}
              {payment.order?.items && (
                <div className="mt-2 pt-2 border-top">
                  <div className="d-flex flex-wrap gap-1">
                    {payment.order.items.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="badge bg-light text-dark border" style={{ fontSize: '0.72rem' }}>
                        {item.name} × {item.quantity}
                      </span>
                    ))}
                    {payment.order.items?.length > 3 && (
                      <span className="badge bg-light text-muted border" style={{ fontSize: '0.72rem' }}>
                        +{payment.order.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
