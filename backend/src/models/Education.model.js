const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  institution: {
    type: String,
    required: [true, 'Institution name is required'],
    trim: true,
    maxlength: [200, 'Institution name cannot exceed 200 characters']
  },
  degree: {
    type: String,
    required: [true, 'Degree is required'],
    trim: true,
    maxlength: [200, 'Degree cannot exceed 200 characters']
  },
  fieldOfStudy: {
    type: String,
    trim: true,
    maxlength: [200, 'Field of study cannot exceed 200 characters']
  },
  grade: {
    type: String,
    maxlength: [50, 'Grade cannot exceed 50 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  achievements: [{ type: String, maxlength: 500 }],
  startDate: { type: Date, required: [true, 'Start date is required'] },
  endDate: { type: Date },
  current: { type: Boolean, default: false },
  location: { type: String, maxlength: 100 },
  collegeLogo: { type: String },
  order: { type: Number, default: 0 },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

educationSchema.index({ order: 1 });

educationSchema.pre(/^find/, function () {
  if (!this.getQuery().includeDeleted) {
    this.where({ deleted: false });
  }
});

module.exports = mongoose.model('Education', educationSchema);
