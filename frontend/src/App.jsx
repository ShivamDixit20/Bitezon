import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import SwiggyTest from './components/SwiggyTest';
import ZomatoTest from './components/ZomatoTest';
import CompareDeals from './components/CompareDeals';
import Cart from './components/Cart';
import Checkout from './components/Checkout';

function App() {
  const [view, setView] = useState('compare'); // 'login', 'register', 'profile', 'swiggy', 'zomato', 'compare', 'cart', 'checkout'
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [checkoutPlatform, setCheckoutPlatform] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setView('profile');
    }
    
    // Fetch initial cart count
    fetchCartCount();
  }, []);

  const fetchCartCount = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/cart');
      const data = await response.json();
      if (data.success && data.cart.totals) {
        const total = data.cart.totals.swiggy.totalItems + data.cart.totals.zomato.totalItems;
        setCartCount(total);
      }
    } catch (err) {
      console.error('Failed to fetch cart count:', err);
    }
  };

  const handleCartUpdate = (cart) => {
    if (cart && cart.totals) {
      const total = cart.totals.swiggy.totalItems + cart.totals.zomato.totalItems;
      setCartCount(total);
    }
  };

  const handleCheckout = (platform) => {
    setCheckoutPlatform(platform);
    setView('checkout');
  };

  const handleCheckoutComplete = () => {
    setCheckoutPlatform(null);
    setView('cart');
    fetchCartCount();
  };

  const handleLoginSuccess = (token, user) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setView('profile');
  };

  const handleRegisterSuccess = (token, user) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setView('profile');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setView('login');
  };

  return (
    <div className="app">
      <div className="container">
        <nav className="nav-tabs">
          <button 
            className={view === 'compare' ? 'active' : ''} 
            onClick={() => setView('compare')}
          >
            ⚖️ Compare
          </button>
          <button 
            className={view === 'cart' || view === 'checkout' ? 'active' : ''} 
            onClick={() => setView('cart')}
            style={{ position: 'relative' }}
          >
            🛒 Cart
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#e23744',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {cartCount}
              </span>
            )}
          </button>
          <button 
            className={view === 'swiggy' ? 'active' : ''} 
            onClick={() => setView('swiggy')}
          >
            🍔 Swiggy
          </button>
          <button 
            className={view === 'zomato' ? 'active' : ''} 
            onClick={() => setView('zomato')}
          >
            🍕 Zomato
          </button>
          <button 
            className={view === 'login' || view === 'register' ? 'active' : ''} 
            onClick={() => setView('login')}
          >
            🔐 Auth
          </button>
          {token && (
            <button 
              className={view === 'profile' ? 'active' : ''} 
              onClick={() => setView('profile')}
            >
              👤 Profile
            </button>
          )}
        </nav>

        {view === 'compare' && <CompareDeals onCartUpdate={handleCartUpdate} />}
        {view === 'cart' && (
          <Cart 
            onCheckout={(checkoutData) => handleCheckout(checkoutData.platform)}
          />
        )}
        {view === 'checkout' && checkoutPlatform && (
          <Checkout 
            platform={checkoutPlatform}
            onBack={() => setView('cart')}
            onComplete={handleCheckoutComplete}
          />
        )}
        {view === 'swiggy' && <SwiggyTest />}
        {view === 'zomato' && <ZomatoTest />}
        
        {view === 'login' && (
          <Login
            onSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setView('register')}
          />
        )}

        {view === 'register' && (
          <Register
            onSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => setView('login')}
          />
        )}

        {view === 'profile' && (
          <Profile
            user={user}
            token={token}
            onLogout={handleLogout}
          />
        )}
      </div>
    </div>
  );
}

export default App;
