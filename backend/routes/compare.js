const express = require('express');
const router = express.Router();
const compareController = require('../controller/compareController');

/**
 * Compare API Routes
 * Endpoints for comparing prices and deals across Swiggy and Zomato
 */

// GET /api/compare/restaurants - Compare all restaurants across platforms
router.get('/restaurants', compareController.getAllRestaurantsComparison);

// GET /api/compare/restaurants/:id - Compare a specific restaurant across platforms
router.get('/restaurants/:id', compareController.compareRestaurant);

// GET /api/compare/menu?itemName=xxx - Compare a specific menu item across platforms
router.get('/menu', compareController.compareMenuItem);

// GET /api/compare/best-deals - Get best deals across all items
router.get('/best-deals', compareController.getBestDeals);

module.exports = router;
