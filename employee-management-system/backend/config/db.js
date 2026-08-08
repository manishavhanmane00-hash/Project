const mongoose = require('mongoose');

// Connects to MongoDB using the URI from the .env file
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1); // Stop the server if the database is unreachable
  }
};

module.exports = connectDB;
