const express = require('express');
const { prisma } = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// List user's chats with last message
router.get('/', authMiddleware, async (req, res) => {
  try {
    const chatMembers = await prisma.chatMember.findMany({
      where: { userId: req.userId, archived: false },
      include: {
        chat: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, phone: true, avatar: true, isOnline: true, lastSeen: true } }
              }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: { select: { id: true, name: true } }
              }
            }
          }
        }
      },
      orderBy: { chat: { updatedAt: 'desc' } }
    });

    const chats = chatMembers.map(cm => ({
      ...cm.chat,
      lastMessage: cm.chat.messages[0] || null,
      members: cm.chat.members.map(m => m.user),
      muted: cm.muted,
      pinned: cm.pinned,
      unreadCount: 0
    }));

    // Calculate unread counts
    for (const chat of chats) {
      const unread = await prisma.message.count({
        where: {
          chatId: chat.id,
          senderId: { not: req.userId },
          NOT: { readBy: { has: req.userId } }
        }
      });
      chat.unreadCount = unread;
    }

    res.json({ chats });
  } catch (err) {
    console.error('List chats error:', err);
    res.status(500).json({ error: 'Gagal memuat obrolan' });
  }
});

// Create 1:1 chat
router.post('/direct', authMiddleware, async (req, res) => {
  try {
    const { userId: otherUserId } = req.body;

    // Check if direct chat already exists
    const existing = await prisma.chat.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: req.userId } } },
          { members: { some: { userId: otherUserId } } }
        ]
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, phone: true, avatar: true, isOnline: true, lastSeen: true } }
          }
        }
      }
    });

    if (existing) {
      return res.json({ chat: { ...existing, members: existing.members.map(m => m.user) } });
    }

    const chat = await prisma.chat.create({
      data: {
        isGroup: false,
        members: {
          create: [
            { userId: req.userId },
            { userId: otherUserId }
          ]
        }
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, phone: true, avatar: true, isOnline: true, lastSeen: true } }
          }
        }
      }
    });

    res.status(201).json({ chat: { ...chat, members: chat.members.map(m => m.user) } });
  } catch (err) {
    console.error('Create direct chat error:', err);
    res.status(500).json({ error: 'Gagal membuat obrolan' });
  }
});

// Create group chat
router.post('/group', authMiddleware, async (req, res) => {
  try {
    const { name, memberIds, avatar } = req.body;

    if (!name || !memberIds || memberIds.length < 1) {
      return res.status(400).json({ error: 'Nama grup dan anggota wajib diisi' });
    }

    const allMemberIds = [...new Set([req.userId, ...memberIds])];

    const chat = await prisma.chat.create({
      data: {
        name,
        isGroup: true,
        avatar,
        members: {
          create: allMemberIds.map(userId => ({
            userId,
            role: userId === req.userId ? 'admin' : 'member'
          }))
        }
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, phone: true, avatar: true, isOnline: true, lastSeen: true } }
          }
        }
      }
    });

    res.status(201).json({ chat: { ...chat, members: chat.members.map(m => m.user) } });
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ error: 'Gagal membuat grup' });
  }
});

// Get single chat
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, phone: true, avatar: true, isOnline: true, lastSeen: true } }
          }
        }
      }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Obrolan tidak ditemukan' });
    }

    const isMember = chat.members.some(m => m.user.id === req.userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Bukan anggota obrolan' });
    }

    res.json({ chat: { ...chat, members: chat.members.map(m => m.user) } });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat obrolan' });
  }
});

// Update group
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, avatar } = req.body;
    const chat = await prisma.chat.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(avatar !== undefined && { avatar })
      }
    });
    res.json({ chat });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengubah grup' });
  }
});

module.exports = router;
