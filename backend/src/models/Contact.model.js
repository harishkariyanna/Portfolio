const mongoose = require('mongoose');
const validator = require('validator');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  email: {
    type: String,
    required: true,
    validate: {
      validator: (v) => validator.isEmail(v),
      message: 'Invalid email'
    }
  },
  subject: {
    type: String,
    maxlength: 200,
    default: 'No Subject'
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  read: {
    type: Boolean,
    default: false
  },
  replied: {
    type: Boolean,
    default: false
  },
  repliedAt: Date,
  ip: String
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);
