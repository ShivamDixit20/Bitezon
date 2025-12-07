import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000/api';

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

  const handleCheckout = async () => {
    try {
      setCheckingOut(true);
      setError(null);
      
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

        {error && <div style={styles.error}>❌ {error}</div>}

        {/* Restaurant Info */}
        <div style={styles.restaurantSection}>
          <div style={styles.restaurantIcon}>🏪</div>
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
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
  },
  backButton: {
    background: 'none',
    border: '1px solid #ddd',
    padding: '8px 16px',
    borderRadius: '5px',
    cursor: 'pointer',
    marginBottom: '20px',
    color: '#666',
  },
  checkoutCard: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px',
    background: '#f8f9fa',
    borderBottom: '1px solid #eee',
  },
  platformIcon: {
    fontSize: '32px',
  },
  title: {
    margin: 0,
    fontSize: '22px',
  },
  error: {
    background: '#fee',
    color: '#c00',
    padding: '12px 20px',
    margin: '15px 20px 0',
    borderRadius: '8px',
  },
  restaurantSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '15px 20px',
    background: '#f0f7ff',
    borderBottom: '1px solid #eee',
  },
  restaurantIcon: {
    fontSize: '24px',
  },
  restaurantName: {
    fontWeight: '600',
    fontSize: '16px',
  },
  itemCount: {
    color: '#666',
    fontSize: '13px',
  },
  itemsSection: {
    padding: '15px 20px',
    borderBottom: '1px solid #eee',
  },
  sectionTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    color: '#2c3e50',
  },
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px dashed #eee',
  },
  itemInfo: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  itemName: {
    fontWeight: '500',
  },
  itemQty: {
    color: '#666',
    fontSize: '14px',
  },
  itemPrice: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  originalPrice: {
    color: '#999',
    textDecoration: 'line-through',
    fontSize: '13px',
  },
  finalPrice: {
    fontWeight: '600',
    color: '#2e7d32',
  },
  billSection: {
    padding: '15px 20px',
    background: '#f8f9fa',
  },
  billRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
  },
  savingsRow: {
    color: '#2e7d32',
  },
  billDivider: {
    height: '1px',
    background: '#ddd',
    margin: '10px 0',
  },
  totalRow: {
    fontWeight: '700',
    fontSize: '18px',
    color: '#2c3e50',
  },
  actions: {
    padding: '20px',
  },
  paymentNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    background: '#fff3cd',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '14px',
  },
  checkoutButton: {
    width: '100%',
    padding: '16px',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  redirectSection: {
    padding: '20px',
    textAlign: 'center',
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '10px',
  },
  orderDetails: {
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '15px',
    margin: '20px 0',
    textAlign: 'left',
  },
  orderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: '14px',
  },
  orderTotal: {
    fontWeight: '700',
    fontSize: '16px',
    borderTop: '1px solid #ddd',
    marginTop: '8px',
    paddingTop: '12px',
  },
  redirectButton: {
    width: '100%',
    padding: '16px',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '15px',
  },
  alternateLinks: {
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  emptyCheckout: {
    textAlign: 'center',
    padding: '40px',
  },
  howItWorks: {
    marginTop: '20px',
    padding: '20px',
    background: '#e3f2fd',
    borderRadius: '10px',
    fontSize: '14px',
  },
};

export default Checkout;
