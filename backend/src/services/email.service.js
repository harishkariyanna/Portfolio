// ✅ FIX #1: dns MUST be imported and configured BEFORE nodemailer
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Force IPv4 — prevents ENETUNREACH on IPv6

const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const { logger } = require('../middleware/logger.middleware');

// Load environment variables early
dotenv.config({ path: path.join(__dirname, '../../../.env') });

class EmailService {
  constructor() {
    this.transporter = null;
    this.from = process.env.EMAIL_FROM || 'noreply@portfolio.com';
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      logger.warn('Email service not configured. Emails will be logged instead.');
      return;
    }

    try {
      // ✅ FIX #2: Use port 465 + secure:true (more reliable than STARTTLS 587)
      // ✅ FIX #3: family:4 forces IPv4 at socket level
      // ✅ FIX #4: Only host — NO service:"gmail" mixed in
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        family: 4,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      });
      logger.info('Email transporter initialized (smtp.gmail.com:465, IPv4)');
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  // ✅ FIX #5 & #6: All sendMail calls properly await and log REAL nodemailer response
  async sendOTP(email, otp, purpose) {
    const subjects = {
      password_change: 'Password Change OTP',
      forgot_password: 'Reset Password OTP',
      email_change: 'Email Change Verification'
    };

    const templates = {
      password_change: `Your OTP for password change is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
      forgot_password: `Your password reset OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this, please secure your account immediately.`,
      email_change: `Your OTP for email change verification is: ${otp}\n\nThis OTP will expire in 10 minutes.`
    };

    const mailOptions = {
      from: this.from,
      to: email,
      subject: subjects[purpose] || 'Verification OTP',
      text: templates[purpose] || `Your OTP is: ${otp}\n\nValid for 10 minutes.`
    };

    if (!this.transporter) {
      logger.info(`[EMAIL NOT CONFIGURED] OTP for ${email}: ${otp}`);
      return { success: true, message: 'OTP logged (email not configured)' };
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`OTP email DELIVERED to ${email}`, { messageId: info.messageId, response: info.response });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`OTP email FAILED to ${email}`, { code: error.code, message: error.message });
      throw new Error('Failed to send OTP email');
    }
  }

  generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  async sendReply(toEmail, toName, originalSubject, replyMessage) {
    const mailOptions = {
      from: this.from,
      to: toEmail,
      subject: `Re: ${originalSubject}`,
      text: `Hi ${toName},\n\n${replyMessage}\n\nBest regards`
    };

    if (!this.transporter) {
      logger.info(`[EMAIL NOT CONFIGURED] Reply to ${toEmail} logged`);
      return { success: true, message: 'Reply logged (email not configured)' };
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Reply DELIVERED to ${toEmail}`, { messageId: info.messageId, response: info.response });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Reply FAILED to ${toEmail}`, { code: error.code, message: error.message, command: error.command });
      throw new Error('Failed to send reply email');
    }
  }

  async sendContactAcknowledgment(toEmail, toName) {
    const mailOptions = {
      from: this.from,
      to: toEmail,
      subject: 'Thank you for contacting me',
      text: `Hi ${toName},\n\nThank you for reaching out! I have received your message and will get back to you as soon as possible.\n\nBest regards`
    };

    if (!this.transporter) {
      logger.info(`[EMAIL NOT CONFIGURED] Acknowledgment to ${toEmail} logged`);
      return { success: true, message: 'Acknowledgment logged (email not configured)' };
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Acknowledgment DELIVERED to ${toEmail}`, { messageId: info.messageId, response: info.response });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Acknowledgment FAILED to ${toEmail}`, { code: error.code, message: error.message });
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
