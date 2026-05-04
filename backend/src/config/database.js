const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const options = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  };

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    logger.info(` MongoDB Atlas connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      logger.warn('  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info(' MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    logger.error(` MongoDB connection error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
