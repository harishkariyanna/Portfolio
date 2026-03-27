const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const { validate } = require('../middleware/validation.middleware');
const { sanitizeHtml } = require('../middleware/sanitize.middleware');
const Contact = require('../models/Contact.model');
const emailService = require('../services/email.service');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Admin test endpoint - verify email configuration
router.post('/admin/test-email', authMiddleware, async (req, res) => {
  const logger = res.locals.logger;
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email address required' });
  }

  try {
    const result = await emailService.sendContactAcknowledgment(email, 'Test User');
    logger.info('Test email sent', { to: email, result });
    res.json({ 
      message: 'Test email sent successfully',
      configured: !!emailService.transporter,
      result
    });
  } catch (error) {
    logger.error('Test email failed', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      error: 'Failed to send test email', 
      details: error.message,
      configured: !!emailService.transporter
    });
  }
});

// Rate limit: 3 contact submissions per hour per IP
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Too many contact submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation schemas
const contactSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  subject: Joi.string().max(200).allow('', null).optional(),
  message: Joi.string().min(10).max(2000).required()
});

const replySchema = Joi.object({
  replyMessage: Joi.string().min(1).max(5000).required()
});

// POST /api/contact - Public: Submit contact form
router.post('/', contactLimiter, validate(contactSchema), async (req, res) => {
  const logger = res.locals.logger;
  const correlationId = res.locals.correlationId;

  try {
    const { name, email, subject, message } = req.body;
    const sanitizedMessage = sanitizeHtml(message);

    const contact = await Contact.create({
      name,
      email,
      subject: subject || 'No Subject',
      message: sanitizedMessage,
      ip: req.ip
    });

    // Send acknowledgment email to the user (fire-and-forget with timeout)
    const emailTimeout = setTimeout(() => {
      logger.warn('Acknowledgment email timed out', { correlationId, to: email });
    }, 5000);

    emailService.sendContactAcknowledgment(email, name)
      .then(() => {
        clearTimeout(emailTimeout);
        logger.info('Acknowledgment email sent', { correlationId, to: email });
      })
      .catch(err => {
        clearTimeout(emailTimeout);
        logger.error('Failed to send acknowledgment email', { correlationId, error: err.message });
      });

    logger.info('Contact form submitted', { correlationId, from: email, subject: subject || 'No Subject' });
    res.status(201).json({ message: 'Thank you for your message! I will get back to you soon.', id: contact._id });
  } catch (error) {
    logger.error('Contact form error', { correlationId, error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

// GET /api/contact/admin - Admin: Get all contact messages
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// PATCH /api/contact/admin/:id/read - Toggle read status
router.patch('/admin/:id/read', authMiddleware, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    contact.read = !contact.read;
    await contact.save();
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update read status' });
  }
});

// POST /api/contact/admin/:id/reply - Reply to a contact message via email
router.post('/admin/:id/reply', authMiddleware, validate(replySchema), async (req, res) => {
  const logger = res.locals.logger;
  const correlationId = res.locals.correlationId;
  
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const { replyMessage } = req.body;

    // Update contact status immediately
    contact.replied = true;
    contact.repliedAt = new Date();
    contact.read = true;
    await contact.save();

    // Send email asynchronously (don't block response)
    const emailTimeout = setTimeout(() => {
      logger.warn('Reply email timed out', { correlationId, to: contact.email });
    }, 5000);

    emailService.sendReply(contact.email, contact.name, contact.subject, replyMessage)
      .then(() => {
        clearTimeout(emailTimeout);
        logger.info('Reply email sent successfully', { correlationId, to: contact.email });
      })
      .catch(err => {
        clearTimeout(emailTimeout);
        logger.error('Failed to send reply email', { correlationId, error: err.message });
      });

    logger.info('Reply queued', { to: contact.email, subject: contact.subject });
    res.json({ message: 'Reply sent successfully', contact });
  } catch (error) {
    logger.error('Reply error', { error: error.message });
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// DELETE /api/contact/admin/:id - Delete a contact message
router.delete('/admin/:id', authMiddleware, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

module.exports = router;
