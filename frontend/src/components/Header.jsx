import React from 'react';

const Header = ({ view, user, cartCount, onNavigate, onLogout }) => {
  const styles = {
    mainHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 28px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      minHeight: '60px'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    headerLogo: {
      fontSize: '32px'
    },
    headerTitle: {
      fontSize: '26px',
      fontWeight: '700',
      color: 'rgb(239, 79, 95)',
      margin: 0
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
      transition: 'all 0.2s',
      whiteSpace: 'nowrap'
    },
    navActive: {
      backgroundColor: '#e23744',
      color: '#fff'
    },
    badge: {
      position: 'absolute',
      top: '-8px',
      right: '-8px',
      background: '#e23744',
      color: 'white',
      borderRadius: '50%',
      width: '22px',
      height: '22px',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold'
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
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
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.2s'
    }
  };

  return (
    <header style={styles.mainHeader}>
      <div style={styles.headerLeft}>
        <h1 style={styles.headerTitle}>Bitezon</h1>
      </div>
      
      <nav style={styles.mainNav}>
        <button 
          style={{...styles.navButton, ...(view === 'home' ? styles.navActive : {})}}
          onClick={() => onNavigate('home')}
        >
          Home
        </button>
        <button 
          style={{...styles.navButton, ...(view === 'compare' ? styles.navActive : {})}}
          onClick={() => onNavigate('compare')}
        >
          Compare
        </button>
        <button 
          style={{...styles.navButton, ...(view === 'cart' || view === 'checkout' ? styles.navActive : {}), position: 'relative'}}
          onClick={() => onNavigate('cart')}
        >
          Cart
          {cartCount > 0 && <span style={styles.badge}>{cartCount}</span>}
        </button>
        <button 
          style={{...styles.navButton, ...(view === 'orders' ? styles.navActive : {})}}
          onClick={() => onNavigate('orders')}
        >
          Orders
        </button>
        <button 
          style={{...styles.navButton, ...(view === 'profile' ? styles.navActive : {})}}
          onClick={() => onNavigate('profile')}
        >
          Profile
        </button>
      </nav>

      <div style={styles.headerRight}>
        <span style={styles.welcome}>Hi, {user?.name || 'User'}</span>
        <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
};

export default Header;
