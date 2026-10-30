const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      default: '',
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    location: {
      type: String,
      enum: ['Indoor', 'Outdoor', 'Terrace'],
      default: 'Indoor',
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved'],
      default: 'available',
    },
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Table', tableSchema);
