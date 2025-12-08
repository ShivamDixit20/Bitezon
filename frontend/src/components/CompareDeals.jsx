import { useState } from 'react';

const API_BASE = 'http://localhost:3000/api/compare';
const CART_API = 'http://localhost:3000/api/cart';

function CompareDeals({ onCartUpdate }) {
  const [restaurantComparison, setRestaurantComparison] = useState(null);
  const [menuSearch, setMenuSearch] = useState(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  
  const [searchItemName, setSearchItemName] = useState('');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('1');

  const clearResults = () => {
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
        setCartMessage(`Added ${item.itemName || item.name} to cart!`);
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

  return (
    <div className="compare-deals">
      <h1>Compare Deals</h1>
      <p className="subtitle">Find the best prices across Swiggy and Zomato</p>
      
      {error && <div className="error-box">{error}</div>}
      {cartMessage && <div className="cart-message">{cartMessage}</div>}
      
      <button className="clear-btn" onClick={clearResults}>Clear All Results</button>

      {/* Restaurant Comparison Section */}
      <section className="compare-section">
        <h2>Compare Restaurant</h2>
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
                  <h4>Swiggy</h4>
                  <div className="platform-stats">
                    <div>Rating: {restaurantComparison.platformComparison.swiggy.rating}</div>
                    <div>Delivery: {restaurantComparison.platformComparison.swiggy.deliveryTime}</div>
                    {restaurantComparison.platformComparison.swiggy.bestOffer && (
                      <div className="offer">{restaurantComparison.platformComparison.swiggy.bestOffer}</div>
                    )}
                  </div>
                </div>
              )}
              {restaurantComparison.platformComparison.zomato && (
                <div className="platform-card zomato-card">
                  <h4>Zomato</h4>
                  <div className="platform-stats">
                    <div>Rating: {restaurantComparison.platformComparison.zomato.rating}</div>
                    <div>Delivery: {restaurantComparison.platformComparison.zomato.deliveryTime}</div>
                    {restaurantComparison.platformComparison.zomato.bestOffer && (
                      <div className="offer">{restaurantComparison.platformComparison.zomato.bestOffer}</div>
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
                        Add to Swiggy
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
                        Add to Zomato
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
        <h2>Search & Compare Item</h2>
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
                  <div className="result-content">
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
                        Add to Swiggy
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
                        Add to Zomato
                      </button>
                    )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <style>{`
        .compare-deals {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .compare-deals h1 {
          text-align: center;
          color: rgb(239, 79, 95);
          font-size: 2.2rem;
          margin: 0 0 8px 0;
          font-weight: 800;
        }
        .subtitle {
          text-align: center;
          color: #666;
          margin-bottom: 28px;
          font-size: 1rem;
        }
        .error-box {
          background: #ffebee;
          border: 1px solid #ef5350;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 16px;
          color: #c62828;
          font-weight: 500;
        }
        .cart-message {
          background: #e8f5e9;
          border: 1px solid #4caf50;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 16px;
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
          background: rgb(239, 79, 95);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          margin-bottom: 24px;
          transition: background 0.2s;
        }
        .clear-btn:hover {
          background: #e85a73;
        }
        .compare-section {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          padding: 28px;
          margin-bottom: 28px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .compare-section h2 {
          margin-top: 0;
          margin-bottom: 8px;
          color: rgb(239, 79, 95);
          border-bottom: 3px solid rgb(239, 79, 95);
          padding-bottom: 12px;
          font-size: 1.8rem;
          font-weight: 700;
        }
        .compare-section h3 {
          color: rgb(239, 79, 95);
          margin: 20px 0 16px 0;
          font-size: 1.2rem;
          font-weight: 700;
        }
        .compare-section h4 {
          color: #333;
          margin-top: 24px;
          margin-bottom: 16px;
          font-size: 1rem;
          font-weight: 700;
        }
        .compare-section p {
          color: #666;
          margin-bottom: 16px;
          font-size: 0.95rem;
        }
        .filter-row {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .filter-row input, .filter-row select {
          padding: 10px 14px;
          border: 1px solid #ddd;
          border-radius: 6px;
          flex: 1;
          min-width: 200px;
          font-size: 14px;
        }
        button {
          background: rgb(239, 79, 95);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          background: #e85a73;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .results {
          margin-top: 20px;
          background: #fafafa;
          padding: 0;
          border-radius: 8px;
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
          border: 2px solid #e0e0e0;
          background: #f9f9f9;
        }
        .platform-card h4 {
          margin: 0 0 15px;
          font-size: 1.2rem;
          color: #333;
        }
        .swiggy-card {
          background: #fafafa;
          border: 2px solid #ff9500;
        }
        .swiggy-card h4 {
          color: #ff9500;
        }
        .zomato-card {
          background: #fafafa;
          border: 2px solid #e31c23;
        }
        .zomato-card h4 {
          color: #e31c23;
        }
        .platform-stats {
          display: flex;
          flex-direction: column;
          gap: 10px;
          color: #333;
          font-weight: 500;
        }
        .platform-stats .offer {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 6px 12px;
          border-radius: 5px;
          font-size: 0.9rem;
          font-weight: 600;
        }
        
        /* Restaurant Summary */
        .restaurant-summary {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          padding: 16px;
          background: #f9f9f9;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }
        .restaurant-summary span {
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .swiggy-better { background: #fff5eb; color: #ff9500; }
        .zomato-better { background: #fff5f5; color: #e31c23; }
        .same { background: #f0f0f0; color: #666; }
        .total-savings { background: #e8f5e9; color: #2e7d32; }
        
        /* Menu Comparison Grid */
        .menu-comparison-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .menu-comparison-item {
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
          background: white;
          transition: box-shadow 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .menu-comparison-item:hover {
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        }
        .menu-comparison-item.swiggy-better {
          border-top: 4px solid #ff9500;
        }
        .menu-comparison-item.zomato-better {
          border-top: 4px solid #e31c23;
        }
        .item-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 16px 12px;
          flex-wrap: wrap;
        }
        .item-name {
          font-weight: 700;
          font-size: 1rem;
          color: #1a1a1a;
          flex: 1;
        }
        .item-savings {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .item-prices {
          display: flex;
          gap: 12px;
          padding: 0 16px 12px;
        }
        .price-box {
          flex: 1;
          text-align: center;
          padding: 10px;
          border-radius: 6px;
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
        }
        .price-box.winner {
          background: #e8f5e9;
          border: 2px solid #4caf50;
        }
        .platform-label {
          font-size: 0.75rem;
          color: #666;
          display: block;
          margin-bottom: 4px;
          font-weight: 600;
        }
        .price-value {
          font-weight: bold;
          font-size: 1.2rem;
          color: rgb(239, 79, 95);
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
          overflow: hidden;
          background: white;
          display: flex;
          gap: 0;
          transition: box-shadow 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .search-result-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        .result-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 20px;
        }
        .result-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .result-name {
          font-weight: 700;
          font-size: 1.1rem;
          color: #1a1a1a;
        }
        .result-restaurant {
          color: #666;
          font-size: 0.9rem;
          margin-left: auto;
        }
        .result-comparison {
          display: flex;
          align-items: stretch;
          gap: 12px;
          margin-bottom: 16px;
          flex: 1;
        }
        .result-platform {
          flex: 1;
          text-align: center;
          padding: 12px;
          border-radius: 8px;
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .result-platform.winner {
          background: #e8f5e9;
          border: 2px solid #4caf50;
        }
        .platform-name {
          font-weight: 600;
          margin-bottom: 6px;
          font-size: 0.9rem;
          color: #333;
        }
        .result-price {
          font-size: 1.5rem;
          font-weight: bold;
          color: rgb(239, 79, 95);
          margin: 4px 0;
        }
        .result-offer {
          font-size: 0.8rem;
          color: #4caf50;
          margin-top: 4px;
          font-weight: 600;
        }
        .not-available {
          color: #999;
          font-size: 0.9rem;
        }
        .vs {
          font-weight: bold;
          color: #ccc;
          display: flex;
          align-items: center;
        }
        .result-verdict {
          padding-top: 12px;
          border-top: 1px solid #e8e8e8;
        }
        .verdict-text {
          color: #666;
          font-size: 0.85rem;
          line-height: 1.4;
        }

        /* Cart Button Styles */
        .item-cart-actions {
          display: flex;
          gap: 10px;
          padding: 0 16px 16px;
          flex-wrap: wrap;
        }
        .item-cart-actions .cart-btn {
          flex: 1;
          justify-content: center;
          padding: 10px 12px;
          min-width: 120px;
          font-size: 0.9rem;
        }
        .result-cart-actions {
          display: flex;
          gap: 10px;
          padding: 16px 20px;
          border-top: 1px solid #e8e8e8;
          margin-top: auto;
        }
        .result-cart-actions .cart-btn {
          flex: 1;
          justify-content: center;
          padding: 10px 15px;
          font-size: 0.9rem;
        }
        .cart-btn {
          padding: 8px 12px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .cart-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .swiggy-cart-btn {
          background: #ff9500;
          color: white;
        }
        .swiggy-cart-btn:hover {
          background: #e68a00;
        }
        .zomato-cart-btn {
          background: #e31c23;
          color: white;
        }
        .zomato-cart-btn:hover {
          background: #c41815;
        }

        .veg-dot { color: #0f9d58; font-weight: bold; }
        .non-veg-dot { color: #e31c23; font-weight: bold; }
      `}</style>
    </div>
  );
}

export default CompareDeals;
