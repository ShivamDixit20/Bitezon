import { useState, useEffect } from 'react';
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
    <div className="profile-container">
      <h2>Profile</h2>
      
      <div className="profile-card">
        <div className="profile-info">
          <p><strong>Name:</strong> {profileData?.name}</p>
          <p><strong>Email:</strong> {profileData?.email}</p>
          <p><strong>User ID:</strong> {profileData?.id}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="button-group">
          <button 
            onClick={fetchProfile} 
            className="btn btn-secondary"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Profile'}
          </button>
          
          <button onClick={onLogout} className="btn btn-logout">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
