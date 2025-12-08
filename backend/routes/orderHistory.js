/**
 * Order History Routes
 */

const express = require('express');
const router = express.Router();
const orderHistoryController = require('../controller/orderHistoryController');

// Save a new order
router.post('/', orderHistoryController.saveOrder);

// Get order history
router.get('/', orderHistoryController.getOrderHistory);

// Get specific order
router.get('/:orderId', orderHistoryController.getOrderById);

// Update order status
router.patch('/:orderId/status', orderHistoryController.updateOrderStatus);

// Delete an order
router.delete('/:orderId', orderHistoryController.deleteOrder);

module.exports = router;
