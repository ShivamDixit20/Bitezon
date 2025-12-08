import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000/api';

const OrderHistory = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      
      if (!userData?._id && !userData?.id) {
        setError('User information not found. Please login again.');
        setLoading(false);
        return;
      }

      const userId = userData._id || userData.id;
      const url = filter === 'all' 
        ? `${API_BASE}/orders?userId=${userId}` 
        : `${API_BASE}/orders?userId=${userId}&platform=${filter}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError('Failed to fetch order history');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const matchesRestaurant = order.restaurantName?.toLowerCase().includes(query);
    const matchesItems = order.items?.some(item => 
      item.itemName?.toLowerCase().includes(query)
    );
    
    return matchesRestaurant || matchesItems;
  });

  const handleViewDetails = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setOrders(orders.filter(order => order.orderId !== orderId));
        setExpandedOrderId(null);
      } else {
        setError(data.message || 'Failed to delete order');
      }
    } catch (err) {
      setError('Failed to delete order');
      console.error(err);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.mainContainer}>
        <aside style={styles.sidebar}>
          <div style={styles.profileSection}>
            <div style={styles.avatarCircle}></div>
            <div style={styles.userInfo}>
              <h3 style={styles.userName}>{user?.name || 'User'}</h3>
              <p style={styles.userEmail}>{user?.email || 'user@email.com'}</p>
            </div>
          </div>

          <div style={styles.filterSection}>
            <button 
              style={{
                ...styles.filterBtn,
                backgroundColor: filter === 'all' ? '#dcfce7' : '#f5f5f5',
                borderColor: filter === 'all' ? 'rgb(239, 79, 95)' : '#ddd',
                color: filter === 'all' ? 'rgb(239, 79, 95)' : '#333'
              }}
              onClick={() => setFilter('all')}
            >
              All Orders
            </button>
            <button 
              style={{
                ...styles.filterBtn,
                backgroundColor: filter === 'zomato' ? '#dcfce7' : '#f5f5f5',
                borderColor: filter === 'zomato' ? 'rgb(239, 79, 95)' : '#ddd',
                color: filter === 'zomato' ? 'rgb(239, 79, 95)' : '#333'
              }}
              onClick={() => setFilter('zomato')}
            >
              Zomato
            </button>
            <button 
              style={{
                ...styles.filterBtn,
                backgroundColor: filter === 'swiggy' ? '#dcfce7' : '#f5f5f5',
                borderColor: filter === 'swiggy' ? 'rgb(239, 79, 95)' : '#ddd',
                color: filter === 'swiggy' ? 'rgb(239, 79, 95)' : '#333'
              }}
              onClick={() => setFilter('swiggy')}
            >
              Swiggy
            </button>
            
          </div>
        </aside>

        <div style={styles.contentSection}>
          <div style={styles.header}>
            <h1 style={styles.title}>Order History</h1>
            
            <div style={styles.searchBar}>
              <input 
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              <button style={styles.searchBtn}>Search</button>
            </div>
          </div>

          {loading ? (
            <div style={styles.loading}>
              <div style={styles.spinner}></div>
              <p>Loading orders...</p>
            </div>
          ) : error ? (
            <div style={styles.error}>{error}</div>
          ) : orders.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No orders found</p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <div style={styles.tableHeader}>
                <div style={styles.colRestaurant}>Restaurant</div>
                <div style={styles.colItems}>Items</div>
                <div style={styles.colAmount}>Amount</div>
                <div style={styles.colSavings}>Savings</div>
                <div style={styles.colStatus}>Status</div>
                <div style={styles.colActions}>Actions</div>
              </div>

              {filteredOrders.map((order) => (
                <div key={order._id}>
                  <div style={styles.tableRow}>
                    <div style={styles.colRestaurant}>
                      <span style={styles.restaurantName}>{order.restaurantName || 'N/A'}</span>
                    </div>
                    <div style={styles.colItems}>
                      <span style={styles.itemsText}>
                        {order.items?.length}x {order.items?.[0]?.itemName || 'Item'}
                      </span>
                    </div>
                    <div style={styles.colAmount}>
                      <span style={styles.amountText}>₹{order.totals?.discountedTotal || 0}</span>
                    </div>
                    <div style={styles.colSavings}>
                      <span style={styles.savingsText}>₹{order.totals?.totalSavings || 0}</span>
                    </div>
                    <div style={styles.colStatus}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: order.status === 'delivered' ? '#dcfce7' : 
                                         order.status === 'cancelled' ? '#fee2e2' : '#dbeafe',
                        color: order.status === 'delivered' ? '#80152aff' : 
                               order.status === 'cancelled' ? '#991b1b' : '#1e40af'
                      }}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                      </span>
                    </div>
                    <div style={styles.colActions}>
                      <button 
                        style={styles.actionBtn}
                        onClick={() => handleViewDetails(order._id)}
                      >
                        {order.status === 'delivered' ? 'Reorder' : 'View Details'}
                      </button>
                      <button 
                        style={styles.deleteBtn}
                        onClick={() => handleDeleteOrder(order._id)}
                        title="Delete order"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {expandedOrderId === order._id && (
                    <div style={styles.expandedDetails}>
                      <h4 style={styles.detailsTitle}>Order Details</h4>
                      <div style={styles.detailsGrid}>
                        <div>
                          <p style={styles.detailLabel}>Order Date</p>
                          <p style={styles.detailValue}>{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p style={styles.detailLabel}>Platform</p>
                          <p style={styles.detailValue}>{order.platform}</p>
                        </div>
                        <div>
                          <p style={styles.detailLabel}>Total Savings</p>
                          <p style={{...styles.detailValue, color: 'rgb(239, 79, 95)'}}>₹{order.totals?.totalSavings || 0}</p>
                        </div>
                      </div>
                      <h5 style={styles.itemsTitle}>Items Ordered</h5>
                      <div style={styles.itemsList}>
                        {order.items?.map((item, idx) => (
                          <div key={idx} style={styles.itemRow}>
                            <span>{item.itemName}</span>
                            <span>₹{item.originalPrice} → ₹{item.effectivePrice}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '20px'
  },
  mainContainer: {
    display: 'flex',
    maxWidth: '1400px',
    margin: '0 auto',
    gap: '24px'
  },
  sidebar: {
    width: '280px',
    flexShrink: 0
  },
  profileSection: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
  },
  avatarCircle: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    flexShrink: 0
  },
  userInfo: {
    flex: 1,
    minWidth: 0
  },
  userName: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  userEmail: {
    margin: 0,
    fontSize: '13px',
    color: '#888'
  },
  filterSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  filterBtn: {
    padding: '12px 16px',
    border: '1px solid',
    borderRadius: '8px',
    backgroundColor: '#f5f5f5',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left'
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
  },
  header: {
    marginBottom: '28px'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 0 20px 0',
    color: '#1a1a1a'
  },
  searchBar: {
    display: 'flex',
    gap: '12px',
    maxWidth: '500px'
  },
  searchInput: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#f9f9f9'
  },
  searchBtn: {
    padding: '12px 28px',
    backgroundColor: 'rgb(239, 79, 95)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  tableContainer: {
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1.2fr 0.8fr 0.8fr 0.8fr 1fr',
    gap: '16px',
    padding: '16px 20px',
    backgroundColor: '#f8f8f8',
    borderBottom: '1px solid #e5e5e5',
    fontWeight: '600',
    fontSize: '13px',
    color: '#333'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1.2fr 0.8fr 0.8fr 0.8fr 1fr',
    gap: '16px',
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center',
    fontSize: '14px'
  },
  colRestaurant: {},
  colItems: {},
  colAmount: {},
  colSavings: {},
  colStatus: {},
  colActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  restaurantName: {
    fontWeight: '500',
    color: '#1a1a1a'
  },
  itemsText: {
    color: '#666',
    fontSize: '13px'
  },
  amountText: {
    fontWeight: '600',
    color: '#1a1a1a'
  },
  savingsText: {
    fontWeight: '600',
    color: 'rgb(239, 79, 95)'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500'
  },
  actionBtn: {
    padding: '8px 16px',
    backgroundColor: 'rgb(239, 79, 95)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    marginRight: '8px'
  },
  deleteBtn: {
    padding: '8px 16px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #c52261ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px'
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666'
  },
  emptyIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px'
  },
  expandedDetails: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderBottom: '1px solid #f0f0f0',
    gridColumn: '1 / -1'
  },
  detailsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 16px 0'
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '16px'
  },
  detailLabel: {
    fontSize: '12px',
    color: '#666',
    margin: '0 0 4px 0',
    fontWeight: '500'
  },
  detailValue: {
    fontSize: '14px',
    color: '#1a1a1a',
    margin: 0,
    fontWeight: '500'
  },
  itemsTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
    margin: '12px 0 8px 0'
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '13px',
    color: '#555'
  }
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  #order-history-styles button:hover {
    opacity: 0.9;
  }
  
  @media (max-width: 1024px) {
    .order-history-sidebar {
      width: 200px;
    }
  }
  
  @media (max-width: 768px) {
    .order-history-main {
      flex-direction: column;
    }
    .order-history-sidebar {
      width: 100%;
    }
  }
`;
if (!document.querySelector('#order-history-styles')) {
  styleSheet.id = 'order-history-styles';
  document.head.appendChild(styleSheet);
}

export default OrderHistory;
