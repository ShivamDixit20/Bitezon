/**
 * Compare Controller
 * Fetches data from Swiggy and Zomato, normalizes it, and compares prices/deals
 */

const swiggyRestaurants = require('../data/restaurant');
const swiggyMenu = require('../data/menu');
const zomatoRestaurants = require('../data/zomatoRestaurant');
const zomatoMenu = require('../data/zomatoMenu');

/**
 * Parse discount string to get discount percentage or flat amount
 * Returns { type: 'percent' | 'flat', value: number, maxDiscount?: number }
 */
const parseDiscount = (offerString) => {
  if (!offerString) return null;
  
  const offer = offerString.toLowerCase();
  
  // Match patterns like "30% OFF up to ₹75"
  const percentMatch = offer.match(/(\d+)%\s*off/i);
  const upToMatch = offer.match(/up\s*to\s*₹?(\d+)/i);
  
  // Match patterns like "Flat ₹100 OFF"
  const flatMatch = offer.match(/flat\s*₹?(\d+)/i);
  
  // Match patterns like "₹50 OFF"
  const directFlatMatch = offer.match(/₹(\d+)\s*off/i);
  
  if (percentMatch) {
    return {
      type: 'percent',
      value: parseInt(percentMatch[1]),
      maxDiscount: upToMatch ? parseInt(upToMatch[1]) : null
    };
  }
  
  if (flatMatch) {
    return {
      type: 'flat',
      value: parseInt(flatMatch[1])
    };
  }
  
  if (directFlatMatch) {
    return {
      type: 'flat',
      value: parseInt(directFlatMatch[1])
    };
  }
  
  // Handle "Buy 1 Get 1" type offers
  if (offer.includes('buy') && offer.includes('get')) {
    return {
      type: 'bogo',
      value: 50 // Effective 50% off on 2 items
    };
  }
  
  // Handle "Free Delivery"
  if (offer.includes('free delivery')) {
    return {
      type: 'freeDelivery',
      value: 40 // Assume ₹40 delivery saved
    };
  }
  
  return null;
};

/**
 * Calculate effective price after discount
 */
const calculateEffectivePrice = (basePrice, discount, quantity = 1) => {
  if (!discount) return basePrice * quantity;
  
  const totalBasePrice = basePrice * quantity;
  
  switch (discount.type) {
    case 'percent':
      const percentDiscount = (totalBasePrice * discount.value) / 100;
      const actualDiscount = discount.maxDiscount 
        ? Math.min(percentDiscount, discount.maxDiscount) 
        : percentDiscount;
      return totalBasePrice - actualDiscount;
    
    case 'flat':
      return Math.max(0, totalBasePrice - discount.value);
    
    case 'bogo':
      // Buy 1 Get 1: if quantity >= 2, half price on pairs
      const pairs = Math.floor(quantity / 2);
      const singles = quantity % 2;
      return (pairs * basePrice) + (singles * basePrice);
    
    case 'freeDelivery':
      return totalBasePrice; // Price same, but save on delivery
    
    default:
      return totalBasePrice;
  }
};

/**
 * Normalize restaurant data from both platforms
 */
const normalizeRestaurant = (restaurant, platform) => {
  const bestOffer = restaurant.offers && restaurant.offers.length > 0 
    ? restaurant.offers[0] 
    : null;
  
  return {
    id: restaurant.id,
    name: restaurant.name,
    city: restaurant.city,
    rating: restaurant.rating,
    deliveryTime: restaurant.deliveryTime,
    deliveryTimeMinutes: parseInt(restaurant.deliveryTime) || 30,
    cuisines: restaurant.cuisines,
    isVeg: restaurant.isVeg,
    platform,
    offers: restaurant.offers || [],
    bestOffer,
    parsedDiscount: parseDiscount(bestOffer)
  };
};

/**
 * Normalize menu item data from both platforms
 */
const normalizeMenuItem = (item, restaurant, platform) => {
  const bestOffer = restaurant.offers && restaurant.offers.length > 0 
    ? restaurant.offers[0] 
    : null;
  const parsedDiscount = parseDiscount(bestOffer);
  
  return {
    id: item.id,
    restaurantId: item.restaurantId,
    restaurantName: restaurant.name,
    itemName: item.itemName,
    basePrice: item.price,
    category: item.category,
    isVeg: item.isVeg,
    platform,
    offer: bestOffer,
    parsedDiscount,
    effectivePrice: calculateEffectivePrice(item.price, parsedDiscount, 1),
    savings: item.price - calculateEffectivePrice(item.price, parsedDiscount, 1)
  };
};

/**
 * Get all restaurants from both platforms with normalized data
 */
exports.getAllRestaurantsComparison = (req, res) => {
  try {
    const swiggyNormalized = swiggyRestaurants.map(r => normalizeRestaurant(r, 'swiggy'));
    const zomatoNormalized = zomatoRestaurants.map(r => normalizeRestaurant(r, 'zomato'));
    
    // Group by restaurant name for comparison
    const comparison = {};
    
    swiggyNormalized.forEach(r => {
      if (!comparison[r.name]) {
        comparison[r.name] = { name: r.name, city: r.city, cuisines: r.cuisines };
      }
      comparison[r.name].swiggy = r;
    });
    
    zomatoNormalized.forEach(r => {
      if (!comparison[r.name]) {
        comparison[r.name] = { name: r.name, city: r.city, cuisines: r.cuisines };
      }
      comparison[r.name].zomato = r;
    });
    
    // Calculate best platform for each restaurant
    const results = Object.values(comparison).map(comp => {
      let bestPlatform = null;
      let reason = [];
      
      if (comp.swiggy && comp.zomato) {
        // Compare ratings
        if (comp.swiggy.rating > comp.zomato.rating) {
          reason.push(`Higher rating on Swiggy (${comp.swiggy.rating} vs ${comp.zomato.rating})`);
        } else if (comp.zomato.rating > comp.swiggy.rating) {
          reason.push(`Higher rating on Zomato (${comp.zomato.rating} vs ${comp.swiggy.rating})`);
        }
        
        // Compare delivery time
        if (comp.swiggy.deliveryTimeMinutes < comp.zomato.deliveryTimeMinutes) {
          reason.push(`Faster delivery on Swiggy (${comp.swiggy.deliveryTime} vs ${comp.zomato.deliveryTime})`);
          bestPlatform = 'swiggy';
        } else if (comp.zomato.deliveryTimeMinutes < comp.swiggy.deliveryTimeMinutes) {
          reason.push(`Faster delivery on Zomato (${comp.zomato.deliveryTime} vs ${comp.swiggy.deliveryTime})`);
          bestPlatform = 'zomato';
        }
        
        // Compare offers
        const swiggyDiscount = comp.swiggy.parsedDiscount;
        const zomatoDiscount = comp.zomato.parsedDiscount;
        
        if (swiggyDiscount && zomatoDiscount) {
          const swiggyValue = swiggyDiscount.type === 'percent' ? swiggyDiscount.value : swiggyDiscount.value;
          const zomatoValue = zomatoDiscount.type === 'percent' ? zomatoDiscount.value : zomatoDiscount.value;
          
          if (swiggyValue > zomatoValue) {
            reason.push(`Better offer on Swiggy (${comp.swiggy.bestOffer})`);
            bestPlatform = 'swiggy';
          } else if (zomatoValue > swiggyValue) {
            reason.push(`Better offer on Zomato (${comp.zomato.bestOffer})`);
            bestPlatform = 'zomato';
          }
        } else if (swiggyDiscount && !zomatoDiscount) {
          reason.push(`Offer available only on Swiggy`);
          bestPlatform = 'swiggy';
        } else if (zomatoDiscount && !swiggyDiscount) {
          reason.push(`Offer available only on Zomato`);
          bestPlatform = 'zomato';
        }
      }
      
      return {
        ...comp,
        bestPlatform,
        reasons: reason
      };
    });
    
    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error comparing restaurants',
      error: error.message
    });
  }
};

/**
 * Compare menu items across platforms
 */
exports.compareMenuItem = (req, res) => {
  try {
    const { itemName } = req.query;
    
    if (!itemName) {
      return res.status(400).json({
        success: false,
        message: 'Item name is required. Use ?itemName=Chicken Biryani'
      });
    }
    
    const searchTerm = itemName.toLowerCase();
    
    // Find matching items on Swiggy
    const swiggyItems = swiggyMenu
      .filter(item => item.itemName.toLowerCase().includes(searchTerm))
      .map(item => {
        const restaurant = swiggyRestaurants.find(r => r.id === item.restaurantId);
        return normalizeMenuItem(item, restaurant, 'swiggy');
      });
    
    // Find matching items on Zomato
    const zomatoItems = zomatoMenu
      .filter(item => item.itemName.toLowerCase().includes(searchTerm))
      .map(item => {
        const restaurant = zomatoRestaurants.find(r => r.id === item.restaurantId);
        return normalizeMenuItem(item, restaurant, 'zomato');
      });
    
    // Group by item name and restaurant for comparison
    const comparison = {};
    
    [...swiggyItems, ...zomatoItems].forEach(item => {
      const key = `${item.itemName}-${item.restaurantName}`;
      if (!comparison[key]) {
        comparison[key] = {
          itemId: item.id,
          itemName: item.itemName,
          restaurantId: item.restaurantId,
          restaurantName: item.restaurantName,
          category: item.category,
          isVeg: item.isVeg
        };
      }
      comparison[key][item.platform] = {
        itemId: item.id,
        basePrice: item.basePrice,
        originalPrice: item.basePrice,
        offer: item.offer,
        effectivePrice: item.effectivePrice,
        savings: item.savings
      };
    });
    
    // Calculate best deal for each item
    const results = Object.values(comparison).map(comp => {
      let bestDeal = null;
      let savings = 0;
      let reason = '';
      
      if (comp.swiggy && comp.zomato) {
        if (comp.swiggy.effectivePrice < comp.zomato.effectivePrice) {
          bestDeal = 'swiggy';
          savings = comp.zomato.effectivePrice - comp.swiggy.effectivePrice;
          reason = `Save ₹${savings.toFixed(0)} on Swiggy`;
        } else if (comp.zomato.effectivePrice < comp.swiggy.effectivePrice) {
          bestDeal = 'zomato';
          savings = comp.swiggy.effectivePrice - comp.zomato.effectivePrice;
          reason = `Save ₹${savings.toFixed(0)} on Zomato`;
        } else {
          bestDeal = 'same';
          reason = 'Same price on both platforms';
        }
      } else if (comp.swiggy) {
        bestDeal = 'swiggy';
        reason = 'Only available on Swiggy';
      } else if (comp.zomato) {
        bestDeal = 'zomato';
        reason = 'Only available on Zomato';
      }
      
      return {
        ...comp,
        bestDeal,
        savings,
        reason
      };
    });
    
    // Sort by savings (highest first)
    results.sort((a, b) => b.savings - a.savings);
    
    res.json({
      success: true,
      query: itemName,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error comparing menu items',
      error: error.message
    });
  }
};

/**
 * Compare all menu items and find best deals
 */
exports.getBestDeals = (req, res) => {
  try {
    // Get all menu items from both platforms
    const allItems = [];
    
    swiggyMenu.forEach(item => {
      const restaurant = swiggyRestaurants.find(r => r.id === item.restaurantId);
      if (restaurant) {
        allItems.push(normalizeMenuItem(item, restaurant, 'swiggy'));
      }
    });
    
    zomatoMenu.forEach(item => {
      const restaurant = zomatoRestaurants.find(r => r.id === item.restaurantId);
      if (restaurant) {
        allItems.push(normalizeMenuItem(item, restaurant, 'zomato'));
      }
    });
    
    // Group by item name
    const itemGroups = {};
    allItems.forEach(item => {
      const key = item.itemName;
      if (!itemGroups[key]) {
        itemGroups[key] = [];
      }
      itemGroups[key].push(item);
    });
    
    // Find best deal for each item
    const bestDeals = Object.entries(itemGroups).map(([itemName, items]) => {
      const swiggyItem = items.find(i => i.platform === 'swiggy');
      const zomatoItem = items.find(i => i.platform === 'zomato');
      
      let bestDeal = null;
      let priceDifference = 0;
      let percentageSavings = 0;
      
      if (swiggyItem && zomatoItem) {
        const swiggyEffective = swiggyItem.effectivePrice;
        const zomatoEffective = zomatoItem.effectivePrice;
        
        if (swiggyEffective < zomatoEffective) {
          bestDeal = {
            platform: 'swiggy',
            ...swiggyItem,
            competitorPrice: zomatoEffective,
            competitorOffer: zomatoItem.offer
          };
          priceDifference = zomatoEffective - swiggyEffective;
          percentageSavings = ((priceDifference / zomatoEffective) * 100).toFixed(1);
        } else if (zomatoEffective < swiggyEffective) {
          bestDeal = {
            platform: 'zomato',
            ...zomatoItem,
            competitorPrice: swiggyEffective,
            competitorOffer: swiggyItem.offer
          };
          priceDifference = swiggyEffective - zomatoEffective;
          percentageSavings = ((priceDifference / swiggyEffective) * 100).toFixed(1);
        } else {
          // Same price - prefer the one with better offer text or faster delivery
          bestDeal = {
            platform: 'either',
            itemName,
            basePrice: swiggyItem.basePrice,
            effectivePrice: swiggyEffective,
            note: 'Same price on both platforms'
          };
        }
      } else {
        const availableItem = swiggyItem || zomatoItem;
        bestDeal = {
          platform: availableItem.platform,
          ...availableItem,
          note: `Only available on ${availableItem.platform}`
        };
      }
      
      return {
        itemName,
        itemId: items[0].id,
        restaurantId: items[0].restaurantId,
        restaurantName: items[0].restaurantName,
        category: items[0].category,
        isVeg: items[0].isVeg,
        swiggy: swiggyItem ? {
          basePrice: swiggyItem.basePrice,
          offer: swiggyItem.offer,
          effectivePrice: swiggyItem.effectivePrice,
          originalPrice: swiggyItem.basePrice,
          restaurant: swiggyItem.restaurantName,
          restaurantId: swiggyItem.restaurantId,
          itemId: swiggyItem.id
        } : null,
        zomato: zomatoItem ? {
          basePrice: zomatoItem.basePrice,
          offer: zomatoItem.offer,
          effectivePrice: zomatoItem.effectivePrice,
          originalPrice: zomatoItem.basePrice,
          restaurant: zomatoItem.restaurantName,
          restaurantId: zomatoItem.restaurantId,
          itemId: zomatoItem.id
        } : null,
        bestDeal: bestDeal.platform,
        priceDifference,
        percentageSavings: parseFloat(percentageSavings),
        recommendation: priceDifference > 0 
          ? `Order from ${bestDeal.platform.toUpperCase()} to save ₹${priceDifference.toFixed(0)} (${percentageSavings}% less)`
          : 'Same price on both platforms'
      };
    });
    
    // Sort by savings percentage
    bestDeals.sort((a, b) => b.percentageSavings - a.percentageSavings);
    
    // Calculate summary
    const summary = {
      totalItems: bestDeals.length,
      swiggyWins: bestDeals.filter(d => d.bestDeal === 'swiggy').length,
      zomatoWins: bestDeals.filter(d => d.bestDeal === 'zomato').length,
      samePrice: bestDeals.filter(d => d.bestDeal === 'either').length,
      maxSavings: bestDeals.length > 0 ? bestDeals[0] : null,
      totalPotentialSavings: bestDeals.reduce((sum, d) => sum + d.priceDifference, 0)
    };
    
    res.json({
      success: true,
      summary,
      deals: bestDeals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error finding best deals',
      error: error.message
    });
  }
};

/**
 * Compare a specific restaurant across platforms
 */
exports.compareRestaurant = (req, res) => {
  try {
    const { id } = req.params;
    
    const swiggyRestaurant = swiggyRestaurants.find(r => r.id === id);
    const zomatoRestaurant = zomatoRestaurants.find(r => r.id === id);
    
    if (!swiggyRestaurant && !zomatoRestaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found on either platform'
      });
    }
    
    // Get menu items for this restaurant
    const swiggyMenuItems = swiggyMenu
      .filter(item => item.restaurantId === id)
      .map(item => normalizeMenuItem(item, swiggyRestaurant, 'swiggy'));
    
    const zomatoMenuItems = zomatoMenu
      .filter(item => item.restaurantId === id)
      .map(item => normalizeMenuItem(item, zomatoRestaurant, 'zomato'));
    
    // Compare each menu item
    const menuComparison = [];
    const allItemNames = new Set([
      ...swiggyMenuItems.map(i => i.itemName),
      ...zomatoMenuItems.map(i => i.itemName)
    ]);
    
    allItemNames.forEach(itemName => {
      const swiggyItem = swiggyMenuItems.find(i => i.itemName === itemName);
      const zomatoItem = zomatoMenuItems.find(i => i.itemName === itemName);
      
      let bestDeal = 'same';
      let savings = 0;
      
      if (swiggyItem && zomatoItem) {
        if (swiggyItem.effectivePrice < zomatoItem.effectivePrice) {
          bestDeal = 'swiggy';
          savings = zomatoItem.effectivePrice - swiggyItem.effectivePrice;
        } else if (zomatoItem.effectivePrice < swiggyItem.effectivePrice) {
          bestDeal = 'zomato';
          savings = swiggyItem.effectivePrice - zomatoItem.effectivePrice;
        }
      }
      
      menuComparison.push({
        itemId: (swiggyItem || zomatoItem).id,
        itemName,
        isVeg: (swiggyItem || zomatoItem).isVeg,
        category: (swiggyItem || zomatoItem).category,
        swiggy: swiggyItem ? {
          itemId: swiggyItem.id,
          basePrice: swiggyItem.basePrice,
          originalPrice: swiggyItem.basePrice,
          effectivePrice: swiggyItem.effectivePrice,
          offer: swiggyItem.offer
        } : null,
        zomato: zomatoItem ? {
          itemId: zomatoItem.id,
          basePrice: zomatoItem.basePrice,
          originalPrice: zomatoItem.basePrice,
          effectivePrice: zomatoItem.effectivePrice,
          offer: zomatoItem.offer
        } : null,
        bestDeal,
        savings
      });
    });
    
    // Sort by savings
    menuComparison.sort((a, b) => b.savings - a.savings);
    
    res.json({
      success: true,
      restaurant: {
        id,
        name: (swiggyRestaurant || zomatoRestaurant).name,
        city: (swiggyRestaurant || zomatoRestaurant).city
      },
      platformComparison: {
        swiggy: swiggyRestaurant ? normalizeRestaurant(swiggyRestaurant, 'swiggy') : null,
        zomato: zomatoRestaurant ? normalizeRestaurant(zomatoRestaurant, 'zomato') : null
      },
      menuComparison,
      summary: {
        totalItems: menuComparison.length,
        swiggyBetter: menuComparison.filter(i => i.bestDeal === 'swiggy').length,
        zomatoBetter: menuComparison.filter(i => i.bestDeal === 'zomato').length,
        samePrice: menuComparison.filter(i => i.bestDeal === 'same').length,
        totalPotentialSavings: menuComparison.reduce((sum, i) => sum + i.savings, 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error comparing restaurant',
      error: error.message
    });
  }
};
