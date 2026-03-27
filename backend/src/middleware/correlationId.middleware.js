const { v4: uuidv4 } = require('uuid');

/**
 * Correlation ID Middleware
 * Generates or extracts UUIDv4 correlation ID for request tracking
 * Enables end-to-end tracing across microservices and logs
 */
const correlationIdMiddleware = (req, res, next) => {
  // Check if correlation ID exists from client or load balancer
  const existingCorrelationId = req.get('X-Correlation-ID') || 
                                 req.get('x-correlation-id') ||
                                 req.get('x-request-id');

  // Use existing or generate new UUIDv4
  const correlationId = existingCorrelationId || uuidv4();

  // Attach to res.locals for access in controllers and middleware
  res.locals.correlationId = correlationId;

  // Set response header for client tracing
  res.setHeader('X-Correlation-ID', correlationId);

  next();
};

module.exports = correlationIdMiddleware;
