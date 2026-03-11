const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');

// Get call history for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 50, cursor } = req.query;

    const calls = await prisma.call.findMany({
      where: {
        participants: {
          some: { userId }
        }
      },
      include: {
        initiator: {
          select: { id: true, name: true, avatar: true, phone: true }
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, phone: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    // Enrich each call with the "other user" info for display
    const enrichedCalls = calls.map(call => {
      const otherParticipants = call.participants.filter(p => p.userId !== userId);
      const myParticipant = call.participants.find(p => p.userId === userId);
      const isInitiator = call.initiatorId === userId;

      // Determine call status from user perspective
      let displayStatus;
      if (call.status === 'ended') {
        displayStatus = 'completed';
      } else if (call.status === 'active') {
        displayStatus = 'active';
      } else if (myParticipant?.status === 'rejected') {
        displayStatus = 'rejected';
      } else if (!isInitiator && call.status === 'ringing') {
        displayStatus = 'missed';
      } else {
        displayStatus = call.status; // ringing, etc.
      }

      return {
        id: call.id,
        type: call.type,
        status: displayStatus,
        isInitiator,
        duration: call.duration,
        createdAt: call.createdAt,
        startedAt: call.startedAt,
        endedAt: call.endedAt,
        otherUser: otherParticipants[0]?.user || call.initiator,
        otherParticipants: otherParticipants.map(p => p.user),
        isGroup: call.isGroup,
      };
    });

    res.json({ calls: enrichedCalls });
  } catch (err) {
    console.error('Get calls error:', err);
    res.status(500).json({ error: 'Failed to get call history' });
  }
});

module.exports = router;
