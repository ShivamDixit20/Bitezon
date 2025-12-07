import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000/api';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, swiggy, zomato
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' 
        ? `${API_BASE}/orders` 
        : `${API_BASE}/orders?platform=${filter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch order history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'confirmed': '#2196F3',
      'preparing': '#FF9800',
      'out-for-delivery': '#9C27B0',
      'delivered': '#4CAF50',
      'cancelled': '#F44336'
    };
    return colors[status] || '#666';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'confirmed': '✓',
      'preparing': '👨‍🍳',
      'out-for-delivery': '🛵',
      'delivered': '✅',
      'cancelled': '❌'
    };
    return icons[status] || '•';
  };

  const getPlatformColor = (platform) => {
    return platform === 'swiggy' ? '#fc8019' : '#e23744';
  };

  const getPlatformIcon = (platform) => {
    return platform === 'swiggy' ? '🟧' : '🔴';
  };

  if (loading && orders.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📋 Order History</h1>
        <p style={styles.subtitle}>View all your past orders</p>
      </div>

      {/* Filters */}
      <div style={styles.filterSection}>
        <button 
          style={{
            ...styles.filterButton,
            backgroundColor: filter === 'all' ? '#333' : '#f5f5f5',
            color: filter === 'all' ? '#fff' : '#333'
          }}
          onClick={() => setFilter('all')}
        >
          All Orders
        </button>
        <button 
          style={{
            ...styles.filterButton,
            backgroundColor: filter === 'swiggy' ? '#fc8019' : '#f5f5f5',
            color: filter === 'swiggy' ? '#fff' : '#333'
          }}
          onClick={() => setFilter('swiggy')}
        >
          🟧 Swiggy
        </button>
        <button 
          style={{
            ...styles.filterButton,
            backgroundColor: filter === 'zomato' ? '#e23744' : '#f5f5f5',
            color: filter === 'zomato' ? '#fff' : '#333'
          }}
          onClick={() => setFilter('zomato')}
        >
          🔴 Zomato
        </button>
      </div>

      {error && <div style={styles.error}>❌ {error}</div>}

      {orders.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🛒</div>
          <h3>No orders yet</h3>
          <p>Your order history will appear here once you place an order.</p>
        </div>
      ) : (
        <div style={styles.ordersContainer}>
          {orders.map((order) => (
            <div 
              key={order.orderId} 
              style={{
                ...styles.orderCard,
                borderLeft: `4px solid ${getPlatformColor(order.platform)}`
              }}
            >
              {/* Order Header */}
              <div style={styles.orderHeader}>
                <div style={styles.orderInfo}>
                  <span style={styles.platformBadge}>
                    {getPlatformIcon(order.platform)} {order.platform.toUpperCase()}
                  </span>
                  <span style={styles.orderId}>#{order.orderId}</span>
                </div>
                <div 
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(order.status)
                  }}
                >
                  {getStatusIcon(order.status)} {order.status.replace('-', ' ')}
                </div>
              </div>

              {/* Restaurant Info */}
              <div style={styles.restaurantRow}>
                <span style={styles.restaurantIcon}>🏪</span>
                <span style={styles.restaurantName}>{order.restaurantName}</span>
              </div>

              {/* Order Date & Delivery */}
              <div style={styles.dateRow}>
                <span>📅 {formatDate(order.orderDate)}</span>
                {order.estimatedDelivery && (
                  <span style={styles.deliveryTime}>
                    🕐 Est. {order.estimatedDelivery.display}
                  </span>
                )}
              </div>

              {/* Order Summary */}
              <div style={styles.summaryRow}>
                <span>{order.totals.totalItems} item(s)</span>
                <span style={styles.orderTotal}>₹{order.totals.discountedTotal}</span>
              </div>

              {/* Savings */}
              {order.totals.totalSavings > 0 && (
                <div style={styles.savingsRow}>
                  💰 You saved ₹{order.totals.totalSavings}!
                </div>
              )}

              {/* Expand/Collapse Button */}
              <button 
                style={styles.expandButton}
                onClick={() => setExpandedOrder(
                  expandedOrder === order.orderId ? null : order.orderId
                )}
              >
                {expandedOrder === order.orderId ? '▲ Hide Details' : '▼ View Details'}
              </button>

              {/* Expanded Details */}
              {expandedOrder === order.orderId && (
                <div style={styles.orderDetails}>
                  <h4 style={styles.itemsHeader}>Order Items</h4>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={styles.itemRow}>
                      <div style={styles.itemInfo}>
                        <span style={styles.itemName}>{item.itemName}</span>
                        <span style={styles.itemQty}>x{item.quantity}</span>
                      </div>
                      <div style={styles.itemPrices}>
                        {item.originalPrice !== item.effectivePrice && (
                          <span style={styles.originalPrice}>₹{item.originalPrice}</span>
                        )}
                        <span style={styles.effectivePrice}>₹{item.effectivePrice}</span>
                      </div>
                      {item.offer && (
                        <div style={styles.itemOffer}>🏷️ {item.offer}</div>
                      )}
                    </div>
                  ))}

                  {/* Totals Breakdown */}
                  <div style={styles.totalsBreakdown}>
                    <div style={styles.totalRow}>
                      <span>Original Total</span>
                      <span>₹{order.totals.originalTotal}</span>
                    </div>
                    {order.totals.totalSavings > 0 && (
                      <div style={{...styles.totalRow, color: '#4CAF50'}}>
                        <span>Discount</span>
                        <span>-₹{order.totals.totalSavings}</span>
                      </div>
                    )}
                    <div style={{...styles.totalRow, ...styles.grandTotal}}>
                      <span>Total Paid</span>
                      <span>₹{order.totals.discountedTotal}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  {order.paymentMethod && (
                    <div style={styles.paymentMethod}>
                      💳 Payment: {order.paymentMethod}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <button style={styles.refreshButton} onClick={fetchOrders}>
        🔄 Refresh
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '2rem',
    margin: '0 0 10px 0',
    color: '#333'
  },
  subtitle: {
    margin: 0,
    color: '#666'
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
    borderTop: '4px solid #333',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px'
  },
  filterSection: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  filterButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '12px'
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '20px'
  },
  ordersContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'box-shadow 0.2s'
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  orderInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  platformBadge: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  orderId: {
    fontSize: '12px',
    color: '#888',
    fontFamily: 'monospace'
  },
  statusBadge: {
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  restaurantRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  restaurantIcon: {
    fontSize: '18px'
  },
  restaurantName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  dateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#666',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  deliveryTime: {
    color: '#888'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #eee'
  },
  orderTotal: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#333'
  },
  savingsRow: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    marginTop: '10px',
    textAlign: 'center'
  },
  expandButton: {
    width: '100%',
    padding: '10px',
    marginTop: '12px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#666',
    transition: 'background-color 0.2s'
  },
  orderDetails: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px dashed #ddd'
  },
  itemsHeader: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#333'
  },
  itemRow: {
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  itemInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px'
  },
  itemName: {
    fontWeight: '500'
  },
  itemQty: {
    color: '#666',
    fontSize: '13px'
  },
  itemPrices: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  originalPrice: {
    textDecoration: 'line-through',
    color: '#999',
    fontSize: '13px'
  },
  effectivePrice: {
    fontWeight: '600',
    color: '#333'
  },
  itemOffer: {
    fontSize: '12px',
    color: '#e65100',
    marginTop: '4px'
  },
  totalsBreakdown: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px'
  },
  grandTotal: {
    paddingTop: '8px',
    borderTop: '1px solid #ddd',
    marginBottom: 0,
    fontWeight: '700',
    fontSize: '16px'
  },
  paymentMethod: {
    marginTop: '12px',
    fontSize: '13px',
    color: '#666'
  },
  refreshButton: {
    display: 'block',
    margin: '20px auto 0',
    padding: '12px 24px',
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }
};

export default OrderHistory;
