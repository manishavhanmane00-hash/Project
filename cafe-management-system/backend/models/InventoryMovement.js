const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
    },
    type: {
      type: String,
      enum: ['stock_in', 'stock_out', 'waste', 'adjustment'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
