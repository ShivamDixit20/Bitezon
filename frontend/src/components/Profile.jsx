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
    <div className="profile-container">
      <h2>👤 Profile</h2>
      
      <div className="profile-card">
        {error && <div className="error-message">{error}</div>}
        
        <div className="profile-info">
          <div className="profile-field">
            <label><strong>Name:</strong></label>
            <span className="field-value-static">{profileData?.name}</span>
          </div>
          
          <div className="profile-field">
            <label><strong>Email:</strong></label>
            <span className="field-value-static">{profileData?.email}</span>
          </div>
          
          <div className="profile-field">
            <label><strong>User ID:</strong></label>
            <span className="field-value-static user-id">{profileData?.id}</span>
          </div>
        </div>

        <div className="button-group">
          <button 
            onClick={fetchProfile} 
            className="btn btn-secondary"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Profile'}
          </button>
          
          <button onClick={onLogout} className="btn btn-logout">
            🚪 Logout
          </button>
        </div>
      </div>

      <style>{`
        .profile-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
        }
        .profile-container h2 {
          text-align: center;
          color: #333;
          margin-bottom: 20px;
        }
        .profile-card {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .error-message {
          background: #ffe6e6;
          color: #c00;
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 15px;
          text-align: center;
        }
        .profile-info {
          margin-bottom: 20px;
        }
        .profile-field {
          display: flex;
          align-items: center;
          padding: 15px 0;
          border-bottom: 1px solid #eee;
        }
        .profile-field:last-child {
          border-bottom: none;
        }
        .profile-field label {
          min-width: 80px;
          color: #666;
        }
        .field-value-static {
          color: #333;
          flex: 1;
        }
        .user-id {
          font-family: monospace;
          font-size: 12px;
          color: #888;
        }
        .button-group {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .btn {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          flex: 1;
        }
        .btn-secondary {
          background: #f0f0f0;
          color: #333;
        }
        .btn-secondary:hover {
          background: #e0e0e0;
        }
        .btn-logout {
          background: #ff6b6b;
          color: white;
        }
        .btn-logout:hover {
          background: #ff5252;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default Profile;
