const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    maxlength: [255, 'File name cannot exceed 255 characters']
  },
  fileData: {
    type: Buffer,
    required: [true, 'File data is required']
  },
  mimeType: {
    type: String,
    required: true,
    enum: ['application/pdf']
  },
  fileSize: {
    type: Number,
    required: true,
    max: [10 * 1024 * 1024, 'File size cannot exceed 10MB']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Only one active resume at a time
resumeSchema.pre('save', async function (next) {
  if (this.isActive) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

module.exports = mongoose.model('Resume', resumeSchema);
