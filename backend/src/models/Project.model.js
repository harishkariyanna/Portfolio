const mongoose = require('mongoose');
const validator = require('validator');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  techStack: {
    type: [String],
    validate: {
      validator: (v) => v.length <= 20,
      message: 'Tech stack cannot exceed 20 items'
    }
  },
  category: {
    type: String,
    enum: ['web', 'mobile', 'ai', 'devops', 'open-source', 'other'],
    default: 'web'
  },
  images: [{
    url: { type: String, required: true },
    alt: { type: String },
    width: Number,
    height: Number,
    variants: {
      thumbnail: String,
      medium: String,
      large: String
    }
  }],
  videoUrl: {
    type: String,
    validate: {
      validator: (v) => !v || validator.isURL(v),
      message: 'Invalid video URL'
    }
  },
  liveUrl: {
    type: String,
    validate: {
      validator: (v) => !v || validator.isURL(v),
      message: 'Invalid live demo URL'
    }
  },
  githubUrl: {
    type: String,
    validate: {
      validator: (v) => !v || validator.isURL(v),
      message: 'Invalid GitHub URL'
    }
  },
  githubStats: {
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    lastCommit: Date,
    cachedAt: Date
  },
  featured: { type: Boolean, default: false },
  published: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  startDate: Date,
  endDate: Date,
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

projectSchema.index({ title: 1 }, { unique: true });
projectSchema.index({ published: 1, order: 1 });
projectSchema.index({ category: 1 });

projectSchema.pre(/^find/, function () {
  if (!this.getQuery().includeDeleted) {
    this.where({ deleted: false });
  }
});

module.exports = mongoose.model('Project', projectSchema);
