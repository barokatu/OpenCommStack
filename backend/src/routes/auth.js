const express = require('express');
const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');
const { authMiddleware, generateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { phone, pin, name } = req.body;

    if (!phone || !pin || !name) {
      return res.status(400).json({ error: 'Phone, PIN, dan nama wajib diisi' });
    }

    if (pin.length !== 6) {
      return res.status(400).json({ error: 'PIN harus 6 digit' });
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return res.status(409).json({ error: 'Nomor telepon sudah terdaftar' });
    }

    const hashedPin = await bcrypt.hash(pin, 10);
    const user = await prisma.user.create({
      data: { phone, pin: hashedPin, name },
      select: { id: true, phone: true, name: true, about: true, avatar: true, createdAt: true }
    });

    const token = generateToken(user.id);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Gagal mendaftar' });
  }
});

// Login / verify PIN
router.post('/verify', async (req, res) => {
  try {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      return res.status(400).json({ error: 'Phone dan PIN wajib diisi' });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(404).json({ error: 'Nomor telepon tidak ditemukan' });
    }

    const valid = await bcrypt.compare(pin, user.pin);
    if (!valid) {
      return res.status(401).json({ error: 'PIN salah' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() }
    });

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        about: user.about,
        avatar: user.avatar,
        darkMode: user.darkMode
      },
      token
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Gagal masuk' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, phone: true, name: true, about: true, avatar: true,
        darkMode: true, language: true, isOnline: true, lastSeen: true,
        privacyLastSeen: true, privacyAvatar: true, privacyAbout: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Gagal memuat profil' });
  }
});

module.exports = router;
