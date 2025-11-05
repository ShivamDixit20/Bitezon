// API base URL
const API_URL = '/api';

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Register a new user
export const register = async (name, email, password) => {
  return apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
};

// Login user
export const login = async (email, password) => {
  return apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

// Get user profile (requires token)
export const getProfile = async (token) => {
  return apiCall('/profile', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
