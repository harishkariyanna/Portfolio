const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    maxlength: [100, 'Client name cannot exceed 100 characters']
  },
  company: { type: String, trim: true, maxlength: 200 },
  role: { type: String, trim: true, maxlength: 200 },
  feedback: {
    type: String,
    required: [true, 'Feedback is required'],
    maxlength: [2000, 'Feedback cannot exceed 2000 characters']
  },
  rating: {
    type: Number,
    required: true,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  avatar: { type: String },
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

testimonialSchema.pre(/^find/, function () {
  if (!this.getQuery().includeDeleted) {
    this.where({ deleted: false });
  }
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
