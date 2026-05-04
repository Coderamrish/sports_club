require('dotenv').config();

// Override logger to show errors immediately
process.on('uncaughtException', (err) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('=== UNHANDLED REJECTION ===');
  console.error('Reason:', reason);
  if (reason && reason.stack) console.error('Stack:', reason.stack);
  process.exit(1);
});

console.log('1. Loading app...');
const app = require('./app');
console.log('2. App loaded successfully');

const connectDB = require('./config/database');
console.log('3. DB config loaded');

const PORT = process.env.PORT || 5000;
console.log('4. Port:', PORT);

console.log('5. Connecting to MongoDB...');
connectDB().then(() => {
  console.log('6. MongoDB connected');
  app.listen(PORT, () => {
    console.log('7. Server running on port ' + PORT);
  });
}).catch((err) => {
  console.error('8. MongoDB connection failed:', err);
  process.exit(1);
});
