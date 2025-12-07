// Cart Controller - Manages dual-platform carts (Swiggy & Zomato)

// In-memory cart storage (in production, use database or session)
const carts = {};

// Get or create user cart
const getUserCart = (userId = 'default') => {
  if (!carts[userId]) {
    carts[userId] = {
      swiggy: {
        items: [],
        restaurantId: null,
        restaurantName: null
      },
      zomato: {
        items: [],
        restaurantId: null,
        restaurantName: null
      }
    };
  }
  return carts[userId];
};

// Calculate cart totals
const calculateCartTotals = (cart) => {
  const calculatePlatformTotal = (platformCart) => {
    const subtotal = platformCart.items.reduce((sum, item) => {
      return sum + (item.effectivePrice * item.quantity);
    }, 0);
    
    const originalTotal = platformCart.items.reduce((sum, item) => {
      return sum + (item.originalPrice * item.quantity);
    }, 0);
    
    const totalItems = platformCart.items.reduce((sum, item) => sum + item.quantity, 0);
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      originalTotal: Math.round(originalTotal * 100) / 100,
      savings: Math.round((originalTotal - subtotal) * 100) / 100,
      totalItems
    };
  };
  
  return {
    swiggy: calculatePlatformTotal(cart.swiggy),
    zomato: calculatePlatformTotal(cart.zomato)
  };
};

// Add item to cart
const addToCart = (req, res) => {
  try {
    const { 
      platform, 
      itemId, 
      itemName, 
      originalPrice, 
      effectivePrice, 
      quantity = 1,
      restaurantId,
      restaurantName,
      offer
    } = req.body;
    
    if (!platform || !['swiggy', 'zomato'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be "swiggy" or "zomato"'
      });
    }
    
    if (!itemId || !itemName || originalPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: itemId, itemName, originalPrice'
      });
    }
    
    const userId = req.body.userId || 'default';
    const cart = getUserCart(userId);
    const platformCart = cart[platform];
    
    // Check if adding from different restaurant
    if (platformCart.restaurantId && platformCart.restaurantId !== restaurantId) {
      return res.status(400).json({
        success: false,
        message: `You already have items from ${platformCart.restaurantName} in your ${platform} cart. Clear cart first or order from same restaurant.`,
        currentRestaurant: platformCart.restaurantName
      });
    }
    
    // Set restaurant if cart is empty
    if (!platformCart.restaurantId) {
      platformCart.restaurantId = restaurantId;
      platformCart.restaurantName = restaurantName;
    }
    
    // Check if item already in cart
    const existingItem = platformCart.items.find(item => item.itemId === itemId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      platformCart.items.push({
        itemId,
        itemName,
        originalPrice,
        effectivePrice: effectivePrice !== undefined ? effectivePrice : originalPrice,
        quantity,
        offer: offer || null,
        addedAt: new Date().toISOString()
      });
    }
    
    const totals = calculateCartTotals(cart);
    
    res.json({
      success: true,
      message: `Added ${itemName} to ${platform} cart`,
      cart: {
        ...cart,
        totals
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
};

// Remove item from cart
const removeFromCart = (req, res) => {
  try {
    const { platform, itemId, removeAll = false } = req.body;
    const userId = req.body.userId || 'default';
    
    if (!platform || !['swiggy', 'zomato'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform'
      });
    }
    
    const cart = getUserCart(userId);
    const platformCart = cart[platform];
    
    const itemIndex = platformCart.items.findIndex(item => item.itemId === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }
    
    if (removeAll || platformCart.items[itemIndex].quantity <= 1) {
      platformCart.items.splice(itemIndex, 1);
    } else {
      platformCart.items[itemIndex].quantity -= 1;
    }
    
    // Clear restaurant if cart is empty
    if (platformCart.items.length === 0) {
      platformCart.restaurantId = null;
      platformCart.restaurantName = null;
    }
    
    const totals = calculateCartTotals(cart);
    
    res.json({
      success: true,
      message: 'Item removed from cart',
      cart: {
        ...cart,
        totals
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
};

// Get cart
const getCart = (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const cart = getUserCart(userId);
    const totals = calculateCartTotals(cart);
    
    res.json({
      success: true,
      cart: {
        ...cart,
        totals
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get cart',
      error: error.message
    });
  }
};

// Clear cart (one platform or both)
const clearCart = (req, res) => {
  try {
    const { platform } = req.body; // 'swiggy', 'zomato', or 'all'
    const userId = req.body.userId || 'default';
    
    const cart = getUserCart(userId);
    
    if (platform === 'all' || !platform) {
      cart.swiggy = { items: [], restaurantId: null, restaurantName: null };
      cart.zomato = { items: [], restaurantId: null, restaurantName: null };
    } else if (['swiggy', 'zomato'].includes(platform)) {
      cart[platform] = { items: [], restaurantId: null, restaurantName: null };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform'
      });
    }
    
    const totals = calculateCartTotals(cart);
    
    res.json({
      success: true,
      message: `${platform || 'All'} cart(s) cleared`,
      cart: {
        ...cart,
        totals
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};

// Generate checkout redirect URL
const checkout = (req, res) => {
  try {
    const { platform } = req.body;
    const userId = req.body.userId || 'default';
    
    if (!platform || !['swiggy', 'zomato'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be "swiggy" or "zomato"'
      });
    }
    
    const cart = getUserCart(userId);
    const platformCart = cart[platform];
    
    if (platformCart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Your ${platform} cart is empty`
      });
    }
    
    const totals = calculateCartTotals(cart);
    
    // Generate deep link URLs for actual apps
    // These are the actual deep link schemes for Swiggy and Zomato
    let redirectUrl, webUrl, appScheme;
    
    if (platform === 'swiggy') {
      // Swiggy deep links
      appScheme = 'swiggy://';
      webUrl = `https://www.swiggy.com/restaurants/${platformCart.restaurantId}`;
      redirectUrl = `swiggy://restaurant/${platformCart.restaurantId}`;
    } else {
      // Zomato deep links
      appScheme = 'zomato://';
      webUrl = `https://www.zomato.com/restaurant/${platformCart.restaurantId}`;
      redirectUrl = `zomato://restaurant/${platformCart.restaurantId}`;
    }
    
    // Create order summary for reference
    const orderSummary = {
      platform,
      restaurant: {
        id: platformCart.restaurantId,
        name: platformCart.restaurantName
      },
      items: platformCart.items.map(item => ({
        name: item.itemName,
        quantity: item.quantity,
        price: item.effectivePrice
      })),
      totals: totals[platform],
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: `Redirecting to ${platform} for payment`,
      checkout: {
        platform,
        redirectUrl,      // Deep link for app
        webUrl,           // Web fallback
        appScheme,        // App scheme for detection
        orderSummary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process checkout',
      error: error.message
    });
  }
};

// Update item quantity
const updateQuantity = (req, res) => {
  try {
    const { platform, itemId, quantity } = req.body;
    const userId = req.body.userId || 'default';
    
    if (!platform || !['swiggy', 'zomato'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform'
      });
    }
    
    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be negative'
      });
    }
    
    const cart = getUserCart(userId);
    const platformCart = cart[platform];
    
    const item = platformCart.items.find(item => item.itemId === itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }
    
    if (quantity === 0) {
      // Remove item
      const index = platformCart.items.indexOf(item);
      platformCart.items.splice(index, 1);
      
      if (platformCart.items.length === 0) {
        platformCart.restaurantId = null;
        platformCart.restaurantName = null;
      }
    } else {
      item.quantity = quantity;
    }
    
    const totals = calculateCartTotals(cart);
    
    res.json({
      success: true,
      message: 'Quantity updated',
      cart: {
        ...cart,
        totals
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update quantity',
      error: error.message
    });
  }
};

module.exports = {
  addToCart,
  removeFromCart,
  getCart,
  clearCart,
  checkout,
  updateQuantity
};
