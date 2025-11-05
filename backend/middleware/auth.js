/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Middleware to verify JWT token from Authorization header
 * Expects header format: "Bearer <token>"
 * Sets req.user with decoded token payload
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization header is required.'
      });
    }

    // Check if token starts with "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Use "Bearer <token>"'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is empty'
      });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      
      // Attach user info to request
      req.user = {
        id: decoded.id,
        email: decoded.email
      };

      // Continue to next middleware/route
      next();
    } catch (jwtError) {
      // Handle specific JWT errors
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Authentication failed.'
        });
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

module.exports = authMiddleware;
