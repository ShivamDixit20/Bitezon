/**
 * Order Model
 * MongoDB/Mongoose schema for order management
 */

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
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
  restaurantName: {
    type: String,
    required: true
  },
  items: [{
    itemId: String,
    itemName: String,
    quantity: Number,
    originalPrice: Number,
    effectivePrice: Number,
    offer: String
  }],
  totals: {
    totalItems: Number,
    originalTotal: Number,
    discountedTotal: Number,
    totalSavings: Number
  },
  paymentMethod: {
    type: String,
    default: 'Not specified'
  },
  status: {
    type: String,
    enum: ['confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'confirmed'
  },
  orderDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  estimatedDelivery: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
orderSchema.index({ userId: 1, orderDate: -1 });
orderSchema.index({ platform: 1, orderDate: -1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
