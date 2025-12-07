/**
 * Zomato API Controller
 * Handles all business logic for restaurants, menu, filters, search, and orders
 */

const { nanoid } = require('nanoid');
const restaurantsData = require('../data/zomatoRestaurant');
const menuData = require('../data/zomatoMenu');

// In-memory storage for orders
let orders = [];

/**
 * Get all restaurants with optional filters
 * Query params: city, isVeg, minRating, cuisine, maxCost, promoted
 */
exports.getAllRestaurants = (req, res) => {
  try {
    let filtered = [...restaurantsData];
    
    // Filter by city
    if (req.query.city) {
      filtered = filtered.filter(r => 
        r.city.toLowerCase() === req.query.city.toLowerCase()
      );
    }
    
    // Filter by isVeg
    if (req.query.isVeg !== undefined) {
      const isVeg = req.query.isVeg === 'true';
      filtered = filtered.filter(r => r.isVeg === isVeg);
    }
    
    // Filter by minimum rating
    if (req.query.minRating) {
      const minRating = parseFloat(req.query.minRating);
      filtered = filtered.filter(r => r.rating >= minRating);
    }
    
    // Filter by cuisine
    if (req.query.cuisine) {
      filtered = filtered.filter(r => 
        r.cuisines.some(c => 
          c.toLowerCase().includes(req.query.cuisine.toLowerCase())
        )
      );
    }

    // Filter by max cost for two
    if (req.query.maxCost) {
      const maxCost = parseInt(req.query.maxCost);
      filtered = filtered.filter(r => r.costForTwo <= maxCost);
    }

    // Filter by promoted restaurants
    if (req.query.promoted !== undefined) {
      const promoted = req.query.promoted === 'true';
      filtered = filtered.filter(r => r.promoted === promoted);
    }

    // Sort options
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'deliveryTime':
          filtered.sort((a, b) => parseInt(a.deliveryTime) - parseInt(b.deliveryTime));
          break;
        case 'costLowToHigh':
          filtered.sort((a, b) => a.costForTwo - b.costForTwo);
          break;
        case 'costHighToLow':
          filtered.sort((a, b) => b.costForTwo - a.costForTwo);
          break;
      }
    }
    
    res.json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurants',
      error: error.message
    });
  }
};

/**
 * Get restaurant by ID
 */
exports.getRestaurantById = (req, res) => {
  try {
    const restaurant = restaurantsData.find(r => r.id === req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    res.json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant',
      error: error.message
    });
  }
};

/**
 * Get menu items for a specific restaurant
 */
exports.getMenuByRestaurant = (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;
    
    // Check if restaurant exists
    const restaurant = restaurantsData.find(r => r.id === restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    // Get menu items for this restaurant
    let menu = menuData.filter(item => item.restaurantId === restaurantId);
    
    // Filter by category if provided
    if (req.query.category) {
      menu = menu.filter(item => 
        item.category.toLowerCase() === req.query.category.toLowerCase()
      );
    }
    
    // Filter by isVeg if provided
    if (req.query.isVeg !== undefined) {
      const isVeg = req.query.isVeg === 'true';
      menu = menu.filter(item => item.isVeg === isVeg);
    }
    
    // Filter by max price if provided
    if (req.query.maxPrice) {
      const maxPrice = parseFloat(req.query.maxPrice);
      menu = menu.filter(item => item.price <= maxPrice);
    }

    // Sort by price
    if (req.query.sortBy === 'priceLowToHigh') {
      menu.sort((a, b) => a.price - b.price);
    } else if (req.query.sortBy === 'priceHighToLow') {
      menu.sort((a, b) => b.price - a.price);
    }
    
    res.json({
      success: true,
      restaurant: restaurant.name,
      count: menu.length,
      data: menu
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching menu',
      error: error.message
    });
  }
};

/**
 * Get all menu items (across all restaurants)
 */
exports.getAllMenuItems = (req, res) => {
  try {
    let items = [...menuData];
    
    // Filter by isVeg
    if (req.query.isVeg !== undefined) {
      const isVeg = req.query.isVeg === 'true';
      items = items.filter(item => item.isVeg === isVeg);
    }
    
    // Filter by category
    if (req.query.category) {
      items = items.filter(item => 
        item.category.toLowerCase() === req.query.category.toLowerCase()
      );
    }
    
    // Filter by price range
    if (req.query.minPrice) {
      const minPrice = parseFloat(req.query.minPrice);
      items = items.filter(item => item.price >= minPrice);
    }
    
    if (req.query.maxPrice) {
      const maxPrice = parseFloat(req.query.maxPrice);
      items = items.filter(item => item.price <= maxPrice);
    }
    
    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching menu items',
      error: error.message
    });
  }
};

/**
 * Search restaurants and menu items
 * Query param: q (search query)
 */
exports.search = (req, res) => {
  try {
    const query = req.query.q?.toLowerCase();
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Search in restaurants
    const matchedRestaurants = restaurantsData.filter(r => 
      r.name.toLowerCase().includes(query) ||
      r.city.toLowerCase().includes(query) ||
      r.cuisines.some(c => c.toLowerCase().includes(query))
    );
    
    // Search in menu items
    const matchedMenuItems = menuData.filter(item =>
      item.itemName.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
    
    res.json({
      success: true,
      query: req.query.q,
      results: {
        restaurants: {
          count: matchedRestaurants.length,
          data: matchedRestaurants
        },
        menuItems: {
          count: matchedMenuItems.length,
          data: matchedMenuItems
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error performing search',
      error: error.message
    });
  }
};

/**
 * Get available filter options
 */
exports.getFilters = (req, res) => {
  try {
    // Extract unique cities
    const cities = [...new Set(restaurantsData.map(r => r.city))];
    
    // Extract unique cuisines
    const cuisines = [...new Set(restaurantsData.flatMap(r => r.cuisines))];
    
    // Extract unique categories
    const categories = [...new Set(menuData.map(item => item.category))];
    
    // Rating ranges
    const ratingRanges = [
      { label: '4.5+', value: 4.5 },
      { label: '4.0+', value: 4.0 },
      { label: '3.5+', value: 3.5 },
      { label: '3.0+', value: 3.0 }
    ];
    
    // Cost for two ranges
    const costRanges = [
      { label: 'Under ₹300', min: 0, max: 300 },
      { label: '₹300 - ₹500', min: 300, max: 500 },
      { label: '₹500 - ₹700', min: 500, max: 700 },
      { label: '₹700 - ₹1000', min: 700, max: 1000 },
      { label: 'Above ₹1000', min: 1000, max: 9999 }
    ];

    // Sort options
    const sortOptions = [
      { label: 'Rating: High to Low', value: 'rating' },
      { label: 'Delivery Time', value: 'deliveryTime' },
      { label: 'Cost: Low to High', value: 'costLowToHigh' },
      { label: 'Cost: High to Low', value: 'costHighToLow' }
    ];
    
    res.json({
      success: true,
      filters: {
        cities: cities.sort(),
        cuisines: cuisines.sort(),
        categories: categories.sort(),
        ratingRanges,
        costRanges,
        sortOptions,
        dietaryPreferences: [
          { label: 'Pure Veg', value: true },
          { label: 'Non-Veg', value: false }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching filters',
      error: error.message
    });
  }
};

/**
 * Create a new order
 */
exports.createOrder = (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, paymentMethod } = req.body;
    
    // Validation
    if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID and items are required'
      });
    }
    
    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required'
      });
    }
    
    // Verify restaurant exists
    const restaurant = restaurantsData.find(r => r.id === restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    // Calculate total
    let subtotal = 0;
    const orderItems = [];
    
    for (const orderItem of items) {
      const menuItem = menuData.find(m => 
        m.id === orderItem.itemId && m.restaurantId === restaurantId
      );
      
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Menu item ${orderItem.itemId} not found in this restaurant`
        });
      }
      
      const quantity = orderItem.quantity || 1;
      const itemTotal = menuItem.price * quantity;
      subtotal += itemTotal;
      
      orderItems.push({
        ...menuItem,
        quantity,
        itemTotal
      });
    }

    // Calculate taxes and fees (Zomato style)
    const deliveryFee = subtotal > 500 ? 0 : 40;
    const taxes = Math.round(subtotal * 0.05); // 5% GST
    const packagingCharges = 20;
    const total = subtotal + deliveryFee + taxes + packagingCharges;
    
    // Create order
    const order = {
      id: nanoid(10),
      restaurantId,
      restaurantName: restaurant.name,
      items: orderItems,
      deliveryAddress,
      paymentMethod: paymentMethod || 'COD',
      subtotal,
      deliveryFee,
      taxes,
      packagingCharges,
      total,
      status: 'placed',
      placedAt: new Date().toISOString(),
      estimatedDelivery: restaurant.deliveryTime
    };
    
    orders.push(order);
    
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

/**
 * Get order by ID
 */
exports.getOrderById = (req, res) => {
  try {
    const order = orders.find(o => o.id === req.params.orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

/**
 * Get all orders
 */
exports.getAllOrders = (req, res) => {
  try {
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

/**
 * Update order status
 */
exports.updateOrderStatus = (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['placed', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
      });
    }
    
    const orderIndex = orders.findIndex(o => o.id === req.params.orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Order status updated',
      data: orders[orderIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

/**
 * Cancel order by ID (convenience endpoint)
 */
exports.cancelOrder = (req, res) => {
  try {
    const orderIndex = orders.findIndex(o => o.id === req.params.orderId);

    if (orderIndex === -1) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentStatus = orders[orderIndex].status;
    if (currentStatus === 'delivered') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a delivered order' });
    }

    if (currentStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }

    orders[orderIndex].status = 'cancelled';
    orders[orderIndex].updatedAt = new Date().toISOString();

    res.json({ success: true, message: 'Order cancelled', data: orders[orderIndex] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error cancelling order', error: error.message });
  }
};

/**
 * Get promoted restaurants (featured)
 */
exports.getPromotedRestaurants = (req, res) => {
  try {
    const promoted = restaurantsData.filter(r => r.promoted === true);
    
    res.json({
      success: true,
      count: promoted.length,
      data: promoted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching promoted restaurants',
      error: error.message
    });
  }
};
