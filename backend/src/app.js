// dotenv already loaded in server.js
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const compression= require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp        = require('hpp');
const path       = require('path');

const authRoutes    = require('./routes/auth.routes');
const athleteRoutes = require('./routes/athlete.routes');
const coachRoutes   = require('./routes/coach.routes');
const adminRoutes   = require('./routes/admin.routes');
const errorHandler  = require('./middleware/errorHandler');
const { notFound }  = require('./middleware/notFound');
const app = express();

//Security 
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(mongoSanitize());
app.use(hpp());

//  CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

//  Static file serving (local uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

//  Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Sports Club API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Routes
app.use('/api/auth',     authRoutes);
app.use('/api/athletes', athleteRoutes);
app.use('/api/coaches',  coachRoutes);
app.use('/api/admin',    adminRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;