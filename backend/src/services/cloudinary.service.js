const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

class CloudinaryService {
  constructor() {
    this.isConfigured = false;
    this.initializeCloudinary();
  }

  initializeCloudinary() {
    try {
      const cloudinaryUrl = process.env.CLOUDINARY_URL;
      if (!cloudinaryUrl) {
        console.warn('⚠ CLOUDINARY_URL not configured - using local storage fallback');
        return;
      }

      // Cloudinary URL format: cloudinary://api_key:api_secret@cloud_name
      cloudinary.config({ cloudinary_url: cloudinaryUrl });
      this.isConfigured = true;
      console.log('✓ Cloudinary configured successfully');
    } catch (error) {
      console.error('✗ Cloudinary initialization failed:', error.message);
      this.isConfigured = false;
    }
  }

  /**
   * Upload file buffer to Cloudinary
   * @param {Buffer} buffer - File buffer from multer
   * @param {Object} options - Upload options
   * @param {string} options.folder - Cloudinary folder path
   * @param {string} options.publicId - Custom public ID (optional)
   * @param {string} options.resourceType - 'image' | 'video' | 'raw' | 'auto'
   * @returns {Promise<Object>} Cloudinary upload result with url, public_id, etc.
   */
  async uploadBuffer(buffer, options = {}) {
    if (!this.isConfigured) {
      throw new Error('Cloudinary not configured');
    }

    const { folder = 'portfolio', publicId, resourceType = 'auto' } = options;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: resourceType,
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      // Convert buffer to stream and pipe to cloudinary
      const bufferStream = Readable.from(buffer);
      bufferStream.pipe(uploadStream);
    });
  }

  /**
   * Upload multiple files to Cloudinary
   */
  async uploadMultiple(files, options = {}) {
    if (!files || files.length === 0) return [];

    const uploadPromises = files.map(file =>
      this.uploadBuffer(file.buffer, {
        ...options,
        publicId: options.publicId ? `${options.publicId}_${Date.now()}` : undefined
      })
    );

    const results = await Promise.allSettled(uploadPromises);

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          url: result.value.secure_url,
          publicId: result.value.public_id,
          width: result.value.width,
          height: result.value.height,
          format: result.value.format
        };
      } else {
        console.error(`Failed to upload file ${index}:`, result.reason);
        return null;
      }
    }).filter(Boolean);
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId) {
    if (!this.isConfigured) return;

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Failed to delete from Cloudinary:', error.message);
      throw error;
    }
  }

  /**
   * Check if Cloudinary is configured and working
   */
  async healthCheck() {
    if (!this.isConfigured) {
      return { status: 'disabled', message: 'Cloudinary not configured' };
    }

    try {
      await cloudinary.api.ping();
      return { status: 'ok', message: 'Cloudinary is working' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}

module.exports = new CloudinaryService();
