const mongoose = require('mongoose');

/**
 * Connect to MongoDB with retry logic and connection pooling
 * Optimized for MongoDB Atlas M0 free tier (max 10 connections)
 */
const connectDB = async () => {
  const maxRetries = 3;
  const retryDelays = [1000, 3000, 9000]; // Exponential backoff: 1s, 3s, 9s

  const options = {
    maxPoolSize: 10, // MongoDB Atlas M0 limit
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4 // Use IPv4
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting MongoDB connection (attempt ${attempt}/${maxRetries})...`);
      
      await mongoose.connect(process.env.MONGODB_URI, options);
      
      console.log('✓ MongoDB connected successfully');
      console.log(`✓ Database: ${mongoose.connection.db.databaseName}`);
      console.log(`✓ Connection pool size: ${options.maxPoolSize}`);
      
      return; // Success - exit function
    } catch (error) {
      console.error(`✗ MongoDB connection failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt < maxRetries) {
        const delay = retryDelays[attempt - 1];
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('✗ MongoDB connection failed after all retry attempts');
        console.error('Please check your MONGODB_URI and network connectivity');
        process.exit(1); // Exit with error code
      }
    }
  }
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;
