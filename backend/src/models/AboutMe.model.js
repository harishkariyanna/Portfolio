const mongoose = require('mongoose');
const validator = require('validator');

const aboutMeSchema = new mongoose.Schema({
  headline: {
    type: String,
    required: [true, 'Headline is required'],
    maxlength: [200, 'Headline cannot exceed 200 characters'],
    trim: true
  },
  bio: {
    type: String,
    required: [true, 'Bio is required'],
    maxlength: [2000, 'Bio cannot exceed 2000 characters']
  },
  profileImage: {
    type: String,
    validate: {
      validator: (v) => !v || validator.isURL(v),
      message: 'Invalid profile image URL'
    }
  },
  resumeUrl: {
    type: String,
    validate: {
      validator: (v) => !v || validator.isURL(v),
      message: 'Invalid resume URL'
    }
  },
  location: { type: String, maxlength: 100 },
  email: {
    type: String,
    validate: {
      validator: (v) => !v || validator.isEmail(v),
      message: 'Invalid email'
    }
  },
  phone: { type: String, maxlength: 20 },
  socialLinks: [{
    platform: {
      type: String,
      enum: ['github', 'linkedin', 'twitter', 'facebook', 'instagram', 'website', 'youtube', 'medium', 'devto', 'stackoverflow', 'behance', 'dribbble'],
      required: true
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: (v) => validator.isURL(v),
        message: 'Invalid social link URL'
      }
    },
    visible: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  typingTaglines: [{ type: String, maxlength: 100 }],
  footerText: { 
    type: String, 
    maxlength: 200,
    default: '© {year} Portfolio Platform. Built with MERN + AI.' 
  },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

aboutMeSchema.pre(/^find/, function () {
  if (!this.getQuery().includeDeleted) {
    this.where({ deleted: false });
  }
});

module.exports = mongoose.model('AboutMe', aboutMeSchema);
