const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
    maxlength: [100, 'Skill name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  proficiency: {
    type: Number,
    required: true,
    min: [1, 'Proficiency must be at least 1'],
    max: [5, 'Proficiency cannot exceed 5']
  },
  icon: { type: String },
  yearsOfExperience: { type: Number, min: 0, max: 50 },
  order: { type: Number, default: 0 },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

skillSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
skillSchema.index({ category: 1 });

skillSchema.pre(/^find/, function () {
  if (!this.getQuery().includeDeleted) {
    this.where({ deleted: false });
  }
});

module.exports = mongoose.model('Skill', skillSchema);
