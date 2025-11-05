import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';

function App() {
  const [view, setView] = useState('login'); // 'login', 'register', 'profile'
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setView('profile');
    }
  }, []);

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
