const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Achievement title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  date: { type: Date, required: [true, 'Date is required'] },
  category: {
    type: String,
    required: true,
    enum: {
      values: ['award', 'hackathon', 'certification', 'publication', 'speaking', 'other'],
      message: 'Invalid category'
    }
  },
  issuer: { type: String, maxlength: 200 },
  link: { type: String },
  order: { type: Number, default: 0 },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

achievementSchema.pre(/^find/, function () {
  if (!this.getQuery().includeDeleted) {
    this.where({ deleted: false });
  }
});

module.exports = mongoose.model('Achievement', achievementSchema);
