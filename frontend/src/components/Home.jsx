import React, { useState, useEffect } from 'react';
import getDishImage from '../utils/getDishImage';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`;

const Home = ({ user }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  
  const [dietaryFilters, setDietaryFilters] = useState({
    veg: false,
    nonVeg: false,
    vegan: false
  });
  const [cuisineFilters, setCuisineFilters] = useState({
    italian: false,
    chinese: false,
    indian: false
  });
  const [minRating, setMinRating] = useState(0);
  
  // Menu modal state
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching restaurants from:', API_BASE);
      
      const [swiggyRes, zomatoRes] = await Promise.all([
        fetch(`${API_BASE}/swiggy/restaurants`),
        fetch(`${API_BASE}/zomato/restaurants`)
      ]);
      
      console.log('Swiggy response status:', swiggyRes.status);
      console.log('Zomato response status:', zomatoRes.status);
      
      const swiggyData = await swiggyRes.json();
      const zomatoData = await zomatoRes.json();
      
      console.log('Swiggy data:', swiggyData);
      console.log('Zomato data:', zomatoData);
      
      const swiggyRestaurants = swiggyData.success ? swiggyData.data : [];
      const zomatoRestaurants = zomatoData.success ? zomatoData.data : [];
      
      console.log('Swiggy restaurants count:', swiggyRestaurants.length);
      console.log('Zomato restaurants count:', zomatoRestaurants.length);
      
      const merged = [];
      const seen = new Set();
      
      swiggyRestaurants.forEach(r => {
        const key = r.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          const zomatoMatch = zomatoRestaurants.find(z => z.name.toLowerCase() === key);
          merged.push({
            ...r,
            swiggyPrice: r.costForTwo || 250,
            swiggyOffer: r.offers?.[0] || null,
            zomatoPrice: zomatoMatch?.costForTwo || r.costForTwo || 250,
            zomatoOffer: zomatoMatch?.offers?.[0] || null,
            zomatoRating: zomatoMatch?.rating || r.rating
          });
        }
      });
      
      zomatoRestaurants.forEach(r => {
        const key = r.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          merged.push({
            ...r,
            swiggyPrice: r.costForTwo || 250,
            swiggyOffer: null,
            zomatoPrice: r.costForTwo || 250,
            zomatoOffer: r.offers?.[0] || null,
            zomatoRating: r.rating
          });
        }
      });
      
      setRestaurants(merged);
      console.log('Total merged restaurants:', merged.length);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('Failed to fetch restaurants. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(r => {
    if (filter === 'veg' && !r.isVeg) return false;
    if (filter === 'nonveg' && r.isVeg) return false;
    
    const anyDietarySelected = dietaryFilters.veg || dietaryFilters.nonVeg || dietaryFilters.vegan;
    if (anyDietarySelected) {
      if (dietaryFilters.veg && !r.isVeg) return false;
      if (dietaryFilters.nonVeg && r.isVeg) return false;
    }
    
    const anyCuisineSelected = cuisineFilters.italian || cuisineFilters.chinese || cuisineFilters.indian;
    if (anyCuisineSelected) {
      const cuisines = r.cuisines?.map(c => c.toLowerCase()) || [];
      let matches = false;
      if (cuisineFilters.italian && cuisines.some(c => c.includes('italian') || c.includes('pizza'))) matches = true;
      if (cuisineFilters.chinese && cuisines.some(c => c.includes('chinese'))) matches = true;
      if (cuisineFilters.indian && cuisines.some(c => c.includes('indian') || c.includes('biryani') || c.includes('north'))) matches = true;
      if (!matches) return false;
    }
    
    if (r.rating < minRating) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = r.name.toLowerCase().includes(query);
      const matchCuisine = r.cuisines?.some(c => c.toLowerCase().includes(query));
      if (!matchName && !matchCuisine) return false;
    }
    
    return true;
  });

  const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'delivery') return parseInt(a.deliveryTime) - parseInt(b.deliveryTime);
    if (sortBy === 'price-low') return (a.swiggyPrice || 0) - (b.swiggyPrice || 0);
    if (sortBy === 'price-high') return (b.swiggyPrice || 0) - (a.swiggyPrice || 0);
    return 0;
  });

  const formatOffer = (offer) => {
    if (!offer) return 'No offer';
    if (offer.includes('%')) {
      const match = offer.match(/(\d+%)/);
      return match ? match[1] + ' OFF' : offer;
    }
    if (offer.includes('₹')) {
      const match = offer.match(/(₹\d+)/);
      return match ? 'FLAT ' + match[1] + ' OFF' : offer;
    }
    return offer;
  };

  const handleViewMenu = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowMenuModal(true);
    setMenuLoading(true);
    setMenuItems([]);
    
    try {
      // Fetch menu from both platforms
      const [swiggyRes, zomatoRes] = await Promise.all([
        fetch(`${API_BASE}/swiggy/menu/${restaurant.id}`),
        fetch(`${API_BASE}/zomato/menu/${restaurant.id}`)
      ]);
      
      const swiggyData = await swiggyRes.json();
      const zomatoData = await zomatoRes.json();
      
      const swiggyMenu = swiggyData.success ? swiggyData.data : [];
      const zomatoMenu = zomatoData.success ? zomatoData.data : [];
      
      // Merge menu items with prices from both platforms
      const merged = [];
      const seen = new Set();
      
      swiggyMenu.forEach(item => {
        const itemName = item.itemName || item.name;
        const key = itemName.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          const zomatoMatch = zomatoMenu.find(z => (z.itemName || z.name).toLowerCase() === key);
          merged.push({
            ...item,
            name: itemName,
            swiggyPrice: item.price,
            zomatoPrice: zomatoMatch?.price || item.price,
            swiggyOffer: item.offer || null,
            zomatoOffer: zomatoMatch?.offer || null
          });
        }
      });
      
      zomatoMenu.forEach(item => {
        const itemName = item.itemName || item.name;
        const key = itemName.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          merged.push({
            ...item,
            name: itemName,
            swiggyPrice: item.price,
            zomatoPrice: item.price,
            swiggyOffer: null,
            zomatoOffer: item.offer || null
          });
        }
      });
      
      setMenuItems(merged);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
      setMenuItems([]);
    } finally {
      setMenuLoading(false);
    }
  };

  const closeMenuModal = () => {
    setShowMenuModal(false);
    setSelectedRestaurant(null);
    setMenuItems([]);
  };

  return (
    <div style={styles.pageWrapper}>
      {/* Hero Section with Title and Search */}
      <section style={styles.heroSection}>
        <h1 style={styles.heroTitle}>Find the Best Deals on Your Favorite Meals</h1>
        <p style={styles.heroSubtitle}>Compare prices from Zomato and Swiggy in one place.</p>
        
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search for restaurants, cuisines, or dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </section>

      {/* Main Layout */}
      <div style={styles.mainLayout}>
        {/* Left Sidebar - Full Height */}
        <aside style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Filters</h3>
          
          <div style={styles.filterSection}>
            <h4 style={styles.filterLabel}>Dietary</h4>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={dietaryFilters.veg}
                onChange={(e) => setDietaryFilters({...dietaryFilters, veg: e.target.checked})}
                style={styles.checkbox} />
              Veg
            </label>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={dietaryFilters.nonVeg}
                onChange={(e) => setDietaryFilters({...dietaryFilters, nonVeg: e.target.checked})}
                style={styles.checkbox} />
              Non-Veg
            </label>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={dietaryFilters.vegan}
                onChange={(e) => setDietaryFilters({...dietaryFilters, vegan: e.target.checked})}
                style={styles.checkbox} />
              Vegan
            </label>
          </div>

          <div style={styles.filterSection}>
            <h4 style={styles.filterLabel}>Cuisine</h4>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={cuisineFilters.italian}
                onChange={(e) => setCuisineFilters({...cuisineFilters, italian: e.target.checked})}
                style={styles.checkbox} />
              Italian
            </label>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={cuisineFilters.chinese}
                onChange={(e) => setCuisineFilters({...cuisineFilters, chinese: e.target.checked})}
                style={styles.checkbox} />
              Chinese
            </label>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={cuisineFilters.indian}
                onChange={(e) => setCuisineFilters({...cuisineFilters, indian: e.target.checked})}
                style={styles.checkbox} />
              Indian
            </label>
          </div>

          <div style={styles.filterSection}>
            <h4 style={styles.filterLabel}>Rating</h4>
            <input type="range" min="0" max="5" step="0.5" value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              style={styles.rangeSlider} />
            <div style={styles.ratingValue}>{minRating}+ stars</div>
          </div>
        </aside>

        {/* Right Content Area */}
        <div style={styles.contentArea}>
          {/* Tabs and Sort Row */}
          <div style={styles.tabsRow}>
            <div style={styles.tabs}>
              {['all', 'veg', 'nonveg', 'vegan'].map(f => (
                <button key={f}
                  style={{...styles.tab, ...(filter === f ? styles.tabActive : {})}}
                  onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All' : f === 'veg' ? 'Veg' : f === 'nonveg' ? 'Non-Veg' : 'Vegan'}
                </button>
              ))}
            </div>
            
            <div style={styles.sortContainer}>
              <span style={styles.sortLabel}>Sort by:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={styles.sortSelect}>
                <option value="rating">Rating</option>
                <option value="delivery">Delivery Time</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          {loading ? (
            <div style={styles.loading}>
              <div style={styles.spinner}></div>
              <p>Loading restaurants...</p>
            </div>
          ) : (
            <>
              <div style={styles.restaurantGrid}>
                {sortedRestaurants.map((restaurant) => (
                  <div key={restaurant.id} style={styles.restaurantCard}>
                    <div style={styles.cardHeader}>
                      <div style={styles.cardInfo}>
                        <h3 style={styles.restaurantName}>{restaurant.name}</h3>
                        <p style={styles.cuisineText}>{restaurant.cuisines?.slice(0, 2).join(', ')}</p>
                        <div style={styles.ratingDelivery}>
                          <span style={styles.rating}>{restaurant.rating} ★</span>
                          <span style={styles.deliveryTime}> | {restaurant.deliveryTime}</span>
                        </div>
                      </div>
                      <img src={getDishImage(restaurant.cuisines?.[0] || restaurant.name)}
                        alt={restaurant.name} style={styles.cardImage} 
                        onError={(e) => { 
                          e.target.onerror = null; 
                          e.target.src = 'https://via.placeholder.com/100x80?text=Food'; 
                        }} />
                    </div>

                    <div style={styles.cardFooter}>
                      <button 
                        style={styles.viewMenuBtn}
                        onClick={() => handleViewMenu(restaurant)}
                      >
                        View Menu
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {sortedRestaurants.length === 0 && (
                <div style={styles.noResults}>
                  <h3>No restaurants found</h3>
                  <p>Try adjusting your filters or search query</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Menu Modal */}
      {showMenuModal && (
        <div style={styles.modalOverlay} onClick={closeMenuModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>{selectedRestaurant?.name}</h2>
                <p style={styles.modalSubtitle}>{selectedRestaurant?.cuisines?.join(', ')}</p>
              </div>
              <button style={styles.closeBtn} onClick={closeMenuModal}>✕</button>
            </div>
            
            <div style={styles.modalBody}>
              {menuLoading ? (
                <div style={styles.menuLoading}>
                  <div style={styles.spinner}></div>
                  <p>Loading menu...</p>
                </div>
              ) : menuItems.length === 0 ? (
                <div style={styles.noMenu}>
                  <p>No menu items available</p>
                </div>
              ) : (
                <div style={styles.menuList}>
                  {menuItems.map((item, index) => (
                    <div key={item.id || index} style={styles.menuItem}>
                      <div style={styles.menuItemLeft}>
                        <div style={styles.vegBadge}>
                          <span style={{
                            ...styles.vegDot,
                            backgroundColor: item.isVeg ? '#22c55e' : '#dc2626'
                          }}></span>
                        </div>
                        <div style={styles.menuItemInfo}>
                          <h4 style={styles.menuItemName}>{item.name}</h4>
                          <p style={styles.menuItemDesc}>{item.description || item.category}</p>
                        </div>
                      </div>
                      <div style={styles.menuItemRight}>
                        <img 
                          src={getDishImage(item.name)} 
                          alt={item.name} 
                          style={styles.menuItemImage}
                          onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = 'https://via.placeholder.com/120x100?text=Food'; 
                          }}
                        />
                        <div style={styles.menuPrices}>
                          <div style={styles.menuPriceRow}>
                            <span style={styles.platformLabel}>Zomato:</span>
                            <span style={styles.menuPrice}>₹{item.zomatoPrice}</span>
                          </div>
                          <div style={styles.menuPriceRow}>
                            <span style={styles.platformLabel}>Swiggy:</span>
                            <span style={styles.menuPrice}>₹{item.swiggyPrice}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  heroSection: {
    textAlign: 'center',
    padding: '40px 24px 35px',
    backgroundColor: '#ffffff'
  },
  heroTitle: {
    fontSize: '2.8rem',
    fontWeight: '800',
    color: '#1a1a1a',
    margin: '0 0 12px 0',
    letterSpacing: '-0.5px',
    fontStyle: 'italic'
  },
  heroSubtitle: {
    fontSize: '1.3rem',
    color: '#555',
    margin: '0 0 28px 0',
    fontWeight: '500'
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    maxWidth: '580px',
    margin: '0 auto',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '4px 16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
  },
  searchIcon: {
    fontSize: '16px',
    marginRight: '12px',
    color: '#888'
  },
  searchInput: {
    flex: 1,
    padding: '16px 0',
    fontSize: '17px',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: '#333'
  },
  mainLayout: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    backgroundColor: '#fff'
  },
  sidebar: {
    width: '340px',
    flexShrink: 0,
    backgroundColor: '#fff',
    borderRight: '1px solid #e8e8e8',
    padding: '32px 28px',
    overflowY: 'auto',
    minHeight: 'calc(100vh - 180px)'
  },
  sidebarTitle: {
    fontSize: '19px',
    fontWeight: '600',
    margin: '0 0 24px 0',
    color: '#1a1a1a'
  },
  filterSection: {
    marginBottom: '36px',
    padding: '24px 16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #f0f0f0'
  },
  filterLabel: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#333',
    margin: '0 0 18px 0'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px',
    fontSize: '17px',
    color: '#555',
    cursor: 'pointer'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: 'rgb(239, 79, 95)',
    cursor: 'pointer'
  },
  rangeSlider: {
    width: '100%',
    accentColor: 'rgb(239, 79, 95)',
    cursor: 'pointer',
    height: '6px'
  },
  ratingValue: {
    fontSize: '16px',
    color: '#666',
    marginTop: '14px'
  },
  contentArea: {
    flex: 1,
    padding: '24px 32px',
    overflowY: 'auto',
    minWidth: 0,
    backgroundColor: '#fff'
  },
  tabsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  tabs: {
    display: 'flex',
    gap: '10px'
  },
  tab: {
    padding: '10px 22px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '25px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    color: '#555',
    transition: 'all 0.2s'
  },
  tabActive: {
    backgroundColor: 'rgb(239, 79, 95)',
    borderColor: 'rgb(239, 79, 95)',
    color: '#fff'
  },
  sortContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  sortLabel: {
    fontSize: '16px',
    color: '#666'
  },
  sortSelect: {
    padding: '10px 16px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
    cursor: 'pointer'
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  loading: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#666'
  },
  spinner: {
    width: '44px',
    height: '44px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid rgb(239, 79, 95)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px'
  },
  restaurantGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px'
  },
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #eee',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px 16px 14px',
    borderBottom: '1px solid #f5f5f5'
  },
  cardInfo: {
    flex: 1
  },
  restaurantName: {
    margin: '0 0 4px 0',
    fontSize: '19px',
    fontWeight: '600',
    color: '#1a1a1a'
  },
  cuisineText: {
    margin: '0 0 6px 0',
    fontSize: '15px',
    color: '#888'
  },
  ratingDelivery: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '15px'
  },
  rating: {
    color: '#666',
    fontWeight: '500'
  },
  deliveryTime: {
    color: '#999'
  },
  cardImage: {
    width: '240px',
    height: '220px',
    borderRadius: '10px',
    objectFit: 'cover',
    marginLeft: '12px'
  },
  cardFooter: {
    padding: '12px 16px',
    borderTop: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'center'
  },
  viewMenuBtn: {
    width: '100%',
    padding: '12px 24px',
    backgroundColor: 'rgb(239, 79, 95)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  priceComparison: {
    display: 'flex'
  },
  zomatoPlatform: {
    flex: 1,
    padding: '14px 16px',
    backgroundColor: '#dcfce7',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  swiggyPlatform: {
    flex: 1,
    padding: '14px 16px',
    backgroundColor: '#fce7f3',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  platformName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333'
  },
  price: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a1a'
  },
  zomatoOffer: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#dc2626'
  },
  swiggyOfferBadge: {
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#22c55e',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '4px',
    alignSelf: 'flex-start'
  },
  noOffer: {
    fontSize: '13px',
    color: '#ef4444'
  },
  noResults: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#666'
  },
  noResultsIcon: {
    fontSize: '52px',
    display: 'block',
    marginBottom: '16px'
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: '1px solid #eee'
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a1a1a'
  },
  modalSubtitle: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#666'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#666',
    padding: '4px 8px',
    borderRadius: '4px'
  },
  modalBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 24px'
  },
  menuLoading: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#666'
  },
  noMenu: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#666'
  },
  menuList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  menuItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    gap: '16px'
  },
  menuItemLeft: {
    display: 'flex',
    gap: '12px',
    flex: 1
  },
  vegBadge: {
    width: '18px',
    height: '18px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  vegDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },
  menuItemInfo: {
    flex: 1
  },
  menuItemName: {
    margin: '0 0 4px 0',
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a1a'
  },
  menuItemDesc: {
    margin: 0,
    fontSize: '13px',
    color: '#666'
  },
  menuItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  menuItemImage: {
    width: '70px',
    height: '60px',
    borderRadius: '8px',
    objectFit: 'cover'
  },
  menuPrices: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '100px'
  },
  menuPriceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px'
  },
  platformLabel: {
    fontSize: '12px',
    color: '#666'
  },
  menuPrice: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a'
  }
};

// Add keyframes and responsive styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @media (max-width: 1100px) {
    .restaurant-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 768px) {
    .home-sidebar { display: none !important; }
  }
`;
if (!document.querySelector('#home-styles')) {
  styleSheet.id = 'home-styles';
  document.head.appendChild(styleSheet);
}

export default Home;
