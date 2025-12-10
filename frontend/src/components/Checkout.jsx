import React, { useState, useEffect } from 'react';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`;

const Checkout = ({ platform, onBack, onComplete }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/cart`);
      const data = await response.json();
      if (data.success) {
        setCart(data.cart);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  const saveOrderToHistory = async () => {
    try {
      const platformCart = cart?.[platform];
      const totals = cart?.totals?.[platform];
      
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      const userId = userData?._id || userData?.id;
      
      if (!userId) {
        console.error('User ID not found - cannot save order');
        return false;
      }
      
      console.log('Cart data:', cart);
      console.log('Platform cart:', platformCart);
      console.log('Totals:', totals);
      
      if (!platformCart || !platformCart.items || platformCart.items.length === 0) {
        console.error('No cart data to save - cart is empty or missing');
        return false;
      }

      const orderData = {
        userId,
        platform,
        restaurantId: platformCart.restaurantId,
        restaurantName: platformCart.restaurantName,
        items: platformCart.items.map(item => ({
          itemId: item.itemId || 'unknown',
          itemName: item.itemName,
          quantity: item.quantity || 1,
          originalPrice: item.originalPrice || 0,
          effectivePrice: item.effectivePrice !== undefined ? item.effectivePrice : item.originalPrice,
          offer: item.offer || null
        })),
        totals: {
          totalItems: totals?.totalItems || platformCart.items.reduce((sum, i) => sum + (i.quantity || 1), 0),
          originalTotal: totals?.originalTotal || platformCart.items.reduce((sum, i) => sum + ((i.originalPrice || 0) * (i.quantity || 1)), 0),
          discountedTotal: totals?.subtotal || totals?.discountedTotal || platformCart.items.reduce((sum, i) => sum + ((i.effectivePrice !== undefined ? i.effectivePrice : i.originalPrice || 0) * (i.quantity || 1)), 0),
          totalSavings: totals?.savings || totals?.totalSavings || 0
        },
        paymentMethod: 'Via ' + (platform === 'swiggy' ? 'Swiggy' : 'Zomato') + ' App'
      };

      console.log('Saving order data:', JSON.stringify(orderData, null, 2));

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      
      const result = await response.json();
      console.log('Order save result:', result);
      return result.success;
    } catch (err) {
      console.error('Failed to save order to history:', err);
      return false;
    }
  };

  const handleCheckout = async () => {
    try {
      setCheckingOut(true);
      setError(null);
      
      // Save order to history FIRST (before checkout clears anything)
      const orderSaved = await saveOrderToHistory();
      console.log('Order saved status:', orderSaved);
      
      const response = await fetch(`${API_BASE}/cart/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCheckoutData(data.checkout);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to process checkout');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleRedirect = () => {
    if (!checkoutData) return;
    
    const { redirectUrl, webUrl } = checkoutData;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try app first
      window.location.href = redirectUrl;
      
      // Fallback to web after delay
      setTimeout(() => {
        window.open(webUrl, '_blank');
      }, 2500);
    } else {
      // Desktop - open web version
      window.open(webUrl, '_blank');
    }
    
    // Clear cart and complete
    if (onComplete) {
      onComplete(platform);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading checkout...</div>
      </div>
    );
  }

  const platformCart = cart?.[platform];
  const totals = cart?.totals?.[platform];
  const platformColor = platform === 'swiggy' ? '#fc8019' : '#e23744';
  const platformName = platform === 'swiggy' ? 'Swiggy' : 'Zomato';
  const platformIcon = platform === 'swiggy' ? '🟧' : '🔴';

  if (!platformCart || platformCart.items.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyCheckout}>
          <h2>No items in {platformName} cart</h2>
          <button style={styles.backButton} onClick={onBack}>← Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={onBack}>← Back to Cart</button>
      
      <div style={{...styles.checkoutCard, borderTop: `4px solid ${platformColor}`}}>
        <div style={styles.header}>
          <span style={styles.platformIcon}>{platformIcon}</span>
          <h2 style={styles.title}>Checkout - {platformName}</h2>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Restaurant Info */}
        <div style={styles.restaurantSection}>
          <div>
            <div style={styles.restaurantName}>{platformCart.restaurantName}</div>
            <div style={styles.itemCount}>{totals.totalItems} item(s)</div>
          </div>
        </div>

        {/* Order Items */}
        <div style={styles.itemsSection}>
          <h3 style={styles.sectionTitle}>Order Summary</h3>
          {platformCart.items.map((item, index) => (
            <div key={index} style={styles.orderItem}>
              <div style={styles.itemInfo}>
                <span style={styles.itemName}>{item.itemName}</span>
                <span style={styles.itemQty}>x{item.quantity}</span>
              </div>
              <div style={styles.itemPrice}>
                {item.effectivePrice < item.originalPrice && (
                  <span style={styles.originalPrice}>₹{(item.originalPrice * item.quantity).toFixed(0)}</span>
                )}
                <span style={styles.finalPrice}>₹{(item.effectivePrice * item.quantity).toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bill Details */}
        <div style={styles.billSection}>
          <h3 style={styles.sectionTitle}>Bill Details</h3>
          <div style={styles.billRow}>
            <span>Item Total</span>
            <span>₹{totals.originalTotal}</span>
          </div>
          {totals.savings > 0 && (
            <div style={{...styles.billRow, ...styles.savingsRow}}>
              <span>Discount</span>
              <span>-₹{totals.savings}</span>
            </div>
          )}
          <div style={styles.billDivider}></div>
          <div style={{...styles.billRow, ...styles.totalRow}}>
            <span>To Pay</span>
            <span>₹{totals.subtotal}</span>
          </div>
        </div>

        {/* Checkout Actions */}
        {!checkoutData ? (
          <div style={styles.actions}>
            <div style={styles.paymentNote}>
              <span>💳</span>
              <span>You'll complete payment on {platformName}</span>
            </div>
            <button
              style={{...styles.checkoutButton, background: platformColor}}
              onClick={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? 'Processing...' : `Proceed to ${platformName} →`}
            </button>
          </div>
        ) : (
          <div style={styles.redirectSection}>
            <div style={styles.successIcon}>✅</div>
            <h3>Order Ready!</h3>
            <p>Your order summary has been prepared. Click below to complete your order on {platformName}.</p>
            
            <div style={styles.orderDetails}>
              <div style={styles.orderRow}>
                <span>Restaurant:</span>
                <span>{checkoutData.orderSummary.restaurant.name}</span>
              </div>
              <div style={styles.orderRow}>
                <span>Items:</span>
                <span>{checkoutData.orderSummary.items.length}</span>
              </div>
              <div style={{...styles.orderRow, ...styles.orderTotal}}>
                <span>Total:</span>
                <span>₹{checkoutData.orderSummary.totals.subtotal}</span>
              </div>
            </div>
            
            <button
              style={{...styles.redirectButton, background: platformColor}}
              onClick={handleRedirect}
            >
              Open {platformName} App / Website →
            </button>
            
            <div style={styles.alternateLinks}>
              <a 
                href={checkoutData.webUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{color: platformColor}}
              >
                Open {platformName} Website
              </a>
            </div>
          </div>
        )}
      </div>

      {/* How it works */}
      <div style={styles.howItWorks}>
        <h4>How it works:</h4>
        <ol>
          <li>Click "Proceed to {platformName}"</li>
          <li>You'll be redirected to the {platformName} app or website</li>
          <li>Add the same items to your cart on {platformName}</li>
          <li>Complete payment directly on {platformName}</li>
        </ol>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    minHeight: 'calc(100vh - 80px)',
  },
  backButton: {
    background: 'none',
    border: '1px solid #ddd',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '20px',
    color: '#666',
    fontSize: '15px',
    transition: 'all 0.2s',
  },
  checkoutCard: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '24px',
    background: '#f8f9fa',
    borderBottom: '1px solid #eee',
  },
  platformIcon: {
    fontSize: '36px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
  },
  error: {
    background: '#fee',
    color: '#c00',
    padding: '14px 24px',
    margin: '15px 24px 0',
    borderRadius: '10px',
    fontSize: '15px',
  },
  restaurantSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '18px 24px',
    background: '#f0f7ff',
    borderBottom: '1px solid #eee',
  },
  restaurantIcon: {
    fontSize: '28px',
  },
  restaurantName: {
    fontWeight: '600',
    fontSize: '18px',
  },
  itemCount: {
    color: '#666',
    fontSize: '14px',
  },
  itemsSection: {
    padding: '20px 24px',
    borderBottom: '1px solid #eee',
  },
  sectionTitle: {
    margin: '0 0 18px 0',
    fontSize: '18px',
    color: '#2c3e50',
  },
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px dashed #eee',
  },
  itemInfo: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  itemName: {
    fontWeight: '500',
    fontSize: '15px',
  },
  itemQty: {
    color: '#666',
    fontSize: '14px',
  },
  itemPrice: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  originalPrice: {
    color: '#999',
    textDecoration: 'line-through',
    fontSize: '14px',
  },
  finalPrice: {
    fontWeight: '600',
    color: '#2e7d32',
    fontSize: '16px',
  },
  billSection: {
    padding: '20px 24px',
    background: '#f8f9fa',
  },
  billRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    fontSize: '15px',
  },
  savingsRow: {
    color: '#2e7d32',
    fontWeight: '500',
  },
  billDivider: {
    height: '1px',
    background: '#ddd',
    margin: '12px 0',
  },
  totalRow: {
    fontWeight: '700',
    fontSize: '20px',
    color: '#2c3e50',
  },
  actions: {
    padding: '24px',
  },
  paymentNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px',
    background: '#fff3cd',
    borderRadius: '10px',
    marginBottom: '18px',
    fontSize: '15px',
  },
  checkoutButton: {
    width: '100%',
    padding: '18px',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '17px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  redirectSection: {
    padding: '24px',
    textAlign: 'center',
  },
  successIcon: {
    fontSize: '56px',
    marginBottom: '12px',
  },
  orderDetails: {
    background: '#f8f9fa',
    borderRadius: '10px',
    padding: '18px',
    margin: '24px 0',
    textAlign: 'left',
  },
  orderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '15px',
  },
  orderTotal: {
    fontWeight: '700',
    fontSize: '18px',
    borderTop: '1px solid #ddd',
    marginTop: '10px',
    paddingTop: '14px',
  },
  redirectButton: {
    width: '100%',
    padding: '18px',
    border: 'none',
    borderRadius: '12px',
    color: 'white',
    fontSize: '17px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '18px',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  alternateLinks: {
    fontSize: '15px',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    color: '#666',
    fontSize: '18px',
  },
  emptyCheckout: {
    textAlign: 'center',
    padding: '60px',
  },
  howItWorks: {
    marginTop: '24px',
    padding: '24px',
    background: '#e3f2fd',
    borderRadius: '12px',
    fontSize: '15px',
  },
};

export default Checkout;
