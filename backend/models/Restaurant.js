/**
 * Restaurant Model
 * MongoDB schema for restaurants (supports both Swiggy and Zomato)
 */

const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  restaurantId: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['swiggy', 'zomato'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  deliveryTime: {
    type: String,
    default: '30 mins'
  },
  cuisines: [{
    type: String,
    trim: true
  }],
  image: {
    type: String,
    default: 'https://via.placeholder.com/300x200'
  },
  isVeg: {
    type: Boolean,
    default: false
  },
  offers: [{
    type: String
  }],
  costForTwo: {
    type: Number,
    default: 300
  },
  promoted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for platform + restaurantId (unique per platform)
restaurantSchema.index({ platform: 1, restaurantId: 1 }, { unique: true });

// Index for common queries
restaurantSchema.index({ platform: 1, city: 1 });
restaurantSchema.index({ platform: 1, isVeg: 1 });
restaurantSchema.index({ platform: 1, rating: -1 });

module.exports = mongoose.model('Restaurant', restaurantSchema);
