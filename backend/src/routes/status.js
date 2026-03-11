const express = require('express');
const { prisma } = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get active statuses (not expired)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const statuses = await prisma.status.findMany({
      where: {
        expiresAt: { gt: new Date() }
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, phone: true } },
        views: {
          include: { user: { select: { id: true, name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by user
    const grouped = {};
    for (const status of statuses) {
      if (!grouped[status.userId]) {
        grouped[status.userId] = {
          user: status.user,
          statuses: [],
          hasUnviewed: false
        };
      }
      grouped[status.userId].statuses.push(status);
      if (!status.views.some(v => v.userId === req.userId)) {
        grouped[status.userId].hasUnviewed = true;
      }
    }

    // Separate my statuses from others
    const myStatuses = grouped[req.userId] || null;
    delete grouped[req.userId];

    res.json({
      myStatuses,
      otherStatuses: Object.values(grouped)
    });
  } catch (err) {
    console.error('Get statuses error:', err);
    res.status(500).json({ error: 'Gagal memuat status' });
  }
});

// Create status
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, mediaUrl, mediaType, type = 'text', bgColor, audience = 'everyone' } = req.body;

    const status = await prisma.status.create({
      data: {
        userId: req.userId,
        content,
        mediaUrl,
        mediaType,
        type,
        bgColor,
        audience,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    res.status(201).json({ status });
  } catch (err) {
    console.error('Create status error:', err);
    res.status(500).json({ error: 'Gagal membuat status' });
  }
});

// View status (mark as seen)
router.post('/:id/view', authMiddleware, async (req, res) => {
  try {
    await prisma.statusView.upsert({
      where: { statusId_userId: { statusId: req.params.id, userId: req.userId } },
      update: { viewedAt: new Date() },
      create: { statusId: req.params.id, userId: req.userId }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menandai status' });
  }
});

// Delete status
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.status.delete({
      where: { id: req.params.id, userId: req.userId }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus status' });
  }
});

module.exports = router;
