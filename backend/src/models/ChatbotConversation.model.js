const mongoose = require('mongoose');

const chatbotConversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    index: true
  },
  query: {
    type: String,
    required: [true, 'Query is required'],
    maxlength: [1000, 'Query cannot exceed 1000 characters']
  },
  response: {
    type: String,
    required: [true, 'Response is required'],
    maxlength: [5000, 'Response cannot exceed 5000 characters']
  },
  intent: {
    type: String,
    enum: ['general', 'contact', 'projects', 'skills', 'experience', 'rule-based', 'unknown'],
    default: 'general'
  },
  tokensUsed: {
    prompt: { type: Number, default: 0 },
    completion: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  modelUsed: { type: String, default: 'gpt-3.5-turbo-0125' },
  retrievedChunks: [{
    chunkId: String,
    similarity: Number,
    sourceType: String
  }],
  cached: { type: Boolean, default: false },
  responseTime: { type: Number }, // milliseconds
  ip: { type: String }
}, { timestamps: true });

chatbotConversationSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatbotConversation', chatbotConversationSchema);
