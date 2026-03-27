const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Project = require('../models/Project.model');
const AuditLog = require('../models/AuditLog.model');
const authMiddleware = require('../middleware/auth.middleware');
const cloudinaryService = require('../services/cloudinary.service');

const router = express.Router();

// Disk storage for project images (fallback if Cloudinary fails)
const uploadsDir = path.join(__dirname, '../../uploads/projects');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = crypto.randomBytes(12).toString('hex');
    cb(null, `${name}${ext}`);
  }
});

// Use memory storage for Cloudinary upload, disk storage as fallback
const upload = multer({
  storage: cloudinaryService.isConfigured ? multer.memoryStorage() : diskStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    if (allowed.test(path.extname(file.originalname))) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

/**
 * Process uploaded files - upload to Cloudinary or use local disk
 */
async function processUploadedFiles(files, folder = 'projects') {
  if (!files || files.length === 0) return [];

  // Use Cloudinary if configured
  if (cloudinaryService.isConfigured) {
    try {
      const results = await cloudinaryService.uploadMultiple(files, { folder });
      return results.map(r => ({
        url: r.url,
        publicId: r.publicId,
        width: r.width,
        height: r.height,
        alt: ''
      }));
    } catch (error) {
      console.error('Cloudinary upload failed, falling back to disk storage:', error.message);
      // Fall through to disk storage
    }
  }

  // Disk storage fallback
  return files.map(f => ({
    url: `/uploads/projects/${f.filename}`,
    alt: ''
  }));
}


// GET /api/projects - Public: Get all published projects
router.get('/', async (req, res) => {
  try {
    const { category, featured, page = 1, limit = 20 } = req.query;
    const filter = { published: true };
    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;

    const projects = await Project.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Project.countDocuments(filter);

    res.json({ projects, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id - Public: Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/admin/projects - Admin: Create project
router.post('/admin', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const { title } = req.body;
    const existing = await Project.findOne({ title });
    if (existing) return res.status(409).json({ error: 'Project with this title already exists' });

    // Parse techStack if it's a string
    if (typeof req.body.techStack === 'string') {
      req.body.techStack = req.body.techStack.split(',').map((s) => s.trim()).filter(Boolean);
    }

    // Remove empty string fields so Mongoose defaults apply
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] === '') delete req.body[key];
    });

    // Parse boolean strings from FormData
    ['published', 'featured'].forEach((key) => {
      if (req.body[key] === 'true') req.body[key] = true;
      if (req.body[key] === 'false') req.body[key] = false;
    });

    // Process uploaded images
    console.log('[CREATE] Files received:', req.files?.length || 0);
    if (req.files && req.files.length > 0) {
      const uploadedImages = await processUploadedFiles(req.files, 'projects');
      if (uploadedImages.length > 0) {
        req.body.images = uploadedImages.map(img => ({
          ...img,
          alt: req.body.title || ''
        }));
        console.log('[CREATE] Images uploaded:', req.body.images.length);
      }
    }

    const project = await Project.create(req.body);
    console.log('[CREATE] Project saved with images:', project.images?.length || 0);

    await AuditLog.create({
      adminId: req.admin.id,
      actionType: 'CREATE',
      entity: 'Project',
      entityId: project._id,
      newValues: project.toObject(),
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json(project);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Project with this title already exists' });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => ({ field: e.path, message: e.message }));
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/admin/projects/:id - Admin: Update project
router.put('/admin/:id', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const oldProject = await Project.findById(req.params.id);
    if (!oldProject) return res.status(404).json({ error: 'Project not found' });

    if (typeof req.body.techStack === 'string') {
      req.body.techStack = req.body.techStack.split(',').map((s) => s.trim()).filter(Boolean);
    }

    // Remove empty string fields so Mongoose defaults apply
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] === '') delete req.body[key];
    });

    // Parse boolean strings from FormData
    ['published', 'featured'].forEach((key) => {
      if (req.body[key] === 'true') req.body[key] = true;
      if (req.body[key] === 'false') req.body[key] = false;
    });

    // Handle existing images (from frontend after user deletions)
    let baseImages = [];
    if (req.body.existingImages) {
      try {
        baseImages = JSON.parse(req.body.existingImages);
        delete req.body.existingImages; // Remove from body to avoid saving it as a field
      } catch (e) {
        console.error('Failed to parse existingImages:', e);
        baseImages = oldProject.images || [];
      }
    } else {
      baseImages = oldProject.images || [];
    }

    // Process newly uploaded images
    console.log('[UPDATE] Files received:', req.files?.length || 0);
    if (req.files && req.files.length > 0) {
      const uploadedImages = await processUploadedFiles(req.files, 'projects');
      if (uploadedImages.length > 0) {
        const newImages = uploadedImages.map(img => ({
          ...img,
          alt: req.body.title || oldProject.title || ''
        }));
        req.body.images = [...baseImages, ...newImages];
        console.log('[UPDATE] Total images after merge:', req.body.images.length);
      }
    } else {
      // No new uploads, just use existing images (after deletions)
      req.body.images = baseImages;
    }

    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    await AuditLog.create({
      adminId: req.admin.id,
      actionType: 'UPDATE',
      entity: 'Project',
      entityId: project._id,
      oldValues: oldProject.toObject(),
      newValues: project.toObject(),
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(project);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => ({ field: e.path, message: e.message }));
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/admin/projects/:id - Admin: Soft delete project
router.delete('/admin/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.deleted = true;
    await project.save();

    await AuditLog.create({
      adminId: req.admin.id,
      actionType: 'DELETE',
      entity: 'Project',
      entityId: project._id,
      oldValues: project.toObject(),
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
