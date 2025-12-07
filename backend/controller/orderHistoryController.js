/**
 * Order History Controller
 * Stores and retrieves order history for users
 */

const { nanoid } = require('nanoid');

// In-memory order history storage
// In production, this would be stored in a database
const orderHistory = [];

/**
 * Save a new order to history
 */
const saveOrder = (req, res) => {
  try {
    const {
      platform,
      restaurantId,
      restaurantName,
      items,
      totals,
      paymentMethod
    } = req.body;

    // Validate required fields
    if (!platform || !restaurantName || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order details'
      });
    }

    const order = {
      orderId: nanoid(12),
      platform,
      restaurantId,
      restaurantName,
      items: items.map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        originalPrice: item.originalPrice,
        effectivePrice: item.effectivePrice,
        offer: item.offer
      })),
      totals: {
        totalItems: totals?.totalItems || items.reduce((sum, i) => sum + i.quantity, 0),
        originalTotal: totals?.originalTotal || items.reduce((sum, i) => sum + (i.originalPrice * i.quantity), 0),
        discountedTotal: totals?.discountedTotal || items.reduce((sum, i) => sum + (i.effectivePrice * i.quantity), 0),
        totalSavings: totals?.totalSavings || 0
      },
      paymentMethod: paymentMethod || 'Not specified',
      status: 'confirmed',
      orderDate: new Date().toISOString(),
      estimatedDelivery: getEstimatedDelivery()
    };

    // Add to history (at the beginning for most recent first)
    orderHistory.unshift(order);

    res.status(201).json({
      success: true,
      message: 'Order saved to history',
      order
    });

  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save order'
    });
  }
};

/**
 * Get order history
 */
const getOrderHistory = (req, res) => {
  try {
    const { platform, limit } = req.query;
    
    let orders = [...orderHistory];
    
    // Filter by platform if specified
    if (platform && ['swiggy', 'zomato'].includes(platform)) {
      orders = orders.filter(o => o.platform === platform);
    }
    
    // Limit results if specified
    if (limit && !isNaN(parseInt(limit))) {
      orders = orders.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      count: orders.length,
      totalOrders: orderHistory.length,
      orders
    });

  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order history'
    });
  }
};

/**
 * Get a specific order by ID
 */
const getOrderById = (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = orderHistory.find(o => o.orderId === orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
};

/**
 * Update order status (for tracking)
 */
const updateOrderStatus = (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const orderIndex = orderHistory.findIndex(o => o.orderId === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    orderHistory[orderIndex].status = status;
    orderHistory[orderIndex].updatedAt = new Date().toISOString();
    
    if (status === 'delivered') {
      orderHistory[orderIndex].deliveredAt = new Date().toISOString();
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: orderHistory[orderIndex]
    });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order'
    });
  }
};

/**
 * Clear order history (for testing)
 */
const clearHistory = (req, res) => {
  orderHistory.length = 0;
  res.json({
    success: true,
    message: 'Order history cleared'
  });
};

/**
 * Get estimated delivery time (30-45 mins from now)
 */
const getEstimatedDelivery = () => {
  const now = new Date();
  const minDelivery = new Date(now.getTime() + 30 * 60000);
  const maxDelivery = new Date(now.getTime() + 45 * 60000);
  
  return {
    min: minDelivery.toISOString(),
    max: maxDelivery.toISOString(),
    display: '30-45 mins'
  };
};

module.exports = {
  saveOrder,
  getOrderHistory,
  getOrderById,
  updateOrderStatus,
  clearHistory
};
