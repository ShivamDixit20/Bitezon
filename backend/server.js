const path = require('path');
const express = require('express');
const dotenv = require('dotenv');

// Load environment variables FIRST - use absolute path
dotenv.config({ path: path.join(__dirname, '.env') });

const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./controller/db');
const config = require('./controller');
const authRoutes = require('./routes/auth');
const swiggyRoutes = require('./routes/swiggy');
const zomatoRoutes = require('./routes/zomato');
const compareRoutes = require('./routes/compare');
const cartRoutes = require('./routes/cart');
const orderHistoryRoutes = require('./routes/orderHistory');
const authMiddleware = require('./middleware/auth');
const User = require('./models/user');

// Connect to MongoDB
connectDB();

const app = express();

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow in development, change to false in production
    }
  },
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from public folder (images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bitezon API Server',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/profile (protected)'
      },
      swiggy: {
        restaurants: 'GET /api/swiggy/restaurants (filters: city, isVeg, minRating, cuisine)',
        restaurantById: 'GET /api/swiggy/restaurants/:id',
        menu: 'GET /api/swiggy/menu/:restaurantId (filters: category, isVeg, maxPrice)',
        allMenuItems: 'GET /api/swiggy/menu (filters: isVeg, category, minPrice, maxPrice)',
        search: 'GET /api/swiggy/search?q=query',
        filters: 'GET /api/swiggy/filters',
        createOrder: 'POST /api/swiggy/orders',
        getOrders: 'GET /api/swiggy/orders',
        getOrder: 'GET /api/swiggy/orders/:orderId',
        updateOrderStatus: 'PATCH /api/swiggy/orders/:orderId/status'
      },
      zomato: {
        restaurants: 'GET /api/zomato/restaurants (filters: city, isVeg, minRating, cuisine, maxCost, promoted, sortBy)',
        promotedRestaurants: 'GET /api/zomato/restaurants/promoted',
        restaurantById: 'GET /api/zomato/restaurants/:id',
        menu: 'GET /api/zomato/menu/:restaurantId (filters: category, isVeg, maxPrice, sortBy)',
        allMenuItems: 'GET /api/zomato/menu (filters: isVeg, category, minPrice, maxPrice)',
        search: 'GET /api/zomato/search?q=query',
        filters: 'GET /api/zomato/filters',
        createOrder: 'POST /api/zomato/orders',
        getOrders: 'GET /api/zomato/orders',
        getOrder: 'GET /api/zomato/orders/:orderId',
        updateOrderStatus: 'PATCH /api/zomato/orders/:orderId/status'
      }
    }
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Swiggy API routes
app.use('/api/swiggy', swiggyRoutes);

// Zomato API routes
app.use('/api/zomato', zomatoRoutes);

// Compare API routes
app.use('/api/compare', compareRoutes);

// Cart API routes
app.use('/api/cart', cartRoutes);

// Order History API routes
app.use('/api/orders', orderHistoryRoutes);

// Protected route - requires valid JWT token
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: config.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server (only in development)
const PORT = config.PORT;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${config.NODE_ENV}`);
    console.log(`JWT expiry: ${config.JWT_EXPIRY}`);
  });
}

// Export for Vercel
module.exports = app;
