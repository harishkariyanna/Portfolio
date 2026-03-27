const mongoose = require('mongoose');
const validator = require('validator');

const certificateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Certificate title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  issuer: {
    type: String,
    required: [true, 'Issuer is required'],
    trim: true,
    maxlength: [200, 'Issuer cannot exceed 200 characters']
  },
  issueDate: { type: Date, required: [true, 'Issue date is required'] },
  expiryDate: { type: Date },
  credentialId: { type: String, maxlength: 200 },
  verificationUrl: {
    type: String,
    validate: {
      validator: (v) => !v || validator.isURL(v),
      message: 'Invalid verification URL'
    }
  },
  imageUrl: { type: String },
  order: { type: Number, default: 0 },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

certificateSchema.pre(/^find/, function () {
  if (!this.getQuery().includeDeleted) {
    this.where({ deleted: false });
  }
});

module.exports = mongoose.model('Certificate', certificateSchema);
