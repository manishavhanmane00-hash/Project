import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

// Status steps for the tracking timeline
const STATUS_STEPS = [
  { key: 'Placed', icon: '📋', label: 'Order Placed' },
  { key: 'Preparing', icon: '👨‍🍳', label: 'Preparing' },
  { key: 'Ready', icon: '✅', label: 'Ready' },
  { key: 'Out for Delivery', icon: '🚴', label: 'On the Way' },
  { key: 'Completed', icon: '🎉', label: 'Delivered' },
];

const STATUS_ORDER = ['Placed', 'Preparing', 'Ready', 'Out for Delivery', 'Completed'];

/**
 * OrderTracking Component
 * Polls the backend every 15 seconds for live status updates
 */
export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prevStatus, setPrevStatus] = useState(null);

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}/track`);
      const newStatus = data.data.status;

      // Toast when status changes
      if (prevStatus && prevStatus !== newStatus) {
        if (newStatus === 'Completed') {
          toast.success('🎉 Your order has been delivered/completed!', { autoClose: 5000 });
        } else {
          toast.info(`Order status updated: ${newStatus}`);
        }
      }
      setPrevStatus(newStatus);
      setOrder(data.data);
    } catch (err) {
      toast.error('Failed to fetch order status');
    } finally {
      setLoading(false);
    }
  }, [orderId, prevStatus]);

  useEffect(() => {
    fetchOrder();
    // Poll every 15 seconds for live updates
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [orderId]); // eslint-disable-line

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    return STATUS_ORDER.indexOf(order.status);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border spinner-cafe" role="status" />
        <p className="mt-3 text-muted">Loading order status...</p>
      </div>
    );
  }

  if (!order) return <div className="alert alert-danger">Order not found.</div>;

  const currentIdx = getCurrentStepIndex();
  const isCancelled = order.status === 'Cancelled';

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        {/* Order Header */}
        <div className="card-cafe p-4 mb-4">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-1">
                <i className="bi bi-receipt me-2"></i>Order Tracking
              </h5>
              <div className="text-muted small">
                Order ID: <span className="font-monospace">{order.orderId}</span>
              </div>
              <div className="text-muted small">
                Placed on: {new Date(order.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="text-end">
              <span className={`status-badge status-${order.status}`}>{order.status}</span>
              {!isCancelled && order.status !== 'Completed' && (
                <div className="text-muted small mt-1">
                  <i className="bi bi-clock me-1"></i>
                  Est. {order.estimatedTimeRemaining} min
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        {!isCancelled && (
          <div className="card-cafe p-4 mb-4">
            <h6 className="fw-bold mb-4">Order Progress</h6>
            <div className="tracking-timeline">
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx < currentIdx;
                const isActive = idx === currentIdx;
                return (
                  <div
                    key={step.key}
                    className={`tracking-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  >
                    <div className="step-circle">
                      {isCompleted ? '✓' : step.icon}
                    </div>
                    <div style={{ fontSize: '0.72rem', textAlign: 'center', maxWidth: 60 }}>
                      {step.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="alert alert-danger">
            <i className="bi bi-x-circle me-2"></i>This order has been cancelled.
          </div>
        )}

        {/* Order Items */}
        <div className="card-cafe p-4 mb-4">
          <h6 className="fw-bold mb-3">Items Ordered</h6>
          {order.items.map((item, idx) => (
            <div key={idx} className="d-flex justify-content-between mb-2 pb-2 border-bottom">
              <div>
                <span className="fw-semibold">{item.name}</span>
                <span className="text-muted ms-2 small">× {item.quantity}</span>
                <div className="text-muted small">{item.category}</div>
              </div>
              <span className="fw-bold" style={{ color: 'var(--cafe-brown)' }}>₹{item.subtotal}</span>
            </div>
          ))}
          <div className="d-flex justify-content-between fw-bold fs-5 mt-2">
            <span>Total</span>
            <span style={{ color: 'var(--cafe-brown)' }}>₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="card-cafe p-4 mb-4">
          <h6 className="fw-bold mb-3">Payment Details</h6>
          <div className="row g-2">
            <div className="col-6">
              <div className="text-muted small">Method</div>
              <div className="fw-semibold">{order.paymentMethod}</div>
            </div>
            <div className="col-6">
              <div className="text-muted small">Status</div>
              <span className={`badge ${order.paymentStatus === 'Paid' ? 'bg-success' : 'bg-warning text-dark'}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Receipt link */}
        {order.paymentStatus === 'Paid' && (
          <div className="text-center mb-3">
            <Link to={`/dashboard/orders/receipt/${order.orderId}`} className="btn btn-cafe-outline">
              <i className="bi bi-file-earmark-text me-2"></i>View Receipt
            </Link>
          </div>
        )}

        <div className="text-center">
          <Link to="/dashboard/orders" className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
