const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const validateEnv = require('./utils/validateEnv');
const correlationIdMiddleware = require('./middleware/correlationId.middleware');
const { logger, requestLogger } = require('./middleware/logger.middleware');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/projects.routes');
const contentRoutes = require('./routes/content.routes');
const chatbotRoutes = require('./routes/chatbot.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const resumeRoutes = require('./routes/resume.routes');
const contactRoutes = require('./routes/contact.routes');
const linkedinRoutes = require('./routes/linkedin.routes');

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Validate required environment variables
validateEnv();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Trust proxy (Render, Railway, etc. run behind reverse proxies)
app.set('trust proxy', 1);

// Correlation ID middleware (must be first to generate ID for logging)
app.use(correlationIdMiddleware);

// Request logging middleware
app.use(requestLogger);

// Security middleware - configure helmet to allow cross-origin images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false, // Disable to allow cross-origin images
  crossOriginEmbedderPolicy: false, // Disable to allow cross-origin embeds
  contentSecurityPolicy: false // Disable CSP or configure it properly for your needs
}));

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174'
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply global CORS to all routes except /uploads (which has its own CORS)
app.use((req, res, next) => {
  if (req.path.startsWith('/uploads')) {
    return next();
  }
  cors(corsOptions)(req, res, next);
});

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser middleware
app.use(cookieParser());

// Serve uploaded files with explicit CORS headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Health check routes
app.use('/', healthRoutes);

// Auth routes
app.use('/auth', authRoutes);

// API routes
app.use('/api/projects', projectRoutes);
app.use('/api', contentRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/linkedin', linkedinRoutes);

// API root endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Intelligent Portfolio Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      healthDb: '/health/db',
      api: '/api'
    }
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    correlationId: res.locals.correlationId
  });
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    correlationId: res.locals.correlationId,
    url: req.url,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    correlationId: res.locals.correlationId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
  logger.info(`Health check available at http://localhost:${PORT}/health`);
  logger.info(`Database health check at http://localhost:${PORT}/health/db`);
});

module.exports = app;
