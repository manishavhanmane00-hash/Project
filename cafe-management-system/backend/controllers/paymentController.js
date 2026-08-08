const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

// Initialize Razorpay instance
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

/**
 * @desc    Create a Razorpay order for payment
 * @route   POST /api/payments/create-order
 * @access  Private (User)
 */
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  // Find the cafe order
  const cafeOrder = await Order.findById(orderId);
  if (!cafeOrder) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Ensure the order belongs to the requesting user
  if (cafeOrder.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (cafeOrder.paymentStatus === 'Paid') {
    return res.status(400).json({ success: false, message: 'Order already paid' });
  }

  try {
    const razorpay = getRazorpayInstance();

    // Amount must be in paise (multiply INR by 100)
    const options = {
      amount: Math.round(cafeOrder.totalAmount * 100),
      currency: 'INR',
      receipt: `order_${cafeOrder._id}`,
      notes: {
        cafeOrderId: cafeOrder._id.toString(),
        userId: req.user._id.toString(),
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        cafeOrderId: cafeOrder._id,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('Razorpay Error:', error.message);
    res.status(500).json({ success: false, message: 'Payment gateway error: ' + error.message });
  }
});

/**
 * @desc    Verify Razorpay payment signature and record payment
 * @route   POST /api/payments/verify
 * @access  Private (User)
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, cafeOrderId, method } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !cafeOrderId) {
    return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
  }

  // Verify signature using HMAC SHA256
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    return res.status(400).json({ success: false, message: 'Invalid payment signature. Payment verification failed.' });
  }

  // Find the cafe order
  const cafeOrder = await Order.findById(cafeOrderId);
  if (!cafeOrder) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Create payment record
  const payment = await Payment.create({
    order: cafeOrder._id,
    user: req.user._id,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    amount: cafeOrder.totalAmount,
    currency: 'INR',
    method: method || 'Razorpay',
    status: 'Completed',
  });

  // Update the order's payment status
  cafeOrder.paymentStatus = 'Paid';
  cafeOrder.payment = payment._id;
  cafeOrder.paymentMethod = method || 'Razorpay';
  await cafeOrder.save();

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
    data: {
      payment,
      order: cafeOrder,
    },
  });
});

/**
 * @desc    Record a non-Razorpay payment (Cash, UPI, etc.)
 * @route   POST /api/payments/manual
 * @access  Private (User)
 */
const recordManualPayment = asyncHandler(async (req, res) => {
  const { cafeOrderId, method } = req.body;

  const cafeOrder = await Order.findById(cafeOrderId);
  if (!cafeOrder) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (cafeOrder.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (cafeOrder.paymentStatus === 'Paid') {
    return res.status(400).json({ success: false, message: 'Order already paid' });
  }

  const validMethods = ['Cash', 'UPI', 'GPay', 'PhonePe', 'Bank Transfer'];
  if (!validMethods.includes(method)) {
    return res.status(400).json({ success: false, message: 'Invalid payment method' });
  }

  // Create payment record
  const payment = await Payment.create({
    order: cafeOrder._id,
    user: req.user._id,
    amount: cafeOrder.totalAmount,
    currency: 'INR',
    method,
    status: 'Completed',
  });

  // Update order
  cafeOrder.paymentStatus = 'Paid';
  cafeOrder.payment = payment._id;
  cafeOrder.paymentMethod = method;
  await cafeOrder.save();

  res.status(200).json({
    success: true,
    message: 'Payment recorded successfully',
    data: { payment, order: cafeOrder },
  });
});

/**
 * @desc    Get payment receipt/slip for an order
 * @route   GET /api/payments/receipt/:orderId
 * @access  Private
 */
const getPaymentReceipt = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId)
    .populate('user', 'name email')
    .populate('payment');

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  res.status(200).json({ success: true, data: order });
});

module.exports = { createRazorpayOrder, verifyPayment, recordManualPayment, getPaymentReceipt };
