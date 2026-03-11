const express = require('express');
const { prisma } = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, phone: true, name: true, about: true, avatar: true,
        darkMode: true, language: true, isOnline: true, lastSeen: true,
        privacyLastSeen: true, privacyAvatar: true, privacyAbout: true
      }
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat profil' });
  }
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, about, avatar, darkMode, language, privacyLastSeen, privacyAvatar, privacyAbout } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(about !== undefined && { about }),
        ...(avatar !== undefined && { avatar }),
        ...(darkMode !== undefined && { darkMode }),
        ...(language !== undefined && { language }),
        ...(privacyLastSeen !== undefined && { privacyLastSeen }),
        ...(privacyAvatar !== undefined && { privacyAvatar }),
        ...(privacyAbout !== undefined && { privacyAbout })
      },
      select: {
        id: true, phone: true, name: true, about: true, avatar: true,
        darkMode: true, language: true, privacyLastSeen: true, privacyAvatar: true, privacyAbout: true
      }
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengubah profil' });
  }
});

// Search users by phone or name
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ users: [] });

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: req.userId } },
          {
            OR: [
              { phone: { contains: q } },
              { name: { contains: q, mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: { id: true, phone: true, name: true, about: true, avatar: true, isOnline: true, lastSeen: true },
      take: 20
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mencari pengguna' });
  }
});

// Get contacts
router.get('/contacts', authMiddleware, async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany({
      where: { userId: req.userId },
      include: {
        contact: {
          select: { id: true, phone: true, name: true, about: true, avatar: true, isOnline: true, lastSeen: true }
        }
      }
    });
    res.json({ contacts: contacts.map(c => ({ ...c.contact, nickname: c.nickname })) });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat kontak' });
  }
});

// Add contact
router.post('/contacts', authMiddleware, async (req, res) => {
  try {
    const { phone, nickname } = req.body;
    const contactUser = await prisma.user.findUnique({ where: { phone } });
    if (!contactUser) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }
    if (contactUser.id === req.userId) {
      return res.status(400).json({ error: 'Tidak bisa menambahkan diri sendiri' });
    }

    const contact = await prisma.contact.upsert({
      where: { userId_contactId: { userId: req.userId, contactId: contactUser.id } },
      update: { nickname },
      create: { userId: req.userId, contactId: contactUser.id, nickname }
    });

    res.status(201).json({ contact: { ...contactUser, nickname } });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambah kontak' });
  }
});

// Get all users (for contact discovery)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { id: { not: req.userId } },
      select: { id: true, phone: true, name: true, about: true, avatar: true, isOnline: true, lastSeen: true },
      orderBy: { name: 'asc' }
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat pengguna' });
  }
});

module.exports = router;
