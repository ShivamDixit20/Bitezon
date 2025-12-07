const express = require('express');
const router = express.Router();
const swiggyController = require('../controller/swiggycontroller');


/**
 * Restaurant Routes
 */
// GET /api/swiggy/restaurants - Get all restaurants with filters
router.get('/restaurants', swiggyController.getAllRestaurants);

// GET /api/swiggy/restaurants/:id - Get restaurant by ID
router.get('/restaurants/:id', swiggyController.getRestaurantById);

/**
 * Menu Routes
 */
// GET /api/swiggy/menu/:restaurantId - Get menu for a restaurant
router.get('/menu/:restaurantId', swiggyController.getMenuByRestaurant);

// GET /api/swiggy/menu - Get all menu items
router.get('/menu', swiggyController.getAllMenuItems);

/**
 * Search & Filter Routes
 */
// GET /api/swiggy/search - Search restaurants and menu items
router.get('/search', swiggyController.search);

// GET /api/swiggy/filters - Get available filter options
router.get('/filters', swiggyController.getFilters);

/**
 * Order Routes
 */
// POST /api/swiggy/orders - Create a new order
router.post('/orders', swiggyController.createOrder);

// GET /api/swiggy/orders - Get all orders
router.get('/orders', swiggyController.getAllOrders);

// GET /api/swiggy/orders/:orderId - Get order by ID
router.get('/orders/:orderId', swiggyController.getOrderById);

// PATCH /api/swiggy/orders/:orderId/status - Update order status
router.patch('/orders/:orderId/status', swiggyController.updateOrderStatus);

module.exports = router;

