import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${orderId}`);
        setOrder(data.data);
        // Show success toast once on mount
        toast.success('🎉 Your order has been placed successfully!', { toastId: 'order-success' });
      } catch {
        toast.error('Could not load order details.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border spinner-cafe" role="status" />
        <p className="mt-3 text-muted">Loading your order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="empty-state">
        <div className="empty-icon">❌</div>
        <h4 className="fw-bold">Order not found</h4>
        <Link to="/dashboard/orders" className="btn btn-cafe mt-3">View My Orders</Link>
      </div>
    );
  }

  const isActive = ['Placed', 'Preparing', 'Ready', 'Out for Delivery'].includes(order.status);

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        {/* Success Banner */}
        <div className="order-success-banner mb-4">
          <div className="order-success-icon">🎉</div>
          <h3 className="fw-bold mb-1">Order Placed!</h3>
          <p className="mb-0 opacity-75">Thank you for your order. We're on it!</p>
        </div>

        {/* Order Details Card */}
        <div className="card-cafe p-4 mb-3">
          <div className="row g-3">
            <div className="col-6">
              <div className="text-muted small">Order ID</div>
              <div className="fw-bold font-monospace" style={{ fontSize: '0.85rem' }}>
                #{order._id.slice(-8).toUpperCase()}
              </div>
            </div>
            <div className="col-6">
              <div className="text-muted small">Order Status</div>
              <span className={`status-badge status-${order.status}`}>{order.status}</span>
            </div>
            <div className="col-6">
              <div className="text-muted small">Amount Paid</div>
              <div className="fw-bold" style={{ color: 'var(--cafe-brown)', fontSize: '1.1rem' }}>
                ₹{order.totalAmount}
              </div>
            </div>
            <div className="col-6">
              <div className="text-muted small">Payment</div>
              <span className={`badge ${order.paymentStatus === 'Paid' ? 'bg-success' : 'bg-warning text-dark'}`}>
                {order.paymentStatus}
              </span>
            </div>
            <div className="col-6">
              <div className="text-muted small">Payment Method</div>
              <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{order.paymentMethod}</div>
            </div>
            <div className="col-6">
              <div className="text-muted small">Placed On</div>
              <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>
                {new Date(order.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          <hr />

          {/* Items */}
          <div className="mb-2">
            <div className="text-muted small fw-semibold mb-2">Items Ordered</div>
            {order.items.map((item, idx) => (
              <div key={idx} className="d-flex justify-content-between mb-1" style={{ fontSize: '0.88rem' }}>
                <span>{item.name} <span className="text-muted">× {item.quantity}</span></span>
                <span className="fw-semibold">₹{item.subtotal}</span>
              </div>
            ))}
          </div>

          {/* Estimated time */}
          {isActive && (
            <div className="alert alert-warning border-0 mb-0 mt-3 py-2 px-3" style={{ fontSize: '0.85rem' }}>
              <i className="bi bi-clock me-2"></i>
              Estimated preparation time: <strong>~{order.estimatedTime || 20} minutes</strong>
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="d-flex flex-column gap-2">
          {isActive && (
            <Link to={`/dashboard/orders/track/${order._id}`} className="btn btn-cafe w-100">
              <i className="bi bi-geo-alt me-2"></i>Track My Order
            </Link>
          )}
          {order.paymentStatus === 'Paid' && (
            <Link to={`/dashboard/orders/receipt/${order._id}`} className="btn btn-cafe-outline w-100">
              <i className="bi bi-receipt me-2"></i>View Receipt
            </Link>
          )}
          <Link to={`/dashboard/orders`} className="btn btn-outline-secondary w-100">
            <i className="bi bi-clock-history me-2"></i>View All Orders
          </Link>
          <Link to="/dashboard/menu" className="btn btn-outline-secondary w-100">
            <i className="bi bi-grid me-2"></i>Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
