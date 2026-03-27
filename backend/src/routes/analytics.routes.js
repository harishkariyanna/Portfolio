const express = require('express');
const VisitorAnalytics = require('../models/VisitorAnalytics.model');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/analytics/track - Public: Track visitor action
router.post('/track', async (req, res) => {
  try {
    const { sessionId, page, action, metadata } = req.body;

    if (!sessionId || !page) {
      return res.status(400).json({ error: 'sessionId and page are required' });
    }

    const userAgent = req.get('user-agent') || '';
    const device = /mobile/i.test(userAgent) ? 'mobile' : /tablet/i.test(userAgent) ? 'tablet' : 'desktop';

    await VisitorAnalytics.create({
      sessionId,
      ip: req.ip,
      userAgent,
      referrer: req.get('referrer') || '',
      page,
      action: action || 'page_view',
      metadata,
      device,
      browser: userAgent.split('/')[0] || 'unknown'
    });

    res.status(201).json({ message: 'Event tracked' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// GET /api/admin/analytics/summary - Admin: Get dashboard summary
router.get('/admin/summary', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalViews, uniqueSessions, actionBreakdown, topPages, deviceBreakdown, dailyViews] = await Promise.all([
      VisitorAnalytics.countDocuments({ createdAt: { $gte: since } }),
      VisitorAnalytics.distinct('sessionId', { createdAt: { $gte: since } }).then((s) => s.length),
      VisitorAnalytics.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      VisitorAnalytics.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$page', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      VisitorAnalytics.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$device', count: { $sum: 1 } } }
      ]),
      VisitorAnalytics.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      period: `Last ${days} days`,
      totalViews,
      uniqueSessions,
      actionBreakdown,
      topPages,
      deviceBreakdown,
      dailyViews
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

module.exports = router;
