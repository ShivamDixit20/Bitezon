import { useState } from 'react';

const API_BASE = 'http://localhost:3000/api/zomato';

function ZomatoTest() {
  const [restaurants, setRestaurants] = useState([]);
  const [menu, setMenu] = useState([]);
  const [filters, setFilters] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [orderResult, setOrderResult] = useState(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  // Filter states
  const [cityFilter, setCityFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [vegFilter, setVegFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  // Other states
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');

  // Order states
  const [orderRestaurantId, setOrderRestaurantId] = useState('1');
  const [orderItemId, setOrderItemId] = useState('101');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderAddress, setOrderAddress] = useState('123 Main St, Delhi');

  const clearResults = () => {
    setRestaurants([]);
    setMenu([]);
    setFilters(null);
    setSearchResults(null);
    setOrderResult(null);
    setError('');
  };

  // Fetch all restaurants with filters
  const fetchRestaurants = async () => {
    setLoading('restaurants');
    setError('');
    try {
      const params = new URLSearchParams();
      if (cityFilter) params.append('city', cityFilter);
      if (cuisineFilter) params.append('cuisine', cuisineFilter);
      if (vegFilter) params.append('isVeg', vegFilter);
      if (ratingFilter) params.append('minRating', ratingFilter);

      const url = `${API_BASE}/restaurants${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        setRestaurants(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading('');
  };

  // Fetch menu for a restaurant
  const fetchMenu = async () => {
    setLoading('menu');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/menu/${selectedRestaurantId}`);
      const data = await res.json();
      
      if (data.success) {
        setMenu(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading('');
  };

  // Fetch available filters
  const fetchFilters = async () => {
    setLoading('filters');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/filters`);
      const data = await res.json();
      
      if (data.success) {
        setFilters(data.filters);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading('');
  };

  // Search restaurants and menu items
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }
    setLoading('search');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      
      if (data.success) {
        setSearchResults(data.results);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading('');
  };

  // Place an order
  const placeOrder = async () => {
    setLoading('order');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: orderRestaurantId,
          items: [{ itemId: orderItemId, quantity: parseInt(orderQuantity) }],
          deliveryAddress: orderAddress
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setOrderResult(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading('');
  };

  return (
    <div className="zomato-test">
      <h1>🍕 Zomato API Tester</h1>
      
      {error && <div className="error-box">❌ {error}</div>}
      
      <button className="clear-btn" onClick={clearResults}>Clear All Results</button>

      {/* Restaurants Section */}
      <section className="test-section zomato-section">
        <h2>📍 Get Restaurants</h2>
        <div className="filter-row">
          <input
            type="text"
            placeholder="City (e.g., Delhi)"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          />
          <input
            type="text"
            placeholder="Cuisine (e.g., Pizza)"
            value={cuisineFilter}
            onChange={(e) => setCuisineFilter(e.target.value)}
          />
          <select value={vegFilter} onChange={(e) => setVegFilter(e.target.value)}>
            <option value="">All (Veg/Non-Veg)</option>
            <option value="true">Veg Only</option>
            <option value="false">Non-Veg Only</option>
          </select>
          <input
            type="number"
            placeholder="Min Rating"
            step="0.1"
            min="0"
            max="5"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          />
        </div>
        <button onClick={fetchRestaurants} disabled={loading === 'restaurants'}>
          {loading === 'restaurants' ? 'Loading...' : 'Fetch Restaurants'}
        </button>
        
        {restaurants.length > 0 && (
          <div className="results">
            <h3>Found {restaurants.length} restaurants:</h3>
            <div className="cards-grid">
              {restaurants.map((r) => (
                <div key={r.id} className="card zomato-card">
                  <img src={r.image} alt={r.name} />
                  <h4>{r.name}</h4>
                  <p>📍 {r.city} | ⭐ {r.rating}</p>
                  <p>🕐 {r.deliveryTime}</p>
                  <p>{r.cuisines.join(', ')}</p>
                  <p>{r.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}</p>
                  {r.offers.length > 0 && <p className="offer zomato-offer">🎉 {r.offers[0]}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Menu Section */}
      <section className="test-section zomato-section">
        <h2>🍽️ Get Menu</h2>
        <div className="filter-row">
          <select value={selectedRestaurantId} onChange={(e) => setSelectedRestaurantId(e.target.value)}>
            <option value="1">1 - Biryani Palace</option>
            <option value="2">2 - Pizza Hub</option>
            <option value="3">3 - South Spice</option>
            <option value="4">4 - Burger Street</option>
          </select>
          <button onClick={fetchMenu} disabled={loading === 'menu'}>
            {loading === 'menu' ? 'Loading...' : 'Get Menu'}
          </button>
        </div>
        
        {menu.length > 0 && (
          <div className="results">
            <h3>Menu Items ({menu.length}):</h3>
            <div className="cards-grid">
              {menu.map((item) => (
                <div key={item.id} className="card menu-card zomato-card">
                  <img src={item.image} alt={item.itemName} />
                  <h4>{item.itemName}</h4>
                  <p>₹{item.price}</p>
                  <p>{item.category}</p>
                  <p>{item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Filters Section */}
      <section className="test-section zomato-section">
        <h2>🔧 Get Available Filters</h2>
        <button onClick={fetchFilters} disabled={loading === 'filters'}>
          {loading === 'filters' ? 'Loading...' : 'Fetch Filters'}
        </button>
        
        {filters && (
          <div className="results">
            <div className="filters-display">
              <div><strong>Cities:</strong> {filters.cities.join(', ')}</div>
              <div><strong>Cuisines:</strong> {filters.cuisines.join(', ')}</div>
              <div><strong>Categories:</strong> {filters.categories.join(', ')}</div>
              <div><strong>Rating Options:</strong> {filters.ratingRanges.map(r => r.label).join(', ')}</div>
            </div>
          </div>
        )}
      </section>

      {/* Search Section */}
      <section className="test-section zomato-section">
        <h2>🔍 Search</h2>
        <div className="filter-row">
          <input
            type="text"
            placeholder="Search (e.g., pizza, biryani, burger)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading === 'search'}>
            {loading === 'search' ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        {searchResults && (
          <div className="results">
            <h3>Restaurants ({searchResults.restaurants.count}):</h3>
            {searchResults.restaurants.data.map((r) => (
              <div key={r.id} className="result-item">
                {r.name} - {r.city} (⭐ {r.rating})
              </div>
            ))}
            <h3>Menu Items ({searchResults.menuItems.count}):</h3>
            {searchResults.menuItems.data.map((item) => (
              <div key={item.id} className="result-item">
                {item.itemName} - ₹{item.price} ({item.category})
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Order Section */}
      <section className="test-section zomato-section">
        <h2>🛒 Place Order</h2>
        <div className="filter-row">
          <select value={orderRestaurantId} onChange={(e) => setOrderRestaurantId(e.target.value)}>
            <option value="1">1 - Biryani Palace</option>
            <option value="2">2 - Pizza Hub</option>
            <option value="3">3 - South Spice</option>
            <option value="4">4 - Burger Street</option>
          </select>
          <input
            type="text"
            placeholder="Item ID (e.g., 101)"
            value={orderItemId}
            onChange={(e) => setOrderItemId(e.target.value)}
          />
          <input
            type="number"
            placeholder="Quantity"
            min="1"
            value={orderQuantity}
            onChange={(e) => setOrderQuantity(e.target.value)}
          />
        </div>
        <div className="filter-row">
          <input
            type="text"
            placeholder="Delivery Address"
            value={orderAddress}
            onChange={(e) => setOrderAddress(e.target.value)}
            style={{ flex: 2 }}
          />
          <button onClick={placeOrder} disabled={loading === 'order'}>
            {loading === 'order' ? 'Placing...' : 'Place Order'}
          </button>
        </div>
        
        {orderResult && (
          <div className="results order-result zomato-order">
            <h3>✅ Order Placed!</h3>
            <p><strong>Order ID:</strong> {orderResult.id}</p>
            <p><strong>Restaurant:</strong> {orderResult.restaurantName}</p>
            <p><strong>Status:</strong> {orderResult.status}</p>
            <p><strong>Total:</strong> ₹{orderResult.total}</p>
            <p><strong>Delivery:</strong> {orderResult.estimatedDelivery}</p>
            <p><strong>Address:</strong> {orderResult.deliveryAddress}</p>
            <div>
              <strong>Items:</strong>
              <ul>
                {orderResult.items.map((item, i) => (
                  <li key={i}>{item.itemName} x{item.quantity} = ₹{item.itemTotal}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <style>{`
        .zomato-test {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .zomato-test h1 {
          text-align: center;
          color: #e23744;
        }
        .error-box {
          background: #fee;
          border: 1px solid #f99;
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 15px;
          color: #c00;
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
        .zomato-section {
          background: #fff5f5;
          border: 1px solid #ffcdd2;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .zomato-section h2 {
          margin-top: 0;
          color: #333;
          border-bottom: 2px solid #e23744;
          padding-bottom: 10px;
        }
        .filter-row {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }
        .filter-row input, .filter-row select {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
          flex: 1;
          min-width: 120px;
        }
        .zomato-test button {
          background: #e23744;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
        }
        .zomato-test button:hover:not(:disabled) {
          background: #c62828;
        }
        .zomato-test button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .zomato-test .clear-btn {
          background: #666;
        }
        .results {
          margin-top: 15px;
          background: white;
          padding: 15px;
          border-radius: 5px;
          border: 1px solid #eee;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
        }
        .zomato-card {
          border: 1px solid #ffcdd2;
          border-radius: 8px;
          padding: 10px;
          background: white;
        }
        .zomato-card img {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 5px;
        }
        .zomato-card h4 {
          margin: 10px 0 5px;
          color: #333;
        }
        .zomato-card p {
          margin: 3px 0;
          font-size: 14px;
          color: #666;
        }
        .zomato-offer {
          background: #ffebee;
          color: #c62828;
          padding: 3px 8px;
          border-radius: 3px;
          font-size: 12px;
        }
        .menu-card img {
          height: 80px;
        }
        .filters-display {
          display: grid;
          gap: 10px;
        }
        .filters-display div {
          padding: 8px;
          background: #fff5f5;
          border-radius: 4px;
        }
        .result-item {
          padding: 8px;
          border-bottom: 1px solid #eee;
        }
        .zomato-order {
          background: #ffebee;
          border-color: #e23744;
        }
        .zomato-order ul {
          margin: 5px 0;
          padding-left: 20px;
        }
      `}</style>
    </div>
  );
}

export default ZomatoTest;
