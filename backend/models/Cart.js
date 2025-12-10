/**
 * Cart Model
 * MongoDB/Mongoose schema for shopping cart management
 */

const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  itemId: { 
    type: String, 
    required: true 
  },
  itemName: { 
    type: String, 
    required: true 
  },
  originalPrice: { 
    type: Number, 
    required: true 
  },
  effectivePrice: { 
    type: Number, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1,
    default: 1
  },
  offer: { 
    type: String, 
    default: null 
  },
  addedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const PlatformCartSchema = new mongoose.Schema({
  items: {
    type: [CartItemSchema],
    default: []
  },
  restaurantId: { 
    type: String, 
    default: null 
  },
  restaurantName: { 
    type: String, 
    default: null 
  }
}, { _id: false });

const CartSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    index: true,
    unique: true
  },
  swiggy: { 
    type: PlatformCartSchema, 
    default: () => ({ items: [], restaurantId: null, restaurantName: null })
  },
  zomato: { 
    type: PlatformCartSchema, 
    default: () => ({ items: [], restaurantId: null, restaurantName: null })
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Update the updatedAt timestamp before saving
CartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Cart = mongoose.model('Cart', CartSchema);

module.exports = Cart;
