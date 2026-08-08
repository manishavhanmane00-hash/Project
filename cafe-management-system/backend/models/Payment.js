const mongoose = require('mongoose');

/**
 * Payment Schema
 * Records every payment transaction linked to an order
 */
const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Razorpay order ID (from create-order step)
    razorpayOrderId: {
      type: String,
      default: null,
    },
    // Razorpay payment ID (after successful payment)
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    // Razorpay signature (for verification)
    razorpaySignature: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    method: {
      type: String,
      enum: ['Cash', 'UPI', 'GPay', 'PhonePe', 'Bank Transfer', 'Razorpay'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    // Receipt number for the payment slip
    receiptNumber: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

// Auto-generate receipt number before saving
paymentSchema.pre('save', function (next) {
  if (!this.receiptNumber) {
    // Format: CAFE-YYYYMMDD-XXXXX
    const date = new Date();
    const dateStr =
      date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0');
    const random = Math.floor(10000 + Math.random() * 90000);
    this.receiptNumber = `CAFE-${dateStr}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
