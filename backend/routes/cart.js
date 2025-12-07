const express = require('express');
const router = express.Router();
const cartController = require('../controller/cartController');

// Get cart
router.get('/', cartController.getCart);

// Add item to cart
router.post('/add', cartController.addToCart);

// Remove item from cart
router.post('/remove', cartController.removeFromCart);

// Update item quantity
router.post('/update-quantity', cartController.updateQuantity);

// Clear cart
router.post('/clear', cartController.clearCart);

// Checkout - get redirect URL for platform
router.post('/checkout', cartController.checkout);

module.exports = router;
