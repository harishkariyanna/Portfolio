const mongoose = require('mongoose');

const visitorAnalyticsSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    index: true
  },
  ip: { type: String },
  userAgent: { type: String },
  referrer: { type: String },
  page: { type: String, required: true },
  action: {
    type: String,
    enum: ['page_view', 'project_click', 'resume_download', 'chatbot_open', 'contact_submit', 'external_link'],
    default: 'page_view'
  },
  metadata: { type: mongoose.Schema.Types.Mixed },
  country: { type: String },
  device: {
    type: String,
    enum: ['desktop', 'tablet', 'mobile', 'unknown'],
    default: 'unknown'
  },
  browser: { type: String },
  duration: { type: Number, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7776000 // TTL: 90 days in seconds
  }
}, { timestamps: true });

visitorAnalyticsSchema.index({ sessionId: 1, page: 1 });
visitorAnalyticsSchema.index({ action: 1 });

module.exports = mongoose.model('VisitorAnalytics', visitorAnalyticsSchema);
