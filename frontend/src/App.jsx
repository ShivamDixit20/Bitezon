import { useState, useEffect } from 'react';
import Header from './components/Header';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import CompareDeals from './components/CompareDeals';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import OrderHistory from './components/OrderHistory';
import Footer from './components/Footer';

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
      <div style={styles.authPageWrapper}>
        <div style={styles.authPage}>
          <div style={styles.authContainer}>
            <div style={styles.authHeader}>
              <h1 style={styles.logoText}>Bitezon</h1>
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
        <Footer />
      </div>
    );
  }

  // Main app - shown when logged in
  return (
    <div style={styles.appContainer}>
      <Header 
        view={view} 
        user={user} 
        cartCount={cartCount}
        onNavigate={setView}
        onLogout={handleLogout}
      />

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
        {view === 'orders' && <OrderHistory user={user} />}
        {view === 'profile' && <Profile user={user} token={token} onLogout={handleLogout} />}
      </main>
      <Footer />
    </div>
  );
}

const styles = {
  authPageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh'
  },
  authPage: {
    flex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
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
    color: 'rgb(239, 79, 95)',
    textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
  },
  tagline: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '18px',
    margin: 0
  },
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa'
  },
  main: {
    flex: 1,
    minHeight: 'calc(100vh - 60px)'
  }
};

export default App;
