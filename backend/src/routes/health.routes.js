const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * GET /health
 * Basic health check - returns system uptime and healthy status
 * Used by monitoring tools (UptimeRobot, Datadog) for availability checks
 */
router.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };

  res.status(200).json(healthData);
});

/**
 * GET /health/db
 * Database health check - verifies MongoDB connection
 * Returns 200 if connected, 503 (Service Unavailable) if degraded
 * Includes 2-second timeout to prevent hanging checks
 */
router.get('/health/db', async (req, res) => {
  const logger = res.locals.logger;
  const correlationId = res.locals.correlationId;

  try {
    // Create promise with 2-second timeout
    const pingPromise = mongoose.connection.db.admin().ping();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database ping timeout')), 2000)
    );

    // Race between ping and timeout
    await Promise.race([pingPromise, timeoutPromise]);

    const healthData = {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      connectionState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      dbName: mongoose.connection.db.databaseName
    };

    logger.info('Database health check passed', { correlationId, ...healthData });
    res.status(200).json(healthData);
  } catch (error) {
    const healthData = {
      status: 'degraded',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error.message,
      connectionState: mongoose.connection.readyState
    };

    logger.error('Database health check failed', {
      correlationId,
      error: error.message,
      stack: error.stack
    });

    res.status(503).json(healthData);
  }
});

module.exports = router;
