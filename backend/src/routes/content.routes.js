const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth.middleware');
const AuditLog = require('../models/AuditLog.model');
const AboutMe = require('../models/AboutMe.model');
const Skill = require('../models/Skill.model');
const Experience = require('../models/Experience.model');
const Education = require('../models/Education.model');
const Certificate = require('../models/Certificate.model');
const Testimonial = require('../models/Testimonial.model');
const Achievement = require('../models/Achievement.model');
const cloudinaryService = require('../services/cloudinary.service');

const router = express.Router();

// Ensure profile uploads directory exists
const profileUploadsDir = path.join(__dirname, '../../uploads/profile');
if (!fs.existsSync(profileUploadsDir)) {
  fs.mkdirSync(profileUploadsDir, { recursive: true });
}

// Configure multer for profile image uploads
const upload = multer({
  storage: cloudinaryService.isConfigured ? multer.memoryStorage() : multer.diskStorage({
    destination: (req, file, cb) => cb(null, profileUploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `profile-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// Helper: Create CRUD routes for a content model
const createCrudRoutes = (Model, entityName) => {
  // GET /api/{entity} - Public: Get all
  router.get(`/${entityName}`, async (req, res) => {
    try {
      const items = await Model.find().sort({ order: 1, createdAt: -1 });
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch ${entityName}` });
    }
  });

  // GET /api/{entity}/:id - Public: Get single
  router.get(`/${entityName}/:id`, async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ error: `${entityName} not found` });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch ${entityName}` });
    }
  });

  // POST /api/admin/{entity} - Admin: Create
  router.post(`/admin/${entityName}`, authMiddleware, async (req, res) => {
    try {
      const item = await Model.create(req.body);
      await AuditLog.create({
        adminId: req.admin.id,
        actionType: 'CREATE',
        entity: entityName,
        entityId: item._id,
        newValues: item.toObject(),
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      res.status(201).json(item);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: `Duplicate entry for ${entityName}` });
      }
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((e) => ({ field: e.path, message: e.message }));
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }
      res.status(500).json({ error: `Failed to create ${entityName}` });
    }
  });

  // PUT /api/admin/{entity}/:id - Admin: Update
  router.put(`/admin/${entityName}/:id`, authMiddleware, async (req, res) => {
    try {
      const old = await Model.findById(req.params.id);
      if (!old) return res.status(404).json({ error: `${entityName} not found` });

      const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });

      await AuditLog.create({
        adminId: req.admin.id,
        actionType: 'UPDATE',
        entity: entityName,
        entityId: item._id,
        oldValues: old.toObject(),
        newValues: item.toObject(),
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      res.json(item);
    } catch (error) {
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((e) => ({ field: e.path, message: e.message }));
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }
      res.status(500).json({ error: `Failed to update ${entityName}` });
    }
  });

  // DELETE /api/admin/{entity}/:id - Admin: Soft delete
  router.delete(`/admin/${entityName}/:id`, authMiddleware, async (req, res) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ error: `${entityName} not found` });

      item.deleted = true;
      await item.save();

      await AuditLog.create({
        adminId: req.admin.id,
        actionType: 'DELETE',
        entity: entityName,
        entityId: item._id,
        oldValues: item.toObject(),
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      res.json({ message: `${entityName} deleted successfully` });
    } catch (error) {
      res.status(500).json({ error: `Failed to delete ${entityName}` });
    }
  });
};

// Register CRUD routes for all content entities
createCrudRoutes(AboutMe, 'about');
createCrudRoutes(Skill, 'skills');
createCrudRoutes(Experience, 'experiences');
createCrudRoutes(Education, 'education');
createCrudRoutes(Certificate, 'certificates');
createCrudRoutes(Testimonial, 'testimonials');
createCrudRoutes(Achievement, 'achievements');

// POST /api/admin/about/upload-profile - Admin: Upload profile image
router.post('/admin/about/upload-profile', authMiddleware, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let imageUrl;

    // Upload to Cloudinary if configured
    if (cloudinaryService.isConfigured) {
      try {
        const result = await cloudinaryService.uploadBuffer(req.file.buffer, {
          folder: 'portfolio/profile',
          publicId: 'profile-image'
        });
        imageUrl = result.secure_url;
      } catch (error) {
        console.error('Cloudinary upload failed:', error.message);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    } else {
      // Use local storage
      imageUrl = `/uploads/profile/${req.file.filename}`;
    }

    // Update the About Me document with the new profile image
    const aboutMe = await AboutMe.findOne();
    if (aboutMe) {
      const oldProfileImage = aboutMe.profileImage;
      aboutMe.profileImage = imageUrl;
      await aboutMe.save();

      await AuditLog.create({
        adminId: req.admin.id,
        actionType: 'UPDATE',
        entity: 'about',
        entityId: aboutMe._id,
        oldValues: { profileImage: oldProfileImage },
        newValues: { profileImage: imageUrl },
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    res.json({ url: imageUrl, message: 'Profile image uploaded successfully' });
  } catch (error) {
    console.error('Profile upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
});

module.exports = router;
