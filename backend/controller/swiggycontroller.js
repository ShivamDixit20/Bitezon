const { nanoid } = require('nanoid');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

const PLATFORM = 'swiggy';
let orders = [];

const formatRestaurant = (doc) => ({
  id: doc.restaurantId,
  name: doc.name,
  city: doc.city,
  rating: doc.rating,
  deliveryTime: doc.deliveryTime,
  cuisines: doc.cuisines,
  image: doc.image,
  isVeg: doc.isVeg,
  offers: doc.offers,
  costForTwo: doc.costForTwo,
  promoted: doc.promoted
});

const formatMenuItem = (doc) => ({
  id: doc.itemId,
  restaurantId: doc.restaurantId,
  itemName: doc.itemName,
  price: doc.price,
  category: doc.category,
  isVeg: doc.isVeg,
  image: doc.image
});

exports.getAllRestaurants = async (req, res) => {
  try {
    const query = { platform: PLATFORM };
    if (req.query.city) query.city = { $regex: new RegExp('^' + req.query.city + '$', 'i') };
    if (req.query.isVeg !== undefined) query.isVeg = req.query.isVeg === 'true';
    if (req.query.minRating) query.rating = { $gte: parseFloat(req.query.minRating) };
    if (req.query.cuisine) query.cuisines = { $regex: new RegExp(req.query.cuisine, 'i') };
    
    const restaurants = await Restaurant.find(query).lean();
    res.json({ success: true, count: restaurants.length, data: restaurants.map(formatRestaurant) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching restaurants', error: error.message });
  }
};

exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ platform: PLATFORM, restaurantId: req.params.id }).lean();
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, data: formatRestaurant(restaurant) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching restaurant', error: error.message });
  }
};

exports.getMenuByRestaurant = async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;
    const restaurant = await Restaurant.findOne({ platform: PLATFORM, restaurantId }).lean();
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    
    const query = { platform: PLATFORM, restaurantId };
    if (req.query.category) query.category = { $regex: new RegExp('^' + req.query.category + '$', 'i') };
    if (req.query.isVeg !== undefined) query.isVeg = req.query.isVeg === 'true';
    if (req.query.maxPrice) query.price = { $lte: parseFloat(req.query.maxPrice) };
    
    const menu = await MenuItem.find(query).lean();
    res.json({ success: true, restaurant: restaurant.name, count: menu.length, data: menu.map(formatMenuItem) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching menu', error: error.message });
  }
};

exports.getAllMenuItems = async (req, res) => {
  try {
    const query = { platform: PLATFORM };
    if (req.query.isVeg !== undefined) query.isVeg = req.query.isVeg === 'true';
    if (req.query.category) query.category = { $regex: new RegExp('^' + req.query.category + '$', 'i') };
    if (req.query.minPrice) query.price = { ...query.price, $gte: parseFloat(req.query.minPrice) };
    if (req.query.maxPrice) query.price = { ...query.price, $lte: parseFloat(req.query.maxPrice) };
    
    const items = await MenuItem.find(query).lean();
    res.json({ success: true, count: items.length, data: items.map(formatMenuItem) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching menu items', error: error.message });
  }
};

exports.search = async (req, res) => {
  try {
    const searchQuery = req.query.q;
    if (!searchQuery) return res.status(400).json({ success: false, message: 'Search query is required' });
    
    const regex = new RegExp(searchQuery, 'i');
    const matchedRestaurants = await Restaurant.find({
      platform: PLATFORM,
      $or: [{ name: regex }, { city: regex }, { cuisines: regex }]
    }).lean();
    
    const matchedMenuItems = await MenuItem.find({
      platform: PLATFORM,
      $or: [{ itemName: regex }, { category: regex }]
    }).lean();
    
    res.json({
      success: true,
      query: searchQuery,
      results: {
        restaurants: { count: matchedRestaurants.length, data: matchedRestaurants.map(formatRestaurant) },
        menuItems: { count: matchedMenuItems.length, data: matchedMenuItems.map(formatMenuItem) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error performing search', error: error.message });
  }
};

exports.getFilters = async (req, res) => {
  try {
    const cities = await Restaurant.distinct('city', { platform: PLATFORM });
    const cuisines = await Restaurant.distinct('cuisines', { platform: PLATFORM });
    const categories = await MenuItem.distinct('category', { platform: PLATFORM });
    
    res.json({
      success: true,
      filters: {
        cities: cities.sort(),
        cuisines: cuisines.flat().filter((v, i, a) => a.indexOf(v) === i).sort(),
        categories: categories.sort(),
        ratingRanges: [{ label: '4.5+', value: 4.5 }, { label: '4.0+', value: 4.0 }, { label: '3.5+', value: 3.5 }, { label: '3.0+', value: 3.0 }],
        priceRanges: [{ label: 'Under 100', min: 0, max: 100 }, { label: '100-200', min: 100, max: 200 }, { label: '200-300', min: 200, max: 300 }, { label: 'Above 300', min: 300, max: 500 }],
        dietaryPreferences: [{ label: 'Veg Only', value: true }, { label: 'Non-Veg', value: false }]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching filters', error: error.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress } = req.body;
    if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Restaurant ID and items are required' });
    }
    if (!deliveryAddress) return res.status(400).json({ success: false, message: 'Delivery address is required' });
    
    const restaurant = await Restaurant.findOne({ platform: PLATFORM, restaurantId }).lean();
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    
    let total = 0;
    const orderItems = [];
    for (const orderItem of items) {
      const menuItem = await MenuItem.findOne({ platform: PLATFORM, itemId: orderItem.itemId, restaurantId }).lean();
      if (!menuItem) return res.status(404).json({ success: false, message: 'Menu item ' + orderItem.itemId + ' not found' });
      
      const quantity = orderItem.quantity || 1;
      const itemTotal = menuItem.price * quantity;
      total += itemTotal;
      orderItems.push({ ...formatMenuItem(menuItem), quantity, itemTotal });
    }
    
    const order = {
      id: nanoid(10),
      restaurantId,
      restaurantName: restaurant.name,
      items: orderItems,
      deliveryAddress,
      total,
      status: 'placed',
      placedAt: new Date().toISOString(),
      estimatedDelivery: restaurant.deliveryTime
    };
    orders.push(order);
    res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating order', error: error.message });
  }
};

exports.getOrderById = (req, res) => {
  const order = orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, data: order });
};

exports.getAllOrders = (req, res) => {
  res.json({ success: true, count: orders.length, data: orders });
};

exports.updateOrderStatus = (req, res) => {
  const { status } = req.body;
  const validStatuses = ['placed', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  const orderIndex = orders.findIndex(o => o.id === req.params.orderId);
  if (orderIndex === -1) return res.status(404).json({ success: false, message: 'Order not found' });
  orders[orderIndex].status = status;
  orders[orderIndex].updatedAt = new Date().toISOString();
  res.json({ success: true, message: 'Order status updated', data: orders[orderIndex] });
};

exports.cancelOrder = (req, res) => {
  const orderIndex = orders.findIndex(o => o.id === req.params.orderId);
  if (orderIndex === -1) return res.status(404).json({ success: false, message: 'Order not found' });
  if (orders[orderIndex].status === 'delivered') return res.status(400).json({ success: false, message: 'Cannot cancel delivered order' });
  if (orders[orderIndex].status === 'cancelled') return res.status(400).json({ success: false, message: 'Order already cancelled' });
  orders[orderIndex].status = 'cancelled';
  orders[orderIndex].updatedAt = new Date().toISOString();
  res.json({ success: true, message: 'Order cancelled', data: orders[orderIndex] });
};
