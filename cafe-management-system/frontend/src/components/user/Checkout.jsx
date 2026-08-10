import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const PAYMENT_METHODS = [
  { value: 'Cash', icon: '💵', label: 'Cash' },
  { value: 'UPI', icon: '📱', label: 'UPI' },
  { value: 'GPay', icon: '🅖', label: 'GPay' },
  { value: 'PhonePe', icon: '📲', label: 'PhonePe' },
  { value: 'Bank Transfer', icon: '🏦', label: 'Bank Transfer' },
  { value: 'Razorpay', icon: '💳', label: 'Card / Razorpay' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  // Guard against double-submit
  const [orderPlaced, setOrderPlaced] = useState(false);

  if (cartItems.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🛒</div>
        <h4 className="fw-bold">Your cart is empty</h4>
        <p className="text-muted">Add items before checking out.</p>
        <Link to="/dashboard/menu" className="btn btn-cafe mt-3">
          <i className="bi bi-grid me-2"></i>Browse Menu
        </Link>
      </div>
    );
  }

  const handleRazorpay = async (orderId) => {
    const { data } = await api.post('/payments/create-order', { orderId });
    const { razorpayOrderId, amount, currency, keyId } = data.data;

    return new Promise((resolve, reject) => {
      if (!window.Razorpay) {
        reject(new Error('Razorpay SDK not loaded. Please refresh and try again.'));
        return;
      }
      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'Brew & Bite Cafe',
        description: 'Order Payment',
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              cafeOrderId: orderId,
              method: 'Razorpay',
            });
            resolve();
          } catch (err) {
            reject(new Error('Payment verification failed. Contact support.'));
          }
        },
        prefill: { name: user?.name || '', email: user?.email || '' },
        theme: { color: '#6f4e37' },
        modal: {
          ondismiss: () => reject(new Error('cancelled')),
        },
      });
      rzp.open();
    });
  };

  const handlePlaceOrder = async () => {
    if (orderPlaced || loading) return; // prevent duplicate
    setLoading(true);
    try {
      // 1. Place order
      const { data: orderData } = await api.post('/orders', {
        items: cartItems.map((i) => ({
          menuItemId: i.menuItemId,
          subItemId: i.subItemId,
          quantity: i.quantity,
        })),
        paymentMethod,
        notes,
      });
      const orderId = orderData.data._id;
      setOrderPlaced(true);

      // 2. Handle payment
      if (paymentMethod === 'Razorpay') {
        try {
          await handleRazorpay(orderId);
        } catch (err) {
          if (err.message === 'cancelled') {
            toast.info('Payment cancelled. Your order is saved — you can pay later from Order History.');
            clearCart();
            navigate(`/dashboard/orders`);
            return;
          }
          throw err;
        }
      } else {
        await api.post('/payments/manual', { cafeOrderId: orderId, method: paymentMethod });
      }

      // 3. Success
      clearCart();
      toast.success('🎉 Order placed successfully!');
      navigate(`/dashboard/order-success/${orderId}`);
    } catch (err) {
      setOrderPlaced(false); // allow retry only on real errors
      toast.error(err.response?.data?.message || err.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tax = Math.round(cartTotal * 0.05); // 5% GST display
  const grandTotal = cartTotal + tax;

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex align-items-center gap-2 mb-4">
        <Link to="/dashboard/cart" className="btn btn-sm btn-outline-secondary">
          <i className="bi bi-arrow-left"></i>
        </Link>
        <h5 className="fw-bold mb-0" style={{ color: 'var(--cafe-brown-dark)' }}>
          <i className="bi bi-bag-check me-2"></i>Checkout
        </h5>
      </div>

      <div className="row g-4">
        {/* Left — Order Summary + Payment */}
        <div className="col-lg-7">
          {/* Order Summary */}
          <div className="card-cafe p-4 mb-3">
            <h6 className="fw-bold mb-3"><i className="bi bi-list-ul me-2"></i>Order Summary</h6>
            {cartItems.map((item) => (
              <div key={item.subItemId} className="d-flex align-items-center gap-3 py-2 border-bottom">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="rounded"
                    style={{ width: 52, height: 52, objectFit: 'cover' }} />
                ) : (
                  <div className="rounded bg-light d-flex align-items-center justify-content-center"
                    style={{ width: 52, height: 52, fontSize: '1.3rem' }}>🍽️</div>
                )}
                <div className="flex-grow-1">
                  <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{item.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.78rem' }}>{item.category}</div>
                </div>
                <div className="text-end">
                  <div className="fw-bold" style={{ color: 'var(--cafe-brown)', fontSize: '0.9rem' }}>
                    ₹{item.price * item.quantity}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    ₹{item.price} × {item.quantity}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Billing Details */}
          <div className="card-cafe p-4 mb-3">
            <h6 className="fw-bold mb-3"><i className="bi bi-person-lines-fill me-2"></i>Billing Details</h6>
            <div className="row g-2" style={{ fontSize: '0.9rem' }}>
              <div className="col-6">
                <div className="text-muted small">Name</div>
                <div className="fw-semibold">{user?.name}</div>
              </div>
              <div className="col-6">
                <div className="text-muted small">Email</div>
                <div className="fw-semibold">{user?.email}</div>
              </div>
              {user?.phone && (
                <div className="col-6 mt-2">
                  <div className="text-muted small">Phone</div>
                  <div className="fw-semibold">{user.phone}</div>
                </div>
              )}
            </div>
          </div>

          {/* Special Instructions */}
          <div className="card-cafe p-4">
            <label className="form-label fw-semibold" style={{ fontSize: '0.9rem' }}>
              <i className="bi bi-chat-left-text me-2"></i>Special Instructions (optional)
            </label>
            <textarea className="form-control" rows={2}
              placeholder="Dietary requirements, extra sauce, etc."
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {/* Right — Price Breakdown + Payment Method */}
        <div className="col-lg-5">
          <div className="card-cafe p-4 mb-3">
            <h6 className="fw-bold mb-3"><i className="bi bi-receipt me-2"></i>Price Breakdown</h6>
            <div className="d-flex justify-content-between mb-2" style={{ fontSize: '0.9rem' }}>
              <span className="text-muted">Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span>₹{cartTotal}</span>
            </div>
            <div className="d-flex justify-content-between mb-2" style={{ fontSize: '0.9rem' }}>
              <span className="text-muted">GST (5%)</span>
              <span>₹{tax}</span>
            </div>
            <div className="d-flex justify-content-between mb-2" style={{ fontSize: '0.9rem' }}>
              <span className="text-muted">Delivery</span>
              <span className="text-success fw-semibold">Free</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between fw-bold fs-5">
              <span>Total</span>
              <span style={{ color: 'var(--cafe-brown)' }}>₹{grandTotal}</span>
            </div>
            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
              * GST shown for display. Actual charge: ₹{cartTotal}
            </div>
          </div>

          {/* Payment Method */}
          <div className="card-cafe p-4 mb-3">
            <h6 className="fw-bold mb-3"><i className="bi bi-credit-card me-2"></i>Payment Method</h6>
            <div className="row g-2">
              {PAYMENT_METHODS.map((m) => (
                <div key={m.value} className="col-6">
                  <div
                    className={`checkout-payment-option ${paymentMethod === m.value ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod(m.value)}
                    role="button" tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setPaymentMethod(m.value)}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{m.icon}</span>
                    <span className="fw-semibold" style={{ fontSize: '0.82rem' }}>{m.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-cafe w-100 py-3" onClick={handlePlaceOrder}
            disabled={loading || orderPlaced} style={{ fontSize: '1rem' }}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" />Processing...</>
              : <><i className="bi bi-bag-check me-2"></i>Place Order — ₹{cartTotal}</>}
          </button>

          {paymentMethod === 'Razorpay' && (
            <p className="text-muted small text-center mt-2">
              <i className="bi bi-shield-lock me-1"></i>Secured by Razorpay
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
