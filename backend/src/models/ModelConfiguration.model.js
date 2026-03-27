const mongoose = require('mongoose');

const modelConfigurationSchema = new mongoose.Schema({
  modelName: {
    type: String,
    required: [true, 'Model name is required'],
    trim: true
  },
  provider: {
    type: String,
    enum: ['openai', 'anthropic', 'google', 'local'],
    default: 'openai'
  },
  temperature: {
    type: Number,
    default: 0.3,
    min: [0, 'Temperature cannot be negative'],
    max: [2, 'Temperature cannot exceed 2']
  },
  maxTokens: {
    type: Number,
    default: 500,
    min: [1, 'Max tokens must be at least 1'],
    max: [4096, 'Max tokens cannot exceed 4096']
  },
  topP: { type: Number, default: 1, min: 0, max: 1 },
  systemPrompt: { type: String, maxlength: 5000 },
  active: { type: Boolean, default: true },
  purpose: {
    type: String,
    enum: ['chatbot', 'resume', 'embedding', 'general'],
    default: 'chatbot'
  }
}, { timestamps: true });

modelConfigurationSchema.index({ purpose: 1, active: 1 });

module.exports = mongoose.model('ModelConfiguration', modelConfigurationSchema);
