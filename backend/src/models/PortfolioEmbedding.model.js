const mongoose = require('mongoose');

const portfolioEmbeddingSchema = new mongoose.Schema({
  chunkId: {
    type: String,
    required: [true, 'Chunk ID is required'],
    unique: true
  },
  sourceType: {
    type: String,
    required: true,
    enum: ['project', 'skill', 'experience', 'aboutme', 'certificate', 'achievement']
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  chunkText: {
    type: String,
    required: [true, 'Chunk text is required'],
    maxlength: [5000, 'Chunk text cannot exceed 5000 characters']
  },
  embedding: {
    type: [Number],
    required: true,
    validate: {
      validator: (v) => v.length === 1536,
      message: 'Embedding must have exactly 1536 dimensions'
    }
  },
  tokenCount: { type: Number, required: true },
  chunkIndex: { type: Number },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

portfolioEmbeddingSchema.index({ sourceType: 1, sourceId: 1 });

module.exports = mongoose.model('PortfolioEmbedding', portfolioEmbeddingSchema);
