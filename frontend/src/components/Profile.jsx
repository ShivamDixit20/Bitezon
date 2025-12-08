import { useState } from 'react';
import { getProfile } from '../api';

function Profile({ user, token, onLogout }) {
  const [profileData, setProfileData] = useState(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getProfile(token);
      setProfileData(response.user);
    } catch (err) {
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Profile</h1>
      <p style={styles.subtitle}>Manage your profile details and settings.</p>
      
      <div style={styles.profileCard}>
        {error && <div style={styles.errorMessage}>{error}</div>}
        
        {/* Profile Header with Avatar */}
        <div style={styles.profileHeader}>
          <div style={styles.avatar}></div>
          <div style={styles.profileMeta}>
            <h2 style={styles.profileName}>{profileData?.name}</h2>
            <p style={styles.profileEmail}>{profileData?.email}</p>
          </div>
        </div>

        {/* Profile Fields */}
        <div style={styles.profileInfo}>
          <div style={styles.profileField}>
            <label style={styles.fieldLabel}>Full Name</label>
            <div style={styles.fieldValue}>{profileData?.name}</div>
          </div>
          
          <div style={styles.profileField}>
            <label style={styles.fieldLabel}>Email Address</label>
            <div style={styles.fieldValue}>{profileData?.email}</div>
          </div>
          
          <div style={styles.profileField}>
            <label style={styles.fieldLabel}>User ID</label>
            <div style={{...styles.fieldValue, ...styles.userId}}>
              {profileData?.id}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.buttonGroup}>
          <button 
            onClick={fetchProfile} 
            style={styles.btnSecondary}
            disabled={loading}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e8e8e8'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f5f5f5'}
          >
            {loading ? '⟳ Refreshing...' : '⟳ Refresh Profile'}
          </button>
          
          <button 
            onClick={onLogout} 
            style={styles.btnLogout}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgb(220, 60, 75)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgb(239, 79, 95)'}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}


const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgb(239, 79, 95)',
    textAlign: 'center',
    margin: '0 0 32px 0',
    fontWeight: '500'
  },
  profileCard: {
    maxWidth: '680px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    border: '1px solid #f0f0f0'
  },
  errorMessage: {
    background: '#ffe6e6',
    color: 'rgb(220, 60, 75)',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '500'
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    paddingBottom: '24px',
    borderBottom: '1px solid #f0f0f0',
    marginBottom: '24px'
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    flexShrink: 0
  },
  profileMeta: {
    flex: 1
  },
  profileName: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 4px 0'
  },
  profileEmail: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  profileInfo: {
    marginBottom: '24px'
  },
  profileField: {
    paddingBottom: '20px',
    marginBottom: '20px',
    borderBottom: '1px solid #f0f0f0'
  },
  fieldLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px'
  },
  fieldValue: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#1a1a1a'
  },
  userId: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'monospace'
  },
  verifiedBadge: {
    color: 'rgb(239, 79, 95)',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  buttonGroup: {
    display: 'flex',
    gap: '16px',
    marginTop: '32px'
  },
  btnSecondary: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    color: '#1a1a1a',
    cursor: 'pointer',
    transition: 'all 0.2s',
    lineHeight: '1.4'
  },
  btnLogout: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: 'rgb(239, 79, 95)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    lineHeight: '1.4'
  }
};

export default Profile;
