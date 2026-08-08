const mongoose = require('mongoose');

/**
 * Individual order item (sub-item selected by user)
 */
const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  subItemId: { type: mongoose.Schema.Types.ObjectId },
  category: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true }, // price * quantity
});

/**
 * Order Schema
 * Tracks full lifecycle of a customer order
 */
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    // Order status lifecycle
    status: {
      type: String,
      enum: ['Placed', 'Preparing', 'Ready', 'Out for Delivery', 'Completed', 'Cancelled'],
      default: 'Placed',
    },
    statusHistory: [
      {
        status: String,
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    // Estimated completion time (in minutes)
    estimatedTime: {
      type: Number,
      default: 20,
    },
    // Payment reference
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'GPay', 'PhonePe', 'Bank Transfer', 'Razorpay'],
      default: 'Cash',
    },
    // Delivery notes from customer
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
