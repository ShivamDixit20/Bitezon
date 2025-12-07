/**
 * Database Connection
 * MongoDB connection using Mongoose
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  // Skip MongoDB connection if MONGO_URI is not configured
  if (!process.env.MONGO_URI) {
    console.log('⚠️  MongoDB URI not configured - running without database');
    console.log('📦 Auth routes will not work, but Swiggy API routes will work with in-memory data');
    return;
  }
  
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log('⚠️  Continuing without database - only in-memory routes will work');
  }
};

module.exports = connectDB;
