import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

/**
 * OrderHistory Component
 * Shows the current user's past and active orders
 */
export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/my');
      setOrders(data.data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border spinner-cafe" role="status" />
        <p className="mt-3 text-muted">Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h4 className="fw-bold">No orders yet</h4>
        <p className="text-muted">Start by browsing our delicious menu!</p>
        <Link to="/dashboard" className="btn btn-cafe mt-3">
          <i className="bi bi-shop me-2"></i>Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h5 className="fw-bold mb-4" style={{ color: 'var(--cafe-brown-dark)' }}>
        <i className="bi bi-clock-history me-2"></i>My Orders
      </h5>

      <div className="d-flex flex-column gap-3">
        {orders.map((order) => (
          <div key={order._id} className="card-cafe p-4">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div>
                <div className="fw-bold">
                  Order <span className="font-monospace text-muted" style={{ fontSize: '0.85rem' }}>#{order._id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="text-muted small mt-1">
                  {new Date(order.createdAt).toLocaleString()}
                </div>
                {/* Items summary */}
                <div className="mt-2">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <span key={idx} className="badge bg-light text-dark border me-1 mb-1" style={{ fontSize: '0.75rem' }}>
                      {item.name} × {item.quantity}
                    </span>
                  ))}
                  {order.items.length > 3 && (
                    <span className="badge bg-light text-muted border" style={{ fontSize: '0.75rem' }}>
                      +{order.items.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="text-end">
                <span className={`status-badge status-${order.status} d-block mb-2`}>
                  {order.status}
                </span>
                <div className="fw-bold" style={{ color: 'var(--cafe-brown)', fontSize: '1.1rem' }}>
                  ₹{order.totalAmount}
                </div>
                <div className="text-muted small">{order.paymentMethod}</div>
                <span className={`badge mt-1 ${order.paymentStatus === 'Paid' ? 'bg-success' : 'bg-warning text-dark'}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="d-flex gap-2 mt-3 flex-wrap">
              {['Placed', 'Preparing', 'Ready', 'Out for Delivery'].includes(order.status) && (
                <Link
                  to={`/dashboard/orders/track/${order._id}`}
                  className="btn btn-sm btn-cafe"
                >
                  <i className="bi bi-geo-alt me-1"></i>Track Order
                </Link>
              )}
              {order.paymentStatus === 'Paid' && (
                <Link
                  to={`/dashboard/orders/receipt/${order._id}`}
                  className="btn btn-sm btn-cafe-outline"
                >
                  <i className="bi bi-receipt me-1"></i>Receipt
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
