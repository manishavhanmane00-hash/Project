import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';

/**
 * Cart Component
 * Shows cart items, totals, payment method selection and checkout
 */
export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, cartCount, addToCart, removeFromCart, deleteFromCart, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const paymentMethods = [
    { value: 'Cash', icon: '💵', label: 'Cash' },
    { value: 'UPI', icon: '📱', label: 'UPI' },
    { value: 'GPay', icon: '🅖', label: 'GPay' },
    { value: 'PhonePe', icon: '📲', label: 'PhonePe' },
    { value: 'Bank Transfer', icon: '🏦', label: 'Bank Transfer' },
    { value: 'Razorpay', icon: '💳', label: 'Card / Razorpay' },
  ];

  const handleCheckout = async () => {
    if (cartItems.length === 0) return toast.error('Your cart is empty!');
    setLoading(true);
    try {
      // 1. Place the order
      const orderPayload = {
        items: cartItems.map((item) => ({
          menuItemId: item.menuItemId,
          subItemId: item.subItemId,
          quantity: item.quantity,
        })),
        paymentMethod,
        notes,
      };
      const { data: orderData } = await api.post('/orders', orderPayload);
      const orderId = orderData.data._id;

      if (paymentMethod === 'Razorpay') {
        // 2a. Razorpay flow — create Razorpay order
        await handleRazorpay(orderId);
      } else {
        // 2b. Manual payment flow
        await api.post('/payments/manual', { cafeOrderId: orderId, method: paymentMethod });
        toast.success('🎉 Order placed successfully!');
        clearCart();
        navigate(`/dashboard/orders/track/${orderId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpay = async (orderId) => {
    try {
      const { data } = await api.post('/payments/create-order', { orderId });
      const { razorpayOrderId, amount, currency, keyId } = data.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Brew & Bite Cafe',
        description: 'Order Payment',
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              cafeOrderId: orderId,
              method: 'Razorpay',
            });
            toast.success('🎉 Payment successful! Order placed.');
            clearCart();
            navigate(`/dashboard/orders/track/${orderId}`);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: { name: '', email: '' },
        theme: { color: '#6f4e37' },
        modal: {
          ondismiss: () => toast.info('Payment cancelled'),
        },
      };

      // Razorpay checkout.js must be loaded (loaded via CDN or script tag)
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.error('Razorpay SDK not loaded. Please refresh and try again.');
      }
    } catch (err) {
      toast.error('Failed to initialize Razorpay: ' + (err.response?.data?.message || err.message));
    }
  };

  if (cartCount === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🛒</div>
        <h4 className="fw-bold">Your cart is empty</h4>
        <p className="text-muted">Add some delicious items from our menu!</p>
        <button className="btn btn-cafe mt-3" onClick={() => navigate('/dashboard')}>
          <i className="bi bi-arrow-left me-2"></i>Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="row g-4">
      {/* Cart Items */}
      <div className="col-lg-8">
        <div className="card-cafe p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">
              <i className="bi bi-cart3 me-2"></i>Cart ({cartCount} items)
            </h5>
            <button className="btn btn-sm btn-outline-danger" onClick={clearCart}>
              <i className="bi bi-trash me-1"></i>Clear All
            </button>
          </div>

          {cartItems.map((item) => (
            <div key={item.subItemId} className="cart-item d-flex align-items-center gap-3">
              {/* Item image */}
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="rounded"
                  style={{ width: 64, height: 64, objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="rounded bg-light d-flex align-items-center justify-content-center"
                  style={{ width: 64, height: 64, fontSize: '1.5rem' }}
                >
                  🍽️
                </div>
              )}

              {/* Item details */}
              <div className="flex-grow-1">
                <div className="fw-semibold">{item.name}</div>
                <div className="text-muted small">{item.category}</div>
                <div className="fw-bold mt-1" style={{ color: 'var(--cafe-brown)' }}>
                  ₹{item.price} × {item.quantity} = <strong>₹{item.price * item.quantity}</strong>
                </div>
              </div>

              {/* Quantity controls */}
              <div className="d-flex align-items-center gap-2">
                <button
                  className="cart-quantity-btn"
                  onClick={() => removeFromCart(item.subItemId)}
                  aria-label="Decrease quantity"
                >
                  <i className="bi bi-dash"></i>
                </button>
                <span className="fw-bold px-1">{item.quantity}</span>
                <button
                  className="cart-quantity-btn"
                  onClick={() => addToCart(item)}
                  aria-label="Increase quantity"
                >
                  <i className="bi bi-plus"></i>
                </button>
                <button
                  className="btn btn-sm btn-link text-danger p-0 ms-1"
                  onClick={() => deleteFromCart(item.subItemId)}
                  aria-label="Remove item"
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Special instructions */}
        <div className="card-cafe p-4 mt-3">
          <label className="form-label fw-semibold">
            <i className="bi bi-chat-left-text me-2"></i>Special Instructions (optional)
          </label>
          <textarea
            className="form-control"
            rows={2}
            placeholder="Any dietary requirements, extra sauce, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Order Summary */}
      <div className="col-lg-4">
        <div className="card-cafe p-4">
          <h5 className="fw-bold mb-3">Order Summary</h5>

          {cartItems.map((item) => (
            <div key={item.subItemId} className="d-flex justify-content-between mb-1" style={{ fontSize: '0.9rem' }}>
              <span>{item.name} × {item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}

          <hr />
          <div className="d-flex justify-content-between fw-bold fs-5 mb-4">
            <span>Total</span>
            <span style={{ color: 'var(--cafe-brown)' }}>₹{cartTotal}</span>
          </div>

          {/* Payment Method */}
          <h6 className="fw-bold mb-3">Select Payment Method</h6>
          <div className="row g-2 mb-4">
            {paymentMethods.map((m) => (
              <div key={m.value} className="col-6">
                <div
                  className={`border rounded p-2 text-center cursor-pointer ${paymentMethod === m.value ? 'border-warning bg-warning bg-opacity-10' : ''}`}
                  onClick={() => setPaymentMethod(m.value)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setPaymentMethod(m.value)}
                  style={{ cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem' }}
                >
                  <div style={{ fontSize: '1.2rem' }}>{m.icon}</div>
                  <div className="fw-semibold">{m.label}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn btn-cafe w-100"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2" />Processing...</>
            ) : (
              <><i className="bi bi-bag-check me-2"></i>Place Order — ₹{cartTotal}</>
            )}
          </button>

          {paymentMethod === 'Razorpay' && (
            <p className="text-muted small text-center mt-2">
              You'll be redirected to secure Razorpay checkout
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
