const express = require('express');
const multer = require('multer');
const Groq = require('groq-sdk');
const PDFDocument = require('pdfkit');
const authMiddleware = require('../middleware/auth.middleware');
const Resume = require('../models/Resume.model');
const AboutMe = require('../models/AboutMe.model');
const Skill = require('../models/Skill.model');
const Experience = require('../models/Experience.model');
const Project = require('../models/Project.model');
const Certificate = require('../models/Certificate.model');

const router = express.Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Multer for PDF uploads (memory storage, max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Only PDF files are allowed'));
  }
});

// POST /api/resume/admin/upload - Admin: Upload resume PDF
router.post('/admin/upload', authMiddleware, upload.single('resume'), async (req, res) => {
  const logger = res.locals.logger;
  const correlationId = res.locals.correlationId;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const resume = await Resume.create({
      fileName: req.file.originalname,
      fileData: req.file.buffer,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      isActive: true
    });

    logger.info('Resume uploaded', { correlationId, fileName: resume.fileName, size: resume.fileSize });

    res.status(201).json({
      message: 'Resume uploaded successfully',
      id: resume._id,
      fileName: resume.fileName,
      fileSize: resume.fileSize,
      uploadedAt: resume.createdAt
    });
  } catch (error) {
    logger.error('Resume upload failed', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to upload resume' });
  }
});

// GET /api/resume/admin/current - Admin: Get current resume info
router.get('/admin/current', authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findOne({ isActive: true }).select('-fileData');
    if (!resume) return res.status(404).json({ error: 'No resume uploaded' });
    res.json({
      id: resume._id,
      fileName: resume.fileName,
      fileSize: resume.fileSize,
      uploadedAt: resume.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resume info' });
  }
});

// GET /api/resume/admin/download - Admin: Download original resume
router.get('/admin/download', authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findOne({ isActive: true });
    if (!resume) return res.status(404).json({ error: 'No resume uploaded' });

    res.set({
      'Content-Type': resume.mimeType,
      'Content-Disposition': `attachment; filename="${resume.fileName}"`,
      'Content-Length': resume.fileSize
    });
    res.send(resume.fileData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to download resume' });
  }
});

// DELETE /api/resume/admin - Admin: Delete resume
router.delete('/admin', authMiddleware, async (req, res) => {
  try {
    await Resume.updateMany({}, { isActive: false });
    res.json({ message: 'Resume removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove resume' });
  }
});

// GET /api/resume/roles - Public: Get available roles
router.get('/roles', (req, res) => {
  res.json({
    roles: [
      { value: 'full-stack-developer', label: 'Full Stack Developer' },
      { value: 'software-developer', label: 'Software Developer' },
      { value: 'frontend-developer', label: 'Frontend Developer' },
      { value: 'backend-developer', label: 'Backend Developer' },
      { value: 'data-engineer', label: 'Data Engineer' },
      { value: 'ai-engineer', label: 'AI / ML Engineer' },
      { value: 'devops-engineer', label: 'DevOps Engineer' },
      { value: 'cloud-engineer', label: 'Cloud Engineer' },
      { value: 'other', label: 'Other' }
    ]
  });
});

// POST /api/resume/generate - Public: Generate role-tailored resume PDF
router.post('/generate', async (req, res) => {
  const logger = res.locals.logger;
  const correlationId = res.locals.correlationId;

  try {
    const { role, customRole } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });

    const targetRole = role === 'other' ? (customRole || 'General').trim() : role.replace(/-/g, ' ');

    // Fetch portfolio data
    const [aboutMe, skills, experiences, projects, certificates] = await Promise.all([
      AboutMe.findOne().lean(),
      Skill.find().sort({ proficiency: -1 }).lean(),
      Experience.find().sort({ startDate: -1 }).lean(),
      Project.find({ published: true }).sort({ order: 1 }).lean(),
      Certificate.find().sort({ issueDate: -1 }).lean()
    ]);

    if (!aboutMe) {
      return res.status(400).json({ error: 'Portfolio profile data not found' });
    }

    // Build context from ONLY existing portfolio data
    const portfolioData = {
      name: aboutMe.headline || 'Portfolio Owner',
      bio: aboutMe.bio || '',
      location: aboutMe.location || '',
      email: aboutMe.email || '',
      skills: skills.map(s => ({ name: s.name, category: s.category, proficiency: s.proficiency })),
      experiences: experiences.map(e => ({
        role: e.role,
        company: e.company,
        description: e.description || '',
        highlights: e.highlights || [],
        startDate: e.startDate,
        endDate: e.endDate,
        current: e.current
      })),
      projects: projects.map(p => ({
        title: p.title,
        description: p.shortDescription || p.description?.substring(0, 200) || '',
        techStack: p.techStack || []
      })),
      certificates: certificates.map(c => ({
        title: c.title,
        issuer: c.issuer,
        issueDate: c.issueDate
      }))
    };

    // Use Groq to tailor the resume content for the specified role
    const prompt = `You are a professional resume writer. Given the following REAL portfolio data, create a tailored resume for the role of "${targetRole}".

CRITICAL RULES:
- Use ONLY the skills, experience, projects, and certificates provided below
- Do NOT invent or add any skills, technologies, or experiences not in the data
- Highlight and prioritize the most relevant skills/experience for "${targetRole}"
- If a skill/experience is not relevant to the role, you may omit it but NEVER add fake ones

PORTFOLIO DATA:
${JSON.stringify(portfolioData, null, 2)}

Generate the resume in this EXACT JSON format:
{
  "summary": "A 2-3 sentence professional summary tailored for ${targetRole}",
  "relevantSkills": ["skill1", "skill2", ...],
  "experience": [
    {
      "role": "actual role",
      "company": "actual company", 
      "period": "start - end",
      "bullets": ["achievement 1 tailored for ${targetRole}", "achievement 2"]
    }
  ],
  "projects": [
    {
      "title": "actual project name",
      "description": "description tailored for ${targetRole}",
      "tech": ["actual tech used"]
    }
  ],
  "certificates": [
    { "title": "actual cert name", "issuer": "actual issuer", "date": "actual date" }
  ]
}

Return ONLY the JSON, no markdown or explanation.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a resume tailoring expert. Output valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 3000
    });

    let tailoredData;
    try {
      const raw = completion.choices[0].message.content.trim();
      // Extract JSON from possible markdown code blocks
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      tailoredData = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      logger.error('Failed to parse AI resume response', { correlationId });
      return res.status(500).json({ error: 'Failed to generate tailored resume' });
    }

    // Generate PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));

    const pdfPromise = new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text(portfolioData.name, { align: 'center' });
    doc.moveDown(0.3);

    const contactParts = [];
    if (portfolioData.location) contactParts.push(portfolioData.location);
    if (portfolioData.email) contactParts.push(portfolioData.email);
    if (contactParts.length) {
      doc.fontSize(10).font('Helvetica').fillColor('#555555').text(contactParts.join('  |  '), { align: 'center' });
    }

    doc.moveDown(0.3);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#4f46e5').text(targetRole.toUpperCase(), { align: 'center' });
    doc.fillColor('#000000');

    // Divider
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#4f46e5').lineWidth(1.5).stroke();
    doc.moveDown(0.5);

    // Summary
    if (tailoredData.summary) {
      doc.fontSize(12).font('Helvetica-Bold').text('PROFESSIONAL SUMMARY');
      doc.moveDown(0.2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke();
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').text(tailoredData.summary, { lineGap: 2 });
      doc.moveDown(0.5);
    }

    // Skills
    if (tailoredData.relevantSkills?.length) {
      doc.fontSize(12).font('Helvetica-Bold').text('TECHNICAL SKILLS');
      doc.moveDown(0.2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke();
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').text(tailoredData.relevantSkills.join('  •  '), { lineGap: 2 });
      doc.moveDown(0.5);
    }

    // Experience
    if (tailoredData.experience?.length) {
      doc.fontSize(12).font('Helvetica-Bold').text('EXPERIENCE');
      doc.moveDown(0.2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke();
      doc.moveDown(0.3);

      tailoredData.experience.forEach((exp) => {
        doc.fontSize(11).font('Helvetica-Bold').text(exp.role);
        doc.fontSize(10).font('Helvetica').fillColor('#555555').text(`${exp.company}  |  ${exp.period}`);
        doc.fillColor('#000000');
        if (exp.bullets?.length) {
          exp.bullets.forEach((bullet) => {
            doc.fontSize(10).font('Helvetica').text(`• ${bullet}`, { indent: 15, lineGap: 1 });
          });
        }
        doc.moveDown(0.3);
      });
      doc.moveDown(0.2);
    }

    // Projects
    if (tailoredData.projects?.length) {
      doc.fontSize(12).font('Helvetica-Bold').text('KEY PROJECTS');
      doc.moveDown(0.2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke();
      doc.moveDown(0.3);

      tailoredData.projects.forEach((proj) => {
        doc.fontSize(11).font('Helvetica-Bold').text(proj.title);
        doc.fontSize(10).font('Helvetica').text(proj.description, { lineGap: 1 });
        if (proj.tech?.length) {
          doc.fontSize(9).font('Helvetica').fillColor('#4f46e5').text(`Tech: ${proj.tech.join(', ')}`);
          doc.fillColor('#000000');
        }
        doc.moveDown(0.3);
      });
      doc.moveDown(0.2);
    }

    // Certificates
    if (tailoredData.certificates?.length) {
      doc.fontSize(12).font('Helvetica-Bold').text('CERTIFICATIONS');
      doc.moveDown(0.2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke();
      doc.moveDown(0.3);

      tailoredData.certificates.forEach((cert) => {
        doc.fontSize(10).font('Helvetica-Bold').text(cert.title, { continued: true });
        doc.font('Helvetica').text(` — ${cert.issuer}${cert.date ? ` (${cert.date})` : ''}`);
      });
    }

    doc.end();
    const pdfBuffer = await pdfPromise;

    const safeRole = targetRole.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
    const fileName = `Resume_${safeRole}_${Date.now()}.pdf`;

    logger.info('Role-based resume generated', { correlationId, role: targetRole, tokens: completion.usage.total_tokens });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Resume generation failed', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to generate resume' });
  }
});

// POST /api/resume/admin/generate - Admin: Generate AI resume (legacy)
router.post('/admin/generate', authMiddleware, async (req, res) => {
  const logger = res.locals.logger;
  const correlationId = res.locals.correlationId;

  try {
    const { targetRole, style = 'professional' } = req.body;

    const [aboutMe, skills, experiences, projects, certificates] = await Promise.all([
      AboutMe.findOne(),
      Skill.find().sort({ proficiency: -1 }),
      Experience.find().sort({ startDate: -1 }),
      Project.find({ published: true }).sort({ order: 1 }).limit(5),
      Certificate.find().sort({ issueDate: -1 })
    ]);

    if (!aboutMe) {
      return res.status(400).json({ error: 'About Me profile is required' });
    }

    const portfolioContext = `
Name: ${aboutMe.headline || 'Portfolio Owner'}
Bio: ${aboutMe.bio || ''}
Location: ${aboutMe.location || ''}
Skills: ${skills.map(s => `${s.name} (${s.proficiency}/5)`).join(', ')}
Experience:
${experiences.map(e => `- ${e.role} at ${e.company}: ${e.description || ''}`).join('\n')}
Projects:
${projects.map(p => `- ${p.title}: ${p.shortDescription || ''} [${p.techStack?.join(', ')}]`).join('\n')}
Certifications:
${certificates.map(c => `- ${c.title} by ${c.issuer}`).join('\n')}`.trim();

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a professional resume writer. Use ONLY the data provided. Never add fake information.' },
        { role: 'user', content: `Generate a ${style} resume for "${targetRole || 'general'}" role:\n\n${portfolioContext}` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 2000
    });

    const generatedResume = completion.choices[0].message.content;

    logger.info('Admin resume generated', { correlationId, targetRole, tokens: completion.usage.total_tokens });

    res.json({
      resume: generatedResume,
      targetRole,
      style,
      tokensUsed: completion.usage.total_tokens,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Resume generation failed', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to generate resume' });
  }
});

module.exports = router;
