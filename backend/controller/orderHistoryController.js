/**
 * Order History Controller
 * Stores and retrieves order history for users in MongoDB
 */

const { nanoid } = require('nanoid');
const Order = require('../models/Order');

/**
 * Save a new order to MongoDB
 */
const saveOrder = async (req, res) => {
  try {
    const {
      userId,
      platform,
      restaurantId,
      restaurantName,
      items,
      totals,
      paymentMethod
    } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!platform || !restaurantName || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order details'
      });
    }

    // Calculate totals if not provided
    const calculatedTotals = totals || {
      totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
      originalTotal: items.reduce((sum, i) => sum + (i.originalPrice * i.quantity), 0),
      discountedTotal: items.reduce((sum, i) => sum + (i.effectivePrice * i.quantity), 0),
      totalSavings: items.reduce((sum, i) => sum + ((i.originalPrice - i.effectivePrice) * i.quantity), 0)
    };

    const estimatedDelivery = new Date();
    estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 35); // 35 mins from now

    const order = new Order({
      orderId: nanoid(12),
      userId,
      platform,
      restaurantId,
      restaurantName,
      items: items.map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        originalPrice: item.originalPrice,
        effectivePrice: item.effectivePrice,
        offer: item.offer || null
      })),
      totals: calculatedTotals,
      paymentMethod: paymentMethod || 'Not specified',
      status: 'confirmed',
      estimatedDelivery,
      orderDate: new Date()
    });

    const savedOrder = await order.save();

    res.status(201).json({
      success: true,
      message: 'Order saved to history',
      order: savedOrder
    });

  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save order',
      error: error.message
    });
  }
};

/**
 * Get order history from MongoDB
 */
const getOrderHistory = async (req, res) => {
  try {
    const { userId, platform, limit = 50 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const query = { userId };

    // Filter by platform if specified
    if (platform && ['swiggy', 'zomato'].includes(platform)) {
      query.platform = platform;
    }

    // Fetch orders sorted by most recent first
    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .limit(parseInt(limit))
      .exec();

    const totalCount = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      totalOrders: totalCount,
      orders
    });

  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order history',
      error: error.message
    });
  }
};

/**
 * Get a specific order by ID from MongoDB
 */
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });

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
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

/**
 * Update order status in MongoDB
 */
const updateOrderStatus = async (req, res) => {
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

    const order = await Order.findOneAndUpdate(
      { orderId },
      {
        status,
        updatedAt: new Date(),
        ...(status === 'delivered' && { deliveredAt: new Date() })
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order
    });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
};

/**
 * Delete an order from MongoDB
 */
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOneAndDelete({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully',
      order
    });

  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
};

module.exports = {
  saveOrder,
  getOrderHistory,
  getOrderById,
  updateOrderStatus,
  deleteOrder
};
