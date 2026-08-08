import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

/**
 * PaymentSlip Component
 * Displays a printable receipt for a completed order
 */
export default function PaymentSlip() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const { data } = await api.get(`/payments/receipt/${orderId}`);
        setOrder(data.data);
      } catch {
        toast.error('Failed to load receipt');
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [orderId]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border spinner-cafe" role="status" />
      </div>
    );
  }

  if (!order) return <div className="alert alert-danger">Receipt not found.</div>;

  const payment = order.payment;

  return (
    <div>
      <div className="text-center mb-4">
        <button className="btn btn-cafe me-2" onClick={handlePrint}>
          <i className="bi bi-printer me-2"></i>Print Receipt
        </button>
        <Link to="/dashboard/orders" className="btn btn-cafe-outline">
          <i className="bi bi-arrow-left me-2"></i>My Orders
        </Link>
      </div>

      {/* Printable Receipt */}
      <div className="payment-slip" id="receipt-printable">
        {/* Header */}
        <div className="payment-slip-header">
          <div style={{ fontSize: '2.5rem' }}>☕</div>
          <h3 className="fw-bold mb-0" style={{ color: 'var(--cafe-brown)' }}>Brew &amp; Bite Cafe</h3>
          <p className="text-muted small mb-0">Official Receipt</p>
        </div>

        {/* Receipt Details */}
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted small">Receipt No.</span>
            <span className="fw-semibold small font-monospace">{payment?.receiptNumber || 'N/A'}</span>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted small">Order ID</span>
            <span className="fw-semibold small font-monospace">#{order._id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted small">Customer</span>
            <span className="fw-semibold small">{order.user?.name}</span>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted small">Date &amp; Time</span>
            <span className="fw-semibold small">{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted small">Payment Method</span>
            <span className="fw-semibold small">{order.paymentMethod}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-muted small">Payment Status</span>
            <span className={`badge ${order.paymentStatus === 'Paid' ? 'bg-success' : 'bg-warning text-dark'}`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>

        <hr style={{ borderStyle: 'dashed' }} />

        {/* Items */}
        <div className="mb-3">
          <div className="fw-bold mb-2">Items</div>
          {order.items.map((item, idx) => (
            <div key={idx} className="d-flex justify-content-between mb-1">
              <div>
                <span>{item.name}</span>
                <span className="text-muted ms-1 small">× {item.quantity}</span>
              </div>
              <span>₹{item.subtotal}</span>
            </div>
          ))}
        </div>

        <hr style={{ borderStyle: 'dashed' }} />

        {/* Total */}
        <div className="d-flex justify-content-between fw-bold fs-5">
          <span>Total Amount</span>
          <span style={{ color: 'var(--cafe-brown)' }}>₹{order.totalAmount}</span>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-muted" style={{ fontSize: '0.8rem' }}>
          <p className="mb-1">Thank you for dining with us! 🙏</p>
          <p className="mb-0">Brew &amp; Bite Cafe — Taste the Difference</p>
        </div>
      </div>

      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-printable, #receipt-printable * { visibility: visible; }
          #receipt-printable { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
