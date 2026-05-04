const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message } = err;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];

    const fieldLabels = { email: 'Email address', mobile: 'Mobile number' };
    const fieldName = fieldLabels[field] || field;

    message = `${fieldName} '${value}' is already registered. Please use a different ${fieldName.toLowerCase()} or log in.`;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  // Log server errors
  if (statusCode === 500) {
    logger.error('Internal Server Error:', { message: err.message, stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again later.'
      : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
