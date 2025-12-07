import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000/api';

const Cart = ({ onCheckout }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  // Fetch cart on mount
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

  // Save order to history
  const saveOrderToHistory = async (platform) => {
    try {
      const platformCart = cart?.[platform];
      const totals = cart?.totals?.[platform];
      
      if (!platformCart || !platformCart.items || platformCart.items.length === 0) {
        console.error('No cart data to save');
        return false;
      }

      const orderData = {
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

      console.log('Saving order to history:', orderData);

      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      const result = await response.json();
      console.log('Order saved:', result);
      return result.success;
    } catch (err) {
      console.error('Failed to save order to history:', err);
      return false;
    }
  };

  const handleCheckout = async (platform) => {
    try {
      setCheckoutLoading(platform);
      
      // Save order to history FIRST (before checkout clears anything)
      await saveOrderToHistory(platform);
      
      const response = await fetch(`${API_BASE}/cart/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      });
      const data = await response.json();
      
      if (data.success) {
        // Try to open the app, fallback to web
        const { redirectUrl, webUrl, orderSummary } = data.checkout;
        
        // Show order summary before redirect
        if (onCheckout) {
          onCheckout(data.checkout);
        }
        
        // Try app deep link first, then fallback to web
        const tryAppLink = () => {
          // Create a hidden iframe to try the deep link
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = redirectUrl;
          document.body.appendChild(iframe);
          
          // Fallback to web after 2 seconds if app doesn't open
          setTimeout(() => {
            document.body.removeChild(iframe);
            window.open(webUrl, '_blank');
          }, 2000);
        };
        
        // For mobile, try deep link. For desktop, go to web
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
          tryAppLink();
        } else {
          window.open(webUrl, '_blank');
        }
        
        // Clear the cart after checkout
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
        <p>❌ {error}</p>
        <button onClick={fetchCart} style={styles.retryButton}>Retry</button>
      </div>
    );
  }

  const swiggyEmpty = !cart?.swiggy?.items?.length;
  const zomatoEmpty = !cart?.zomato?.items?.length;
  const bothEmpty = swiggyEmpty && zomatoEmpty;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🛒 Your Cart</h2>
      
      {bothEmpty ? (
        <div style={styles.emptyCart}>
          <span style={styles.emptyIcon}>🛒</span>
          <h3>Your cart is empty</h3>
          <p>Add items from the Compare tab to start building your order!</p>
        </div>
      ) : (
        <div style={styles.cartsContainer}>
          {/* Swiggy Cart */}
          <div style={{...styles.platformCart, ...styles.swiggyCart}}>
            <div style={styles.platformHeader}>
              <span style={styles.platformLogo}>🟧</span>
              <h3 style={styles.platformName}>Swiggy Cart</h3>
            </div>
            
            {swiggyEmpty ? (
              <div style={styles.emptyPlatformCart}>
                <p>No items from Swiggy</p>
              </div>
            ) : (
              <>
                <div style={styles.restaurantInfo}>
                  <span>🏪</span>
                  <span>{cart.swiggy.restaurantName}</span>
                </div>
                
                <div style={styles.itemsList}>
                  {cart.swiggy.items.map((item) => (
                    <div key={item.itemId} style={styles.cartItem}>
                      <div style={styles.itemDetails}>
                        <span style={styles.itemName}>{item.itemName}</span>
                        {item.offer && (
                          <span style={styles.itemOffer}>{item.offer}</span>
                        )}
                        <div style={styles.priceRow}>
                          {item.effectivePrice < item.originalPrice && (
                            <span style={styles.originalPrice}>₹{item.originalPrice}</span>
                          )}
                          <span style={styles.effectivePrice}>₹{item.effectivePrice}</span>
                        </div>
                      </div>
                      <div style={styles.quantityControls}>
                        <button
                          style={styles.qtyButton}
                          onClick={() => updateQuantity('swiggy', item.itemId, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span style={styles.quantity}>{item.quantity}</span>
                        <button
                          style={styles.qtyButton}
                          onClick={() => updateQuantity('swiggy', item.itemId, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button
                          style={styles.removeButton}
                          onClick={() => removeItem('swiggy', item.itemId)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={styles.cartSummary}>
                  <div style={styles.summaryRow}>
                    <span>Items Total</span>
                    <span>₹{cart.totals.swiggy.originalTotal}</span>
                  </div>
                  {cart.totals.swiggy.savings > 0 && (
                    <div style={{...styles.summaryRow, ...styles.savingsRow}}>
                      <span>Savings</span>
                      <span>-₹{cart.totals.swiggy.savings}</span>
                    </div>
                  )}
                  <div style={{...styles.summaryRow, ...styles.totalRow}}>
                    <span>To Pay</span>
                    <span>₹{cart.totals.swiggy.subtotal}</span>
                  </div>
                </div>
                
                <div style={styles.cartActions}>
                  <button
                    style={styles.clearButton}
                    onClick={() => clearCart('swiggy')}
                  >
                    Clear Cart
                  </button>
                  <button
                    style={{...styles.checkoutButton, ...styles.swiggyCheckout}}
                    onClick={() => handleCheckout('swiggy')}
                    disabled={checkoutLoading === 'swiggy'}
                  >
                    {checkoutLoading === 'swiggy' ? 'Redirecting...' : 'Checkout on Swiggy →'}
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Zomato Cart */}
          <div style={{...styles.platformCart, ...styles.zomatoCart}}>
            <div style={styles.platformHeader}>
              <span style={styles.platformLogo}>🔴</span>
              <h3 style={styles.platformName}>Zomato Cart</h3>
            </div>
            
            {zomatoEmpty ? (
              <div style={styles.emptyPlatformCart}>
                <p>No items from Zomato</p>
              </div>
            ) : (
              <>
                <div style={styles.restaurantInfo}>
                  <span>🏪</span>
                  <span>{cart.zomato.restaurantName}</span>
                </div>
                
                <div style={styles.itemsList}>
                  {cart.zomato.items.map((item) => (
                    <div key={item.itemId} style={styles.cartItem}>
                      <div style={styles.itemDetails}>
                        <span style={styles.itemName}>{item.itemName}</span>
                        {item.offer && (
                          <span style={styles.itemOffer}>{item.offer}</span>
                        )}
                        <div style={styles.priceRow}>
                          {item.effectivePrice < item.originalPrice && (
                            <span style={styles.originalPrice}>₹{item.originalPrice}</span>
                          )}
                          <span style={styles.effectivePrice}>₹{item.effectivePrice}</span>
                        </div>
                      </div>
                      <div style={styles.quantityControls}>
                        <button
                          style={styles.qtyButton}
                          onClick={() => updateQuantity('zomato', item.itemId, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span style={styles.quantity}>{item.quantity}</span>
                        <button
                          style={styles.qtyButton}
                          onClick={() => updateQuantity('zomato', item.itemId, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button
                          style={styles.removeButton}
                          onClick={() => removeItem('zomato', item.itemId)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={styles.cartSummary}>
                  <div style={styles.summaryRow}>
                    <span>Items Total</span>
                    <span>₹{cart.totals.zomato.originalTotal}</span>
                  </div>
                  {cart.totals.zomato.savings > 0 && (
                    <div style={{...styles.summaryRow, ...styles.savingsRow}}>
                      <span>Savings</span>
                      <span>-₹{cart.totals.zomato.savings}</span>
                    </div>
                  )}
                  <div style={{...styles.summaryRow, ...styles.totalRow}}>
                    <span>To Pay</span>
                    <span>₹{cart.totals.zomato.subtotal}</span>
                  </div>
                </div>
                
                <div style={styles.cartActions}>
                  <button
                    style={styles.clearButton}
                    onClick={() => clearCart('zomato')}
                  >
                    Clear Cart
                  </button>
                  <button
                    style={{...styles.checkoutButton, ...styles.zomatoCheckout}}
                    onClick={() => handleCheckout('zomato')}
                    disabled={checkoutLoading === 'zomato'}
                  >
                    {checkoutLoading === 'zomato' ? 'Redirecting...' : 'Checkout on Zomato →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Cart Tips */}
      <div style={styles.tips}>
        <h4>💡 Tips</h4>
        <ul>
          <li>Compare prices in the Compare tab before adding to cart</li>
          <li>Items with 🏆 are the best deals</li>
          <li>Checkout redirects you to the actual app for payment</li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    fontSize: '28px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    color: '#e74c3c',
  },
  retryButton: {
    padding: '10px 20px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  emptyCart: {
    textAlign: 'center',
    padding: '60px 20px',
    background: '#f8f9fa',
    borderRadius: '12px',
  },
  emptyIcon: {
    fontSize: '64px',
    display: 'block',
    marginBottom: '20px',
  },
  cartsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '20px',
  },
  platformCart: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  swiggyCart: {
    borderTop: '4px solid #fc8019',
  },
  zomatoCart: {
    borderTop: '4px solid #e23744',
  },
  platformHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '15px 20px',
    background: '#f8f9fa',
    borderBottom: '1px solid #eee',
  },
  platformLogo: {
    fontSize: '24px',
  },
  platformName: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
  },
  emptyPlatformCart: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#999',
    fontSize: '16px',
  },
  restaurantInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: '#f0f7ff',
    fontSize: '16px',
    color: '#2c3e50',
  },
  itemsList: {
    padding: '10px 20px',
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #eee',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    display: 'block',
    fontWeight: '500',
    marginBottom: '4px',
    fontSize: '16px',
  },
  itemOffer: {
    display: 'inline-block',
    fontSize: '12px',
    background: '#e8f5e9',
    color: '#2e7d32',
    padding: '2px 6px',
    borderRadius: '3px',
    marginBottom: '4px',
  },
  priceRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: '15px',
    color: '#999',
    textDecoration: 'line-through',
  },
  effectivePrice: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2e7d32',
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  qtyButton: {
    width: '28px',
    height: '28px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    minWidth: '20px',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '16px',
  },
  removeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px',
    marginLeft: '8px',
  },
  cartSummary: {
    padding: '15px 20px',
    background: '#f8f9fa',
    borderTop: '1px solid #eee',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '16px',
  },
  savingsRow: {
    color: '#2e7d32',
  },
  totalRow: {
    fontWeight: '700',
    fontSize: '18px',
    paddingTop: '8px',
    borderTop: '1px solid #ddd',
    marginTop: '8px',
  },
  cartActions: {
    display: 'flex',
    gap: '10px',
    padding: '15px 20px',
    borderTop: '1px solid #eee',
  },
  clearButton: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
  },
  checkoutButton: {
    flex: 2,
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
  },
  swiggyCheckout: {
    background: '#fc8019',
  },
  zomatoCheckout: {
    background: '#e23744',
  },
  tips: {
    marginTop: '30px',
    padding: '20px',
    background: '#fff3cd',
    borderRadius: '8px',
    fontSize: '14px',
  },
};

// Add keyframes for spinner animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Cart;
