require('dotenv').config(); 
const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION:', err.message);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION:', err.message);
  process.exit(1);
});