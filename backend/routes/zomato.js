const express = require('express');
const router = express.Router();
const zomatoController = require('../controller/zomatocontroller');

/**
 * Restaurant Routes
 */
// GET /api/zomato/restaurants - Get all restaurants with filters
router.get('/restaurants', zomatoController.getAllRestaurants);

// GET /api/zomato/restaurants/promoted - Get promoted/featured restaurants
router.get('/restaurants/promoted', zomatoController.getPromotedRestaurants);

// GET /api/zomato/restaurants/:id - Get restaurant by ID
router.get('/restaurants/:id', zomatoController.getRestaurantById);

/**
 * Menu Routes
 */
// GET /api/zomato/menu/:restaurantId - Get menu for a restaurant
router.get('/menu/:restaurantId', zomatoController.getMenuByRestaurant);

// GET /api/zomato/menu - Get all menu items
router.get('/menu', zomatoController.getAllMenuItems);

/**
 * Search & Filter Routes
 */
// GET /api/zomato/search - Search restaurants and menu items
router.get('/search', zomatoController.search);

// GET /api/zomato/filters - Get available filter options
router.get('/filters', zomatoController.getFilters);

/**
 * Order Routes
 */
// POST /api/zomato/orders - Create a new order
router.post('/orders', zomatoController.createOrder);

// GET /api/zomato/orders - Get all orders
router.get('/orders', zomatoController.getAllOrders);

// GET /api/zomato/orders/:orderId - Get order by ID
router.get('/orders/:orderId', zomatoController.getOrderById);

// PATCH /api/zomato/orders/:orderId/status - Update order status
router.patch('/orders/:orderId/status', zomatoController.updateOrderStatus);

module.exports = router;
