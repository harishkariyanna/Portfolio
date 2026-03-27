const express = require('express');
const Groq = require('groq-sdk');
const { LRUCache } = require('lru-cache');
const AboutMe = require('../models/AboutMe.model');
const Skill = require('../models/Skill.model');
const Experience = require('../models/Experience.model');
const Project = require('../models/Project.model');
const Certificate = require('../models/Certificate.model');
const ChatbotConversation = require('../models/ChatbotConversation.model');

const router = express.Router();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// LRU Cache: 100 entries, 1 hour TTL
const responseCache = new LRUCache({ max: 100, ttl: 3600000 });

// Portfolio context cache (refreshed every 10 min)
let portfolioContext = null;
let contextLastFetched = 0;
const CONTEXT_TTL = 10 * 60 * 1000;

// Circuit breaker state
let circuitOpen = false;
let circuitOpenTime = null;
const CIRCUIT_COOLDOWN = 5 * 60 * 1000;
let failureCount = 0;

// PII Sanitization
const sanitizePII = (text) => {
  let sanitized = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
  sanitized = sanitized.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE_REDACTED]');
  return sanitized;
};

// Build portfolio context from actual DB data
const buildPortfolioContext = async () => {
  if (portfolioContext && Date.now() - contextLastFetched < CONTEXT_TTL) {
    return portfolioContext;
  }

  const [aboutMe, skills, experiences, projects, certificates] = await Promise.all([
    AboutMe.findOne().lean(),
    Skill.find().sort({ proficiency: -1 }).lean(),
    Experience.find().sort({ startDate: -1 }).lean(),
    Project.find({ published: true }).sort({ order: 1 }).lean(),
    Certificate.find().sort({ issueDate: -1 }).lean()
  ]);

  const sections = [];

  if (aboutMe) {
    sections.push(`ABOUT:\nName/Headline: ${aboutMe.headline || 'N/A'}\nBio: ${aboutMe.bio || 'N/A'}\nLocation: ${aboutMe.location || 'N/A'}`);
  }

  if (skills.length > 0) {
    const grouped = {};
    skills.forEach(s => {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(`${s.name} (${s.proficiency}/5)`);
    });
    const skillText = Object.entries(grouped)
      .map(([cat, items]) => `  ${cat}: ${items.join(', ')}`)
      .join('\n');
    sections.push(`SKILLS:\n${skillText}`);
  }

  if (experiences.length > 0) {
    const expText = experiences.map(e => {
      const start = e.startDate ? new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
      const end = e.current ? 'Present' : (e.endDate ? new Date(e.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
      return `- ${e.role} at ${e.company} (${start} - ${end}): ${e.description || ''}${e.highlights?.length ? '\n  Highlights: ' + e.highlights.join('; ') : ''}`;
    }).join('\n');
    sections.push(`EXPERIENCE:\n${expText}`);
  }

  if (projects.length > 0) {
    const projText = projects.map(p =>
      `- ${p.title}: ${p.shortDescription || p.description?.substring(0, 150) || ''} [Tech: ${p.techStack?.join(', ') || 'N/A'}]`
    ).join('\n');
    sections.push(`PROJECTS:\n${projText}`);
  }

  if (certificates.length > 0) {
    const certText = certificates.map(c =>
      `- ${c.title} by ${c.issuer} (${c.issueDate ? new Date(c.issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'})`
    ).join('\n');
    sections.push(`CERTIFICATES:\n${certText}`);
  }

  portfolioContext = sections.join('\n\n');
  contextLastFetched = Date.now();
  return portfolioContext;
};

// POST /api/chatbot
router.post('/', async (req, res) => {
  const logger = res.locals.logger;
  const correlationId = res.locals.correlationId;
  const startTime = Date.now();

  try {
    const { query, sessionId } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (query.length > 1000) {
      return res.status(400).json({ error: 'Query too long (max 1000 chars)' });
    }

    const sanitizedQuery = sanitizePII(query.trim());

    // Check cache
    const cacheKey = sanitizedQuery.toLowerCase().substring(0, 200);
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse) {
      await ChatbotConversation.create({
        sessionId: sessionId || 'anonymous',
        query: sanitizedQuery,
        response: cachedResponse.response,
        intent: cachedResponse.intent,
        cached: true,
        responseTime: Date.now() - startTime,
        ip: req.ip
      });
      return res.json({ ...cachedResponse, cached: true });
    }

    // Check circuit breaker
    if (circuitOpen) {
      if (Date.now() - circuitOpenTime > CIRCUIT_COOLDOWN) {
        circuitOpen = false;
        failureCount = 0;
      } else {
        return res.json({
          response: "I'm temporarily unavailable. Please try again in a few minutes, or use the contact form to reach out directly.",
          intent: 'fallback',
          sources: []
        });
      }
    }

    // Fetch real portfolio data from database
    const context = await buildPortfolioContext();

    const systemPrompt = `You are an AI assistant for this person's tech portfolio website. You must answer questions ONLY based on the portfolio data provided below. If the question is not related to the portfolio or you cannot find the answer in the data, say "I can only answer questions about this portfolio. Try asking about skills, projects, experience, or certifications."

PORTFOLIO DATA:
${context}

RULES:
- ONLY use information from the portfolio data above
- NEVER make up or assume information not present in the data
- Be concise, helpful, and professional
- If asked about something not in the data, politely redirect to what you do know
- Keep responses under 300 characters when possible`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: sanitizedQuery }
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 500,
      top_p: 1,
      stream: false
    });

    const aiResponse = completion.choices[0].message.content;
    failureCount = 0;

    const result = {
      response: aiResponse,
      intent: 'general',
      sources: [],
      tokensUsed: {
        prompt: completion.usage.prompt_tokens,
        completion: completion.usage.completion_tokens,
        total: completion.usage.total_tokens
      }
    };

    responseCache.set(cacheKey, result);

    await ChatbotConversation.create({
      sessionId: sessionId || 'anonymous',
      query: sanitizedQuery,
      response: aiResponse,
      intent: 'general',
      tokensUsed: result.tokensUsed,
      modelUsed: 'llama-3.3-70b-versatile',
      cached: false,
      responseTime: Date.now() - startTime,
      ip: req.ip
    });

    logger.info('Chatbot response generated', {
      correlationId,
      intent: 'general',
      tokens: result.tokensUsed.total,
      responseTime: `${Date.now() - startTime}ms`
    });

    res.json(result);
  } catch (error) {
    failureCount++;
    if (failureCount >= 5) {
      circuitOpen = true;
      circuitOpenTime = Date.now();
      logger.error('Circuit breaker opened', { correlationId });
    }

    logger.error('Chatbot error', { correlationId, error: error.message });
    res.json({
      response: "I'm having trouble processing your request right now. Please try again later or use the contact form.",
      intent: 'fallback',
      sources: []
    });
  }
});

module.exports = router;
