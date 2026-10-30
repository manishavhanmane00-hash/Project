const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      default: 'kg',
    },
    currentStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    minStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    costPerUnit: {
      type: Number,
      default: 0,
      min: 0,
    },
    supplier: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
