const nodemailer = require('nodemailer');
const dns = require('dns');
const dotenv = require('dotenv');
const path = require('path');
const { logger } = require('../middleware/logger.middleware');

// Force DNS to resolve IPv4 first — prevents ENETUNREACH on IPv6-only addresses
dns.setDefaultResultOrder('ipv4first');

// Load environment variables early
dotenv.config({ path: path.join(__dirname, '../../../.env') });

class EmailService {
  constructor() {
    this.transporter = null;
    this.from = process.env.EMAIL_FROM || 'noreply@portfolio.com';
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Check if email is configured
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      logger.warn('Email service not configured. OTP emails will be logged instead.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        family: 4, // Force IPv4 only
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        tls: { rejectUnauthorized: false }
      });
      logger.info('Email transporter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

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

    // If transporter is not configured, log the OTP instead
    if (!this.transporter) {
      logger.info(`[EMAIL NOT CONFIGURED] Would send OTP to ${email}:`, otp);
      console.log(`\n========== OTP EMAIL ==========`);
      console.log(`To: ${email}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`OTP: ${otp}`);
      console.log(`================================\n`);
      return { success: true, message: 'OTP logged (email not configured)' };
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`OTP email sent to ${email}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Failed to send OTP email to ${email}:`, error);
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
      logger.info(`[EMAIL NOT CONFIGURED] Would send reply to ${toEmail}`);
      console.log(`\n========== REPLY EMAIL ==========`);
      console.log(`To: ${toEmail}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Body: ${mailOptions.text}`);
      console.log(`==================================\n`);
      return { success: true, message: 'Reply logged (email not configured)' };
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Reply sent to ${toEmail}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Failed to send reply to ${toEmail}:`, {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });
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
      logger.info(`[EMAIL NOT CONFIGURED] Would send acknowledgment to ${toEmail}`);
      console.log(`\n========== ACKNOWLEDGMENT EMAIL ==========`);
      console.log(`To: ${toEmail}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Body: ${mailOptions.text}`);
      console.log(`==========================================\n`);
      return { success: true, message: 'Acknowledgment logged (email not configured)' };
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Acknowledgment sent to ${toEmail}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Failed to send acknowledgment to ${toEmail}:`, {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });
      // Don't throw error - acknowledgment email is optional
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
