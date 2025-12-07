/**
 * MenuItem Model
 * MongoDB schema for menu items (supports both Swiggy and Zomato)
 */

const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['swiggy', 'zomato'],
    required: true
  },
  restaurantId: {
    type: String,
    required: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    trim: true
  },
  isVeg: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    default: 'https://via.placeholder.com/200'
  },
  description: {
    type: String,
    default: ''
  },
  available: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for platform + itemId (unique per platform)
menuItemSchema.index({ platform: 1, itemId: 1 }, { unique: true });

// Index for common queries
menuItemSchema.index({ platform: 1, restaurantId: 1 });
menuItemSchema.index({ platform: 1, category: 1 });
menuItemSchema.index({ platform: 1, isVeg: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
