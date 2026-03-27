const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true,
    maxlength: [200, 'Role cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [3000, 'Description cannot exceed 3000 characters']
  },
  highlights: [{ type: String, maxlength: 500 }],
  startDate: { type: Date, required: [true, 'Start date is required'] },
  endDate: { type: Date },
  current: { type: Boolean, default: false },
  location: { type: String, maxlength: 100 },
  companyLogo: { type: String },
  order: { type: Number, default: 0 },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

experienceSchema.index({ order: 1 });

experienceSchema.pre(/^find/, function () {
  if (!this.getQuery().includeDeleted) {
    this.where({ deleted: false });
  }
});

module.exports = mongoose.model('Experience', experienceSchema);
