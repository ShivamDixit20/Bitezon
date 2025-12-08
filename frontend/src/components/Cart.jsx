import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000/api';

const Cart = ({ onCheckout }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

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

  const updateQuantity = async (platform, itemId, quantity) => {
    if (quantity < 1) return;
    try {
      const response = await fetch(`${API_BASE}/cart/update-quantity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, itemId, quantity })
      });
      const data = await response.json();
      if (data.success) {
        setCart(data.cart);
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const removeItem = async (platform, itemId) => {
    try {
      const response = await fetch(`${API_BASE}/cart/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, itemId, removeAll: true })
      });
      const data = await response.json();
      if (data.success) {
        setCart(data.cart);
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const clearCart = async (platform) => {
    try {
      const response = await fetch(`${API_BASE}/cart/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      });
      const data = await response.json();
      if (data.success) {
        setCart(data.cart);
      }
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  const saveOrderToHistory = async (platform) => {
    try {
      const platformCart = cart?.[platform];
      const totals = cart?.totals?.[platform];
      
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      const userId = userData?._id || userData?.id;
      
      if (!userId) {
        console.error('User ID not found');
        return false;
      }
      
      if (!platformCart || !platformCart.items || platformCart.items.length === 0) {
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
          discountedTotal: totals?.subtotal || platformCart.items.reduce((sum, i) => sum + ((i.effectivePrice !== undefined ? i.effectivePrice : i.originalPrice || 0) * (i.quantity || 1)), 0),
          totalSavings: totals?.savings || 0
        },
        paymentMethod: 'Via ' + (platform === 'swiggy' ? 'Swiggy' : 'Zomato') + ' App'
      };

      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      const result = await response.json();
      return result.success;
    } catch (err) {
      console.error('Failed to save order to history:', err);
      return false;
    }
  };

  const handleCheckout = async (platform) => {
    try {
      setCheckoutLoading(platform);
      
      await saveOrderToHistory(platform);
      
      const response = await fetch(`${API_BASE}/cart/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      });
      const data = await response.json();
      
      if (data.success) {
        const { redirectUrl, webUrl } = data.checkout;
        
        if (onCheckout) {
          onCheckout(data.checkout);
        }
        
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = redirectUrl;
          document.body.appendChild(iframe);
          
          setTimeout(() => {
            document.body.removeChild(iframe);
            window.open(webUrl, '_blank');
          }, 2000);
        } else {
          window.open(webUrl, '_blank');
        }
        
        await clearCart(platform);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <p>{error}</p>
        <button onClick={fetchCart} style={styles.retryButton}>Retry</button>
      </div>
    );
  }

  const swiggyEmpty = !cart?.swiggy?.items?.length;
  const zomatoEmpty = !cart?.zomato?.items?.length;
  const bothEmpty = swiggyEmpty && zomatoEmpty;

  return (
    <div style={styles.pageWrapper}>
      <h1 style={styles.pageTitle}>Your Cart</h1>
      
      {bothEmpty ? (
        <div style={styles.emptyCart}>
          <h3>Your cart is empty</h3>
          <p>Add items from the home page to start building your order!</p>
        </div>
      ) : (
        <div style={styles.mainLayout}>
          {/* Left Side - Cart Items */}
          <div style={styles.leftSection}>
            {/* Zomato Section */}
            {!zomatoEmpty && (
              <div style={styles.platformSection}>
                <h2 style={styles.platformTitle}>From Zomato</h2>
                
                <div style={styles.itemsList}>
                  {cart.zomato.items.map((item) => (
                    <div key={item.itemId} style={styles.cartItem}>
                      <div style={styles.itemImage}></div>
                      <div style={styles.itemInfo}>
                        <h4 style={styles.itemName}>{item.itemName}</h4>
                        <p style={styles.itemPrice}>₹{item.originalPrice}</p>
                      </div>
                      <div style={styles.quantitySection}>
                        <button
                          style={styles.minusBtn}
                          onClick={() => updateQuantity('zomato', item.itemId, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span style={styles.qty}>{item.quantity}</span>
                        <button
                          style={styles.plusBtn}
                          onClick={() => updateQuantity('zomato', item.itemId, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button
                          style={styles.deleteBtn}
                          onClick={() => removeItem('zomato', item.itemId)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Swiggy Section */}
            {!swiggyEmpty && (
              <div style={styles.platformSection}>
                <h2 style={styles.platformTitle}>From Swiggy</h2>
                
                <div style={styles.itemsList}>
                  {cart.swiggy.items.map((item) => (
                    <div key={item.itemId} style={styles.cartItem}>
                      <div style={styles.itemImage}></div>
                      <div style={styles.itemInfo}>
                        <h4 style={styles.itemName}>{item.itemName}</h4>
                        <p style={styles.itemPrice}>₹{item.originalPrice}</p>
                      </div>
                      <div style={styles.quantitySection}>
                        <button
                          style={styles.minusBtn}
                          onClick={() => updateQuantity('swiggy', item.itemId, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span style={styles.qty}>{item.quantity}</span>
                        <button
                          style={styles.plusBtn}
                          onClick={() => updateQuantity('swiggy', item.itemId, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button
                          style={styles.deleteBtn}
                          onClick={() => removeItem('swiggy', item.itemId)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Order Summary */}
          <div style={styles.rightSection}>
            <div style={styles.summaryCard}>
              <h2 style={styles.summaryTitle}>Order Summary</h2>

              {/* Zomato Summary */}
              {!zomatoEmpty && (
                <div style={styles.summaryBlock}>
                  <h3 style={styles.summarySubtitle}>Price Details (Zomato)</h3>
                  <div style={styles.summaryRow}>
                    <span>Subtotal</span>
                    <span>₹{cart.totals.zomato.originalTotal}</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>Delivery & Taxes</span>
                    <span>₹{Math.round((cart.totals.zomato.originalTotal - cart.totals.zomato.subtotal + cart.totals.zomato.savings))}</span>
                  </div>
                  {cart.totals.zomato.savings > 0 && (
                    <div style={{...styles.summaryRow, ...styles.discountRow}}>
                      <span>Discount</span>
                      <span>-₹{cart.totals.zomato.savings}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Swiggy Summary */}
              {!swiggyEmpty && (
                <div style={styles.summaryBlock}>
                  <h3 style={styles.summarySubtitle}>Price Details (Swiggy)</h3>
                  <div style={styles.summaryRow}>
                    <span>Subtotal</span>
                    <span>₹{cart.totals.swiggy.originalTotal}</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span>Delivery & Taxes</span>
                    <span>₹{Math.round((cart.totals.swiggy.originalTotal - cart.totals.swiggy.subtotal + cart.totals.swiggy.savings))}</span>
                  </div>
                  {cart.totals.swiggy.savings > 0 && (
                    <div style={{...styles.summaryRow, ...styles.discountRow}}>
                      <span>Discount</span>
                      <span>-₹{cart.totals.swiggy.savings}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Savings Banner */}
              {(cart.totals.zomato.savings > 0 || cart.totals.swiggy.savings > 0) && (
                <div style={styles.savingsBanner}>
                  <p style={styles.savingsText}>
                    You are saving a total of ₹{cart.totals.zomato.savings + cart.totals.swiggy.savings}!
                  </p>
                </div>
              )}

              {/* Checkout Buttons */}
              <div style={styles.checkoutSection}>
                {!zomatoEmpty && (
                  <div style={styles.priceBlock}>
                    <div>
                      <p style={styles.checkoutLabel}>To Pay on</p>
                      <p style={styles.checkoutPlatform}>Zomato</p>
                    </div>
                    <p style={styles.checkoutPrice}>₹{cart.totals.zomato.subtotal}</p>
                  </div>
                )}

                {!zomatoEmpty && (
                  <button
                    style={{...styles.checkoutBtn, ...styles.zomatoBtn}}
                    onClick={() => handleCheckout('zomato')}
                    disabled={checkoutLoading === 'zomato'}
                  >
                    {checkoutLoading === 'zomato' ? 'Processing...' : `Checkout on Zomato (₹${cart.totals.zomato.subtotal})`}
                  </button>
                )}

                {!swiggyEmpty && (
                  <div style={styles.priceBlock}>
                    <div>
                      <p style={styles.checkoutLabel}>To Pay on</p>
                      <p style={styles.checkoutPlatform}>Swiggy</p>
                    </div>
                    <p style={styles.checkoutPrice}>₹{cart.totals.swiggy.subtotal}</p>
                  </div>
                )}

                {!swiggyEmpty && (
                  <button
                    style={styles.swiggyCheckoutBtn}
                    onClick={() => handleCheckout('swiggy')}
                    disabled={checkoutLoading === 'swiggy'}
                  >
                    {checkoutLoading === 'swiggy' ? 'Processing...' : `Checkout on Swiggy (₹${cart.totals.swiggy.subtotal})`}
                  </button>
                )}
              </div>

              {/* Info Message */}
              <div style={styles.infoBox}>
                <p style={styles.infoText}>💬 Common orders are not processed. All delivery times will be confirmed on the merchant's website.</p>
              </div>
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
    backgroundColor: '#f5f5f5',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '24px',
    color: '#1a1a1a'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid rgb(239, 79, 95)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    borderRadius: '8px'
  },
  retryButton: {
    padding: '10px 20px',
    background: 'rgb(239, 79, 95)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '12px',
    fontWeight: '600'
  },
  emptyCart: {
    textAlign: 'center',
    padding: '60px 20px',
    background: '#fff',
    borderRadius: '12px'
  },
  emptyIcon: {
    fontSize: '64px',
    display: 'block',
    marginBottom: '16px'
  },
  mainLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '24px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  platformSection: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
  },
  platformTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#1a1a1a'
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #f0f0f0'
  },
  itemImage: {
    fontSize: '32px',
    minWidth: '50px',
    textAlign: 'center'
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: '500',
    color: '#1a1a1a'
  },
  itemPrice: {
    margin: '0',
    fontSize: '14px',
    color: '#666'
  },
  quantitySection: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  minusBtn: {
    width: '28px',
    height: '28px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  plusBtn: {
    width: '28px',
    height: '28px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  qty: {
    minWidth: '24px',
    textAlign: 'center',
    fontWeight: '600',
    color: '#1a1a1a'
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px 8px'
  },
  rightSection: {
    position: 'sticky',
    top: '20px',
    height: 'fit-content'
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
  },
  summaryTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#1a1a1a'
  },
  summaryBlock: {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f0f0f0'
  },
  summarySubtitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#666',
    marginBottom: '12px',
    margin: '0 0 12px 0'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    marginBottom: '8px',
    color: '#555'
  },
  discountRow: {
    color: 'rgb(239, 79, 95)',
    fontWeight: '600'
  },
  savingsBanner: {
    backgroundColor: '#dcfce7',
    border: '1px solid #22c55e',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px'
  },
  savingsText: {
    margin: '0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#15803d',
    textAlign: 'center'
  },
  checkoutSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  priceBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0'
  },
  checkoutLabel: {
    margin: '0',
    fontSize: '12px',
    color: '#666'
  },
  checkoutPlatform: {
    margin: '4px 0 0 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a'
  },
  checkoutPrice: {
    margin: '0',
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a1a1a'
  },
  checkoutBtn: {
    padding: '12px 16px',
    backgroundColor: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  },
  zomatoBtn: {
    backgroundColor: 'rgb(239, 79, 95)'
  },
  swiggyCheckoutBtn: {
    padding: '12px 16px',
    backgroundColor: 'rgb(239, 79, 95)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  },
  infoBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '16px'
  },
  infoText: {
    margin: '0',
    fontSize: '12px',
    color: '#666',
    lineHeight: '1.4'
  }
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    [style*="gridTemplateColumns: 1fr 400px"] {
      grid-template-columns: 1fr !important;
    }
    
    [style*="position: sticky"] {
      position: static !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Cart;
