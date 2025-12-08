import React from 'react';

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerContent}>
        {/* About Bitezon */}
        <div style={styles.footerSection}>
          <h4 style={styles.sectionTitle}>ABOUT BITEZON</h4>
          <ul style={styles.linkList}>
            <li><a href="#" style={styles.link}>Who We Are</a></li>
            <li><a href="#" style={styles.link}>Blog</a></li>
            <li><a href="#" style={styles.link}>Work With Us</a></li>
           
            <li><a href="#" style={styles.link}>Report Fraud</a></li>
            <li><a href="#" style={styles.link}>Press Kit</a></li>
            <li><a href="#" style={styles.link}>Contact Us</a></li>
          </ul>
        </div>

        {/* Features */}
        <div style={styles.footerSection}>
          <h4 style={styles.sectionTitle}>FEATURES</h4>
          <ul style={styles.linkList}>
            <li><a href="#" style={styles.link}>Compare Prices</a></li>
            <li><a href="#" style={styles.link}>Best Deals</a></li>
            <li><a href="#" style={styles.link}>Track Orders</a></li>
           
            <li><a href="#" style={styles.link}>Price Alerts</a></li>
            <li><a href="#" style={styles.link}>Restaurant Info</a></li>
            
          </ul>
        </div>

        {/* For Users */}
        <div style={styles.footerSection}>
          <h4 style={styles.sectionTitle}>FOR USERS</h4>
          <ul style={styles.linkList}>
            <li><a href="#" style={styles.link}>Partner With Us</a></li>
            <li><a href="#" style={styles.link}>Apps For You</a></li>
            <li><a href="#" style={styles.link}>Browse Restaurants</a></li>
           
           

          </ul>
        </div>

        {/* Learn More */}
        <div style={styles.footerSection}>
          <h4 style={styles.sectionTitle}>LEARN MORE</h4>
          <ul style={styles.linkList}>
            <li><a href="#" style={styles.link}>Privacy</a></li>
            <li><a href="#" style={styles.link}>Security</a></li>
            <li><a href="#" style={styles.link}>Terms</a></li>
            <li><a href="#" style={styles.link}>Cookies</a></li>
            <li><a href="#" style={styles.link}>Brand Guidelines</a></li>
          </ul>
        </div>

        {/* Social Links */}
        <div style={styles.footerSection}>
          <h4 style={styles.sectionTitle}>SOCIAL LINKS</h4>
          <div style={styles.socialLinks}>
            <a href="#" style={styles.socialIcon}>in</a>
            <a href="#" style={styles.socialIcon}>📷</a>
            <a href="#" style={styles.socialIcon}>𝕏</a>
            <a href="#" style={styles.socialIcon}>▶️</a>
            <a href="#" style={styles.socialIcon}>f</a>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div style={styles.footerBottom}>
        <p style={styles.footerText}>
          By continuing past this page, you agree to our Terms of Service, Cookie Policy, Privacy Policy and Content Policies. All trademarks are properties of their respective owners. 2024-2025 © Bitezon™ Ltd. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

const styles = {
  footer: {
    backgroundColor: '#fff',
    borderTop: '1px solid #e8e8e8',
    marginTop: 'auto',
    width: '100%'
  },
  footerContent: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '40px',
    padding: '40px 60px',
    maxWidth: '1400px',
    margin: '0 auto',
    borderBottom: '1px solid #e8e8e8'
  },
  footerSection: {
    display: 'flex',
    flexDirection: 'column'
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    color: '#1a1a1a',
    margin: '0 0 20px 0',
    textTransform: 'uppercase'
  },
  linkList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  link: {
    color: '#6b7280',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'color 0.2s',
    cursor: 'pointer'
  },
  socialLinks: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px'
  },
  socialIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  footerBottom: {
    padding: '24px 250px',
    backgroundColor: '#fff',
    textAlign: 'right'
  },
  footerText: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
    lineHeight: '1.6',
    maxWidth: '1400px'
  }
};

export default Footer;
