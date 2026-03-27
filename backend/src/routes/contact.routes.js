const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const { validate } = require('../middleware/validation.middleware');
const { sanitizeHtml } = require('../middleware/sanitize.middleware');

const router = express.Router();

// Rate limit: 3 contact submissions per hour per IP
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Too many contact submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation schema
const contactSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  subject: Joi.string().max(200).optional(),
  message: Joi.string().min(10).max(2000).required()
});

// In-memory store for contact messages (in production, use a database or email service)
const contactMessages = [];

// POST /api/contact - Public: Submit contact form
router.post('/', contactLimiter, validate(contactSchema), async (req, res) => {
  const logger = res.locals.logger;
  const correlationId = res.locals.correlationId;

  try {
    const { name, email, subject, message } = req.body;

    // Sanitize message content
    const sanitizedMessage = sanitizeHtml(message);

    const contactEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      name,
      email,
      subject: subject || 'No Subject',
      message: sanitizedMessage,
      ip: req.ip,
      createdAt: new Date().toISOString(),
      read: false
    };

    contactMessages.push(contactEntry);

    logger.info('Contact form submitted', {
      correlationId,
      from: email,
      subject: subject || 'No Subject'
    });

    res.status(201).json({
      message: 'Thank you for your message! I will get back to you soon.',
      id: contactEntry.id
    });
  } catch (error) {
    logger.error('Contact form error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

// GET /api/admin/contact - Admin: Get all contact messages
router.get('/admin', require('../middleware/auth.middleware'), async (req, res) => {
  res.json({ messages: contactMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

module.exports = router;
