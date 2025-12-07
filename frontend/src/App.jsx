import { useState, useEffect } from 'react';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import CompareDeals from './components/CompareDeals';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import OrderHistory from './components/OrderHistory';

function App() {
  const [view, setView] = useState('login');
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [checkoutPlatform, setCheckoutPlatform] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setView('home');
    }
    
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
    setView('orders');
    fetchCartCount();
  };

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setView('home');
  };

  const handleRegisterSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setView('home');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setView('login');
  };

  // Auth pages - shown when not logged in
  if (!token) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authContainer}>
          <div style={styles.authHeader}>
            <span style={styles.logoIcon}>🍽️</span>
            <h1 style={styles.logoText}>Bitezon</h1>
            <p style={styles.tagline}>Compare food prices across Swiggy & Zomato</p>
          </div>
          
          {view === 'login' || view === 'home' ? (
            <Login
              onSuccess={handleLoginSuccess}
              onSwitchToRegister={() => setView('register')}
            />
          ) : (
            <Register
              onSuccess={handleRegisterSuccess}
              onSwitchToLogin={() => setView('login')}
            />
          )}
        </div>
      </div>
    );
  }

  // Main app - shown when logged in
  return (
    <div style={styles.appContainer}>
      <header style={styles.mainHeader} className="main-header">
        <div style={styles.headerLeft} className="header-left">
          <span style={styles.headerLogo} className="header-logo">🍽️</span>
          <span style={styles.headerTitle} className="header-title">Bitezon</span>
        </div>
        
        <nav style={styles.mainNav} className="main-nav">
          <button 
            style={{...styles.navButton, ...(view === 'home' ? styles.navActive : {})}}
            className="nav-button"
            onClick={() => setView('home')}
          >
            🏠 Home
          </button>
          <button 
            style={{...styles.navButton, ...(view === 'compare' ? styles.navActive : {})}}
            className="nav-button"
            onClick={() => setView('compare')}
          >
            ⚖️ Compare
          </button>
          <button 
            style={{...styles.navButton, ...(view === 'cart' || view === 'checkout' ? styles.navActive : {}), position: 'relative'}}
            className="nav-button"
            onClick={() => setView('cart')}
          >
            🛒 Cart
            {cartCount > 0 && <span style={styles.badge}>{cartCount}</span>}
          </button>
          <button 
            style={{...styles.navButton, ...(view === 'orders' ? styles.navActive : {})}}
            className="nav-button"
            onClick={() => setView('orders')}
          >
            📋 Orders
          </button>
          <button 
            style={{...styles.navButton, ...(view === 'profile' ? styles.navActive : {})}}
            className="nav-button"
            onClick={() => setView('profile')}
          >
            👤 Profile
          </button>
        </nav>

        <div style={styles.headerRight} className="header-right">
          <span style={styles.welcome} className="welcome">Hi, {user?.name || 'User'}</span>
          <button style={styles.logoutBtn} className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main style={styles.main}>
        {view === 'home' && (
          <Home 
            isLoggedIn={true}
            user={user}
            onLogin={() => {}}
            onSignup={() => {}}
            onLogout={handleLogout}
          />
        )}
        {view === 'compare' && <CompareDeals onCartUpdate={handleCartUpdate} />}
        {view === 'cart' && <Cart onCheckout={(data) => handleCheckout(data.platform)} />}
        {view === 'checkout' && checkoutPlatform && (
          <Checkout 
            platform={checkoutPlatform}
            onBack={() => setView('cart')}
            onComplete={handleCheckoutComplete}
          />
        )}
        {view === 'orders' && <OrderHistory />}
        {view === 'profile' && <Profile user={user} token={token} onLogout={handleLogout} />}
      </main>
    </div>
  );
}

const styles = {
  authPage: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  authContainer: {
    width: '100%',
    maxWidth: '900px',
    textAlign: 'center'
  },
  authHeader: {
    marginBottom: '30px'
  },
  logoIcon: {
    fontSize: '64px',
    display: 'block',
    marginBottom: '10px'
  },
  logoText: {
    fontSize: '42px',
    fontWeight: '700',
    margin: '0 0 10px 0',
    color: '#fff',
    textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
  },
  tagline: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '18px',
    margin: 0
  },
  appContainer: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa'
  },
  mainHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  headerLogo: {
    fontSize: '28px'
  },
  headerTitle: {
    fontSize: '22px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #fc8019, #e23744)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  mainNav: {
    display: 'flex',
    gap: '8px'
  },
  navButton: {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    color: '#555',
    transition: 'all 0.2s'
  },
  navActive: {
    backgroundColor: '#e23744',
    color: '#fff'
  },
  badge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    background: '#e23744',
    color: 'white',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  welcome: {
    fontSize: '16px',
    color: '#333',
    fontWeight: '500'
  },
  logoutBtn: {
    padding: '10px 18px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '15px',
    cursor: 'pointer'
  },
  main: {
    minHeight: 'calc(100vh - 60px)'
  }
};

export default App;
