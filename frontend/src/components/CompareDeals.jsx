import { useState } from 'react';

const API_BASE = 'http://localhost:3000/api/compare';
const CART_API = 'http://localhost:3000/api/cart';

function CompareDeals({ onCartUpdate }) {
  const [bestDeals, setBestDeals] = useState(null);
  const [restaurantComparison, setRestaurantComparison] = useState(null);
  const [menuSearch, setMenuSearch] = useState(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  
  const [searchItemName, setSearchItemName] = useState('');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('1');

  const clearResults = () => {
    setBestDeals(null);
    setRestaurantComparison(null);
    setMenuSearch(null);
    setError('');
  };

  // Add item to cart
  const addToCart = async (platform, item, restaurant) => {
    try {
      setCartMessage('');
      const response = await fetch(`${CART_API}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          itemId: item.itemId || item.id,
          itemName: item.itemName || item.name,
          originalPrice: item.originalPrice || item.price,
          effectivePrice: item.effectivePrice || item.price,
          quantity: 1,
          restaurantId: restaurant?.id || item.restaurantId,
          restaurantName: restaurant?.name || item.restaurantName,
          offer: item.offer || null
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCartMessage(`✅ Added ${item.itemName || item.name} to ${platform === 'swiggy' ? '🟧 Swiggy' : '🔴 Zomato'} cart!`);
        if (onCartUpdate) {
          onCartUpdate(data.cart);
        }
        // Clear message after 3 seconds
        setTimeout(() => setCartMessage(''), 3000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to add to cart: ' + err.message);
    }
  };

  // Add best deal to cart (winner platform)
  const addBestDealToCart = async (deal) => {
    const platform = deal.bestDeal === 'either' ? 'swiggy' : deal.bestDeal;
    const item = {
      itemId: deal.itemId,
      itemName: deal.itemName,
      originalPrice: deal[platform]?.originalPrice || deal[platform]?.effectivePrice,
      effectivePrice: deal[platform]?.effectivePrice,
      offer: deal[platform]?.offer,
      restaurantId: deal.restaurantId,
      restaurantName: deal.restaurantName
    };
    await addToCart(platform, item, { id: deal.restaurantId, name: deal.restaurantName });
  };

  // Fetch best deals across all items
  const fetchBestDeals = async () => {
    setLoading('bestDeals');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/best-deals`);
      const data = await res.json();
      
      if (data.success) {
        setBestDeals(data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading('');
  };

  // Compare a specific restaurant
  const fetchRestaurantComparison = async () => {
    setLoading('restaurant');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/restaurants/${selectedRestaurantId}`);
      const data = await res.json();
      
      if (data.success) {
        setRestaurantComparison(data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading('');
  };

  // Search and compare a specific menu item
  const searchMenuItem = async () => {
    if (!searchItemName.trim()) {
      setError('Please enter an item name to search');
      return;
    }
    setLoading('menuSearch');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/menu?itemName=${encodeURIComponent(searchItemName)}`);
      const data = await res.json();
      
      if (data.success) {
        setMenuSearch(data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading('');
  };

  const getPlatformBadge = (platform) => {
    if (platform === 'swiggy') {
      return <span className="badge swiggy-badge">🍔 Swiggy</span>;
    } else if (platform === 'zomato') {
      return <span className="badge zomato-badge">🍕 Zomato</span>;
    } else {
      return <span className="badge neutral-badge">🤝 Either</span>;
    }
  };

  return (
    <div className="compare-deals">
      <h1>⚖️ Compare Deals</h1>
      <p className="subtitle">Find the best prices across Swiggy and Zomato</p>
      
      {error && <div className="error-box">❌ {error}</div>}
      {cartMessage && <div className="cart-message">{cartMessage}</div>}
      
      <button className="clear-btn" onClick={clearResults}>Clear All Results</button>

      {/* Best Deals Section */}
      <section className="compare-section">
        <h2>🏆 Best Deals Across All Items</h2>
        <p>Compare all menu items and find where to order for maximum savings</p>
        <button onClick={fetchBestDeals} disabled={loading === 'bestDeals'}>
          {loading === 'bestDeals' ? 'Analyzing...' : 'Find Best Deals'}
        </button>
        
        {bestDeals && (
          <div className="results">
            {/* Summary Cards */}
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-number">{bestDeals.summary.totalItems}</div>
                <div className="summary-label">Total Items</div>
              </div>
              <div className="summary-card swiggy-win">
                <div className="summary-number">{bestDeals.summary.swiggyWins}</div>
                <div className="summary-label">Swiggy Wins</div>
              </div>
              <div className="summary-card zomato-win">
                <div className="summary-number">{bestDeals.summary.zomatoWins}</div>
                <div className="summary-label">Zomato Wins</div>
              </div>
              <div className="summary-card savings">
                <div className="summary-number">₹{bestDeals.summary.totalPotentialSavings.toFixed(0)}</div>
                <div className="summary-label">Total Potential Savings</div>
              </div>
            </div>

            {/* Deals Table */}
            <h3>📊 Item-by-Item Comparison</h3>
            <div className="deals-table">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Swiggy Price</th>
                    <th>Zomato Price</th>
                    <th>Best Deal</th>
                    <th>Savings</th>
                    <th>Add to Cart</th>
                  </tr>
                </thead>
                <tbody>
                  {bestDeals.deals.map((deal, index) => (
                    <tr key={index} className={deal.bestDeal !== 'either' ? 'has-winner' : ''}>
                      <td>
                        <span className={deal.isVeg ? 'veg-dot' : 'non-veg-dot'}>●</span>
                        {deal.itemName}
                      </td>
                      <td>{deal.category}</td>
                      <td className={deal.bestDeal === 'swiggy' ? 'winner-cell' : ''}>
                        {deal.swiggy ? (
                          <>
                            <div className="price">₹{deal.swiggy.effectivePrice.toFixed(0)}</div>
                            {deal.swiggy.offer && <div className="offer-tag">{deal.swiggy.offer}</div>}
                          </>
                        ) : '-'}
                      </td>
                      <td className={deal.bestDeal === 'zomato' ? 'winner-cell' : ''}>
                        {deal.zomato ? (
                          <>
                            <div className="price">₹{deal.zomato.effectivePrice.toFixed(0)}</div>
                            {deal.zomato.offer && <div className="offer-tag">{deal.zomato.offer}</div>}
                          </>
                        ) : '-'}
                      </td>
                      <td>{getPlatformBadge(deal.bestDeal)}</td>
                      <td className="savings-cell">
                        {deal.priceDifference > 0 ? (
                          <>
                            <div className="savings-amount">₹{deal.priceDifference.toFixed(0)}</div>
                            <div className="savings-percent">{deal.percentageSavings}% off</div>
                          </>
                        ) : (
                          <span className="same-price">Same</span>
                        )}
                      </td>
                      <td className="cart-actions-cell">
                        <div className="cart-buttons">
                          {deal.swiggy && (
                            <button
                              className="cart-btn swiggy-cart-btn"
                              onClick={() => addToCart('swiggy', {
                                itemId: deal.itemId,
                                itemName: deal.itemName,
                                originalPrice: deal.swiggy.originalPrice || deal.swiggy.effectivePrice,
                                effectivePrice: deal.swiggy.effectivePrice,
                                offer: deal.swiggy.offer,
                                restaurantId: deal.restaurantId,
                                restaurantName: deal.restaurantName
                              }, { id: deal.restaurantId, name: deal.restaurantName })}
                              title="Add to Swiggy Cart"
                            >
                              🟧
                            </button>
                          )}
                          {deal.zomato && (
                            <button
                              className="cart-btn zomato-cart-btn"
                              onClick={() => addToCart('zomato', {
                                itemId: deal.itemId,
                                itemName: deal.itemName,
                                originalPrice: deal.zomato.originalPrice || deal.zomato.effectivePrice,
                                effectivePrice: deal.zomato.effectivePrice,
                                offer: deal.zomato.offer,
                                restaurantId: deal.restaurantId,
                                restaurantName: deal.restaurantName
                              }, { id: deal.restaurantId, name: deal.restaurantName })}
                              title="Add to Zomato Cart"
                            >
                              🔴
                            </button>
                          )}
                          {deal.bestDeal !== 'either' && (
                            <button
                              className="cart-btn best-deal-btn"
                              onClick={() => addBestDealToCart(deal)}
                              title="Add Best Deal to Cart"
                            >
                              🏆
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Restaurant Comparison Section */}
      <section className="compare-section">
        <h2>🏪 Compare Restaurant</h2>
        <p>See how a restaurant's prices differ between platforms</p>
        <div className="filter-row">
          <select value={selectedRestaurantId} onChange={(e) => setSelectedRestaurantId(e.target.value)}>
            <option value="1">1 - Biryani Palace</option>
            <option value="2">2 - Pizza Hub</option>
            <option value="3">3 - South Spice</option>
            <option value="4">4 - Burger Street</option>
            <option value="5">5 - Sushi Central</option>
            <option value="6">6 - Green Leaf Salads</option>
            <option value="7">7 - Taco Town</option>
            <option value="8">8 - Pasta Pavilion</option>
            <option value="9">9 - BBQ Barn</option>
            <option value="10">10 - The Vegan Bowl</option>
            <option value="11">11 - Noodle Nook</option>
            <option value="12">12 - Wrap & Roll</option>
            <option value="13">13 - Dessert Dreams</option>
            <option value="14">14 - Kebab Corner</option>
          </select>
          <button onClick={fetchRestaurantComparison} disabled={loading === 'restaurant'}>
            {loading === 'restaurant' ? 'Comparing...' : 'Compare Restaurant'}
          </button>
        </div>
        
        {restaurantComparison && (
          <div className="results">
            <h3>{restaurantComparison.restaurant.name} - {restaurantComparison.restaurant.city}</h3>
            
            {/* Platform Cards */}
            <div className="platform-comparison">
              {restaurantComparison.platformComparison.swiggy && (
                <div className="platform-card swiggy-card">
                  <h4>🍔 Swiggy</h4>
                  <div className="platform-stats">
                    <div>⭐ {restaurantComparison.platformComparison.swiggy.rating}</div>
                    <div>🕐 {restaurantComparison.platformComparison.swiggy.deliveryTime}</div>
                    {restaurantComparison.platformComparison.swiggy.bestOffer && (
                      <div className="offer">🎉 {restaurantComparison.platformComparison.swiggy.bestOffer}</div>
                    )}
                  </div>
                </div>
              )}
              {restaurantComparison.platformComparison.zomato && (
                <div className="platform-card zomato-card">
                  <h4>🍕 Zomato</h4>
                  <div className="platform-stats">
                    <div>⭐ {restaurantComparison.platformComparison.zomato.rating}</div>
                    <div>🕐 {restaurantComparison.platformComparison.zomato.deliveryTime}</div>
                    {restaurantComparison.platformComparison.zomato.bestOffer && (
                      <div className="offer">🎉 {restaurantComparison.platformComparison.zomato.bestOffer}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="restaurant-summary">
              <span className="swiggy-better">Swiggy Better: {restaurantComparison.summary.swiggyBetter}</span>
              <span className="zomato-better">Zomato Better: {restaurantComparison.summary.zomatoBetter}</span>
              <span className="same">Same Price: {restaurantComparison.summary.samePrice}</span>
              <span className="total-savings">Potential Savings: ₹{restaurantComparison.summary.totalPotentialSavings.toFixed(0)}</span>
            </div>

            {/* Menu Comparison */}
            <h4>Menu Items Comparison</h4>
            <div className="menu-comparison-grid">
              {restaurantComparison.menuComparison.map((item, index) => (
                <div key={index} className={`menu-comparison-item ${item.bestDeal !== 'same' ? item.bestDeal + '-better' : ''}`}>
                  <div className="item-header">
                    <span className={item.isVeg ? 'veg-dot' : 'non-veg-dot'}>●</span>
                    <span className="item-name">{item.itemName}</span>
                    {item.savings > 0 && <span className="item-savings">Save ₹{item.savings.toFixed(0)}</span>}
                  </div>
                  <div className="item-prices">
                    <div className={`price-box ${item.bestDeal === 'swiggy' ? 'winner' : ''}`}>
                      <span className="platform-label">Swiggy</span>
                      <span className="price-value">₹{item.swiggy?.effectivePrice.toFixed(0) || '-'}</span>
                    </div>
                    <div className={`price-box ${item.bestDeal === 'zomato' ? 'winner' : ''}`}>
                      <span className="platform-label">Zomato</span>
                      <span className="price-value">₹{item.zomato?.effectivePrice.toFixed(0) || '-'}</span>
                    </div>
                  </div>
                  <div className="item-cart-actions">
                    {item.swiggy && (
                      <button
                        className="cart-btn swiggy-cart-btn"
                        onClick={() => addToCart('swiggy', {
                          itemId: item.itemId,
                          itemName: item.itemName,
                          originalPrice: item.swiggy.originalPrice || item.swiggy.effectivePrice,
                          effectivePrice: item.swiggy.effectivePrice,
                          offer: item.swiggy.offer,
                          restaurantId: restaurantComparison.restaurant.id,
                          restaurantName: restaurantComparison.restaurant.name
                        }, restaurantComparison.restaurant)}
                      >
                        🟧 Add to Swiggy
                      </button>
                    )}
                    {item.zomato && (
                      <button
                        className="cart-btn zomato-cart-btn"
                        onClick={() => addToCart('zomato', {
                          itemId: item.itemId,
                          itemName: item.itemName,
                          originalPrice: item.zomato.originalPrice || item.zomato.effectivePrice,
                          effectivePrice: item.zomato.effectivePrice,
                          offer: item.zomato.offer,
                          restaurantId: restaurantComparison.restaurant.id,
                          restaurantName: restaurantComparison.restaurant.name
                        }, restaurantComparison.restaurant)}
                      >
                        🔴 Add to Zomato
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Search Item Section */}
      <section className="compare-section">
        <h2>🔍 Search & Compare Item</h2>
        <p>Search for a specific item and compare prices</p>
        <div className="filter-row">
          <input
            type="text"
            placeholder="Enter item name (e.g., Biryani, Pizza, Burger)"
            value={searchItemName}
            onChange={(e) => setSearchItemName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchMenuItem()}
          />
          <button onClick={searchMenuItem} disabled={loading === 'menuSearch'}>
            {loading === 'menuSearch' ? 'Searching...' : 'Search & Compare'}
          </button>
        </div>
        
        {menuSearch && (
          <div className="results">
            <h3>Results for "{menuSearch.query}" ({menuSearch.count} found)</h3>
            <div className="search-results">
              {menuSearch.data.map((item, index) => (
                <div key={index} className="search-result-card">
                  <div className="result-header">
                    <span className={item.isVeg ? 'veg-dot' : 'non-veg-dot'}>●</span>
                    <span className="result-name">{item.itemName}</span>
                    <span className="result-restaurant">@ {item.restaurantName}</span>
                  </div>
                  <div className="result-comparison">
                    <div className={`result-platform ${item.bestDeal === 'swiggy' ? 'winner' : ''}`}>
                      <div className="platform-name">Swiggy</div>
                      {item.swiggy ? (
                        <>
                          <div className="result-price">₹{item.swiggy.effectivePrice.toFixed(0)}</div>
                          {item.swiggy.offer && <div className="result-offer">{item.swiggy.offer}</div>}
                        </>
                      ) : <div className="not-available">N/A</div>}
                    </div>
                    <div className="vs">VS</div>
                    <div className={`result-platform ${item.bestDeal === 'zomato' ? 'winner' : ''}`}>
                      <div className="platform-name">Zomato</div>
                      {item.zomato ? (
                        <>
                          <div className="result-price">₹{item.zomato.effectivePrice.toFixed(0)}</div>
                          {item.zomato.offer && <div className="result-offer">{item.zomato.offer}</div>}
                        </>
                      ) : <div className="not-available">N/A</div>}
                    </div>
                  </div>
                  <div className="result-verdict">
                    {getPlatformBadge(item.bestDeal)}
                    <span className="verdict-text">{item.reason}</span>
                  </div>
                  <div className="result-cart-actions">
                    {item.swiggy && (
                      <button
                        className="cart-btn swiggy-cart-btn"
                        onClick={() => addToCart('swiggy', {
                          itemId: item.itemId,
                          itemName: item.itemName,
                          originalPrice: item.swiggy.originalPrice || item.swiggy.effectivePrice,
                          effectivePrice: item.swiggy.effectivePrice,
                          offer: item.swiggy.offer,
                          restaurantId: item.restaurantId,
                          restaurantName: item.restaurantName
                        }, { id: item.restaurantId, name: item.restaurantName })}
                      >
                        🟧 Swiggy
                      </button>
                    )}
                    {item.zomato && (
                      <button
                        className="cart-btn zomato-cart-btn"
                        onClick={() => addToCart('zomato', {
                          itemId: item.itemId,
                          itemName: item.itemName,
                          originalPrice: item.zomato.originalPrice || item.zomato.effectivePrice,
                          effectivePrice: item.zomato.effectivePrice,
                          offer: item.zomato.offer,
                          restaurantId: item.restaurantId,
                          restaurantName: item.restaurantName
                        }, { id: item.restaurantId, name: item.restaurantName })}
                      >
                        🔴 Zomato
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <style>{`
        .compare-deals {
          max-width: 1100px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .compare-deals h1 {
          text-align: center;
          color: #2c3e50;
          font-size: 2.4rem;
        }
        .subtitle {
          text-align: center;
          color: #666;
          margin-bottom: 20px;
          font-size: 1.2rem;
        }
        .error-box {
          background: #fee;
          border: 1px solid #f99;
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 15px;
          color: #c00;
        }
        .cart-message {
          background: #e8f5e9;
          border: 1px solid #4caf50;
          padding: 12px 20px;
          border-radius: 8px;
          margin-bottom: 15px;
          color: #2e7d32;
          font-weight: 500;
          text-align: center;
          animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .clear-btn {
          background: #666;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 5px;
          cursor: pointer;
          margin-bottom: 20px;
        }
        .compare-section {
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 25px;
        }
        .compare-section h2 {
          margin-top: 0;
          color: #2c3e50;
          border-bottom: 3px solid #3498db;
          padding-bottom: 10px;
          font-size: 1.8rem;
        }
        .compare-section p {
          color: #666;
          margin-bottom: 15px;
          font-size: 1.1rem;
        }
        .filter-row {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }
        .filter-row input, .filter-row select {
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 8px;
          flex: 1;
          min-width: 200px;
          font-size: 16px;
        }
        button {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          font-size: '16px';
          transition: transform 0.2s;
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .results {
          margin-top: 20px;
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        /* Summary Grid */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
        }
        .summary-card {
          background: #f8f9fa;
          border-radius: 10px;
          padding: 20px;
          text-align: center;
        }
        .summary-number {
          font-size: 2rem;
          font-weight: bold;
          color: #2c3e50;
        }
        .summary-label {
          color: #666;
          font-size: 0.9rem;
        }
        .summary-card.swiggy-win {
          background: #fff5eb;
          border: 2px solid #fc8019;
        }
        .summary-card.swiggy-win .summary-number { color: #fc8019; }
        .summary-card.zomato-win {
          background: #fff5f5;
          border: 2px solid #e23744;
        }
        .summary-card.zomato-win .summary-number { color: #e23744; }
        .summary-card.savings {
          background: #e8f5e9;
          border: 2px solid #4caf50;
        }
        .summary-card.savings .summary-number { color: #4caf50; }
        
        /* Table Styles */
        .deals-table {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
          font-size: 15px;
        }
        th {
          background: #f8f9fa;
          font-weight: 600;
          color: #2c3e50;
          font-size: 16px;
        }
        tr:hover {
          background: #f8f9fa;
        }
        .veg-dot { color: #0f9d58; margin-right: 5px; }
        .non-veg-dot { color: #db4437; margin-right: 5px; }
        .price { font-weight: 600; }
        .offer-tag {
          font-size: 0.75rem;
          color: #666;
          margin-top: 3px;
        }
        .winner-cell {
          background: #e8f5e9 !important;
        }
        .savings-cell {
          text-align: center;
        }
        .savings-amount {
          font-weight: bold;
          color: #4caf50;
        }
        .savings-percent {
          font-size: 0.8rem;
          color: #666;
        }
        .same-price {
          color: #999;
        }
        
        /* Badges */
        .badge {
          padding: 4px 10px;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .swiggy-badge {
          background: #fff5eb;
          color: #fc8019;
          border: 1px solid #fc8019;
        }
        .zomato-badge {
          background: #fff5f5;
          color: #e23744;
          border: 1px solid #e23744;
        }
        .neutral-badge {
          background: #f0f0f0;
          color: #666;
          border: 1px solid #ccc;
        }
        
        /* Platform Comparison */
        .platform-comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .platform-card {
          padding: 20px;
          border-radius: 10px;
          text-align: center;
        }
        .platform-card h4 {
          margin: 0 0 15px;
          font-size: 1.2rem;
        }
        .swiggy-card {
          background: #fff5eb;
          border: 2px solid #fc8019;
        }
        .zomato-card {
          background: #fff5f5;
          border: 2px solid #e23744;
        }
        .platform-stats {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .platform-stats .offer {
          background: white;
          padding: 5px 10px;
          border-radius: 5px;
          font-size: 0.85rem;
        }
        
        /* Restaurant Summary */
        .restaurant-summary {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .restaurant-summary span {
          padding: 5px 12px;
          border-radius: 5px;
          font-size: 0.9rem;
        }
        .swiggy-better { background: #fff5eb; color: #fc8019; }
        .zomato-better { background: #fff5f5; color: #e23744; }
        .same { background: #f0f0f0; color: #666; }
        .total-savings { background: #e8f5e9; color: #4caf50; font-weight: bold; }
        
        /* Menu Comparison Grid */
        .menu-comparison-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 15px;
        }
        .menu-comparison-item {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          background: white;
        }
        .menu-comparison-item.swiggy-better {
          border-left: 4px solid #fc8019;
        }
        .menu-comparison-item.zomato-better {
          border-left: 4px solid #e23744;
        }
        .item-header {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 10px;
        }
        .item-name {
          font-weight: 600;
          flex: 1;
        }
        .item-savings {
          background: #e8f5e9;
          color: #4caf50;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .item-prices {
          display: flex;
          gap: 10px;
        }
        .price-box {
          flex: 1;
          text-align: center;
          padding: 8px;
          border-radius: 5px;
          background: #f8f9fa;
        }
        .price-box.winner {
          background: #e8f5e9;
          border: 1px solid #4caf50;
        }
        .platform-label {
          font-size: 0.75rem;
          color: #666;
          display: block;
        }
        .price-value {
          font-weight: bold;
          font-size: 1.1rem;
        }
        
        /* Search Results */
        .search-results {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .search-result-card {
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 20px;
          background: white;
        }
        .result-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 15px;
        }
        .result-name {
          font-weight: 600;
          font-size: 1.3rem;
        }
        .result-restaurant {
          color: #666;
          font-size: 1.05rem;
        }
        .result-comparison {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }
        .result-platform {
          flex: 1;
          text-align: center;
          padding: 15px;
          border-radius: 8px;
          background: #f8f9fa;
        }
        .result-platform.winner {
          background: #e8f5e9;
          border: 2px solid #4caf50;
        }
        .platform-name {
          font-weight: 600;
          margin-bottom: 5px;
        }
        .result-price {
          font-size: 1.8rem;
          font-weight: bold;
          color: #2c3e50;
        }
        .result-offer {
          font-size: 0.95rem;
          color: #666;
          margin-top: 5px;
        }
        .not-available {
          color: #999;
        }
        .vs {
          font-weight: bold;
          color: #999;
        }
        .result-verdict {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }
        .verdict-text {
          color: #666;
        }

        /* Cart Button Styles */
        .cart-actions-cell {
          padding: 8px !important;
        }
        .cart-buttons {
          display: flex;
          gap: 6px;
          justify-content: center;
        }
        .cart-btn {
          padding: 6px 10px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 15px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .cart-btn:hover {
          transform: scale(1.1);
        }
        .swiggy-cart-btn {
          background: linear-gradient(135deg, #fc8019 0%, #e67316 100%);
          color: white;
        }
        .zomato-cart-btn {
          background: linear-gradient(135deg, #e23744 0%, #cb3037 100%);
          color: white;
        }
        .best-deal-btn {
          background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
          color: white;
        }
        .item-cart-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          flex-wrap: wrap;
        }
        .item-cart-actions .cart-btn {
          flex: 1;
          justify-content: center;
          padding: 8px 12px;
        }
        .result-cart-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #eee;
        }
        .result-cart-actions .cart-btn {
          flex: 1;
          justify-content: center;
          padding: 10px 15px;
        }
      `}</style>
    </div>
  );
}

export default CompareDeals;
