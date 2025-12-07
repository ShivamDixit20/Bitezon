/**
 * Authentication Routes
 * Handles user registration and login
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const config = require('../controller');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Create user
    try {
      const user = new User({ email, password, name });
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email
        },
        config.JWT_SECRET,
        {
          expiresIn: config.JWT_EXPIRY
        }
      );

      // Return success response with token
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: config.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/login
 * Login existing user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email
      },
      config.JWT_SECRET,
      {
        expiresIn: config.JWT_EXPIRY
      }
    );

    // Return success response with token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: config.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/auth/update-profile
 * Update user profile (name)
 */
router.put('/update-profile', async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
      console.log('Token decoded successfully:', decoded);
    } catch (err) {
      console.error('JWT verification error:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.'
      });
    }

    const { name } = req.body;

    // Validate input
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long'
      });
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(
      decoded.id,
      { name: name.trim() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: config.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
