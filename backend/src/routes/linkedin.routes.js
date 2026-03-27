const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth.middleware');
const AboutMe = require('../models/AboutMe.model');
const Skill = require('../models/Skill.model');
const Experience = require('../models/Experience.model');

const router = express.Router();

// GET /api/linkedin/auth - Initiate LinkedIn OAuth
router.get('/auth', authMiddleware, (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${process.env.FRONTEND_URL}/admin/content?linkedinCallback=true`;
  const state = Math.random().toString(36).substring(7);
  const scope = 'openid profile email w_member_social';

  if (!clientId) {
    return res.status(500).json({ error: 'LinkedIn Client ID not configured' });
  }

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;

  res.json({ authUrl, state });
});

// POST /api/linkedin/callback - Exchange code for access token
router.post('/callback', authMiddleware, async (req, res) => {
  const logger = res.locals.logger;
  const correlationId = res.locals.correlationId;

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI || `${process.env.FRONTEND_URL}/admin/content?linkedinCallback=true`,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenResponse.data.access_token;

    // Fetch LinkedIn profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const profile = profileResponse.data;

    // Map LinkedIn data to your schema
    const aboutData = {
      headline: profile.name || '',
      bio: profile.description || profile.headline || 'Professional profile',
      email: profile.email || '',
      profileImage: profile.picture || '',
      location: profile.locale?.country || '',
      socialLinks: [
        {
          platform: 'linkedin',
          url: `https://www.linkedin.com/in/${profile.sub}`,
          visible: true,
          order: 0
        }
      ]
    };

    // Update or create About Me
    let about = await AboutMe.findOne();
    if (about) {
      Object.assign(about, aboutData);
      await about.save();
    } else {
      about = await AboutMe.create(aboutData);
    }

    logger.info('LinkedIn profile synced', { correlationId, name: profile.name });

    res.json({
      message: 'LinkedIn profile synced successfully',
      profile: {
        name: profile.name,
        email: profile.email,
        picture: profile.picture
      }
    });
  } catch (error) {
    logger.error('LinkedIn sync failed', { correlationId, error: error.message });
    res.status(500).json({ 
      error: 'Failed to sync LinkedIn profile',
      details: error.response?.data?.message || error.message
    });
  }
});

module.exports = router;
