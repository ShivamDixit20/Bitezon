/**
 * Configuration module
 * Loads and exports environment variables
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '1h',
  
  // Server Configuration
  PORT: process.env.PORT || 3000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // MongoDB Configuration
  MONGO_URI: process.env.MONGO_URI,
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development'
};
