const mongoose = require('mongoose');

/**
 * Sub-item schema (variants/options within a category)
 * e.g., Paneer Pizza, Veg Pizza under "Pizza" category
 */
const subItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: '' }, // URL or path to image
  isAvailable: { type: Boolean, default: true },
});

/**
 * MenuItem (Category) Schema
 * Top-level categories like Pizza, Burger, Coffee, etc.
 */
const menuItemSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
    },
    icon: {
      type: String,
      default: '🍽️', // emoji icon for the category
    },
    image: {
      type: String,
      default: '', // category banner image
    },
    description: {
      type: String,
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    subItems: [subItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);
