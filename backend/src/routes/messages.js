const express = require('express');
const { prisma } = require('../lib/prisma');
const { authMiddleware } = require('../middleware/auth');
const { encrypt, decrypt } = require('../lib/crypto');

const router = express.Router();

// Get messages for a chat (paginated)
router.get('/:chatId', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { cursor, limit = 50 } = req.query;

    const where = { chatId };
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        reactions: { include: { user: { select: { id: true, name: true } } } },
        replyTo: {
          include: { sender: { select: { id: true, name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    // Decrypt messages
    const decrypted = messages.map(msg => ({
      ...msg,
      content: msg.encryptedContent ? decrypt(msg.encryptedContent) : msg.content
    }));

    res.json({ messages: decrypted.reverse() });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Gagal memuat pesan' });
  }
});

// Send message (REST fallback, primary via Socket.io)
router.post('/:chatId', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, type = 'text', mediaUrl, mediaType, fileName, fileSize, replyToId } = req.body;

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: req.userId,
        content: type === 'text' ? content : null,
        encryptedContent: type === 'text' ? encrypt(content) : null,
        type,
        mediaUrl,
        mediaType,
        fileName,
        fileSize,
        replyToId
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        replyTo: {
          include: { sender: { select: { id: true, name: true } } }
        }
      }
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json({ message: { ...message, content } });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Gagal mengirim pesan' });
  }
});

// Edit message
router.put('/:messageId', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await prisma.message.update({
      where: { id: req.params.messageId, senderId: req.userId },
      data: {
        content,
        encryptedContent: encrypt(content),
        isEdited: true
      }
    });
    res.json({ message: { ...message, content } });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengedit pesan' });
  }
});

// Delete message
router.delete('/:messageId', authMiddleware, async (req, res) => {
  try {
    await prisma.message.update({
      where: { id: req.params.messageId, senderId: req.userId },
      data: { isDeleted: true, content: null, encryptedContent: null, mediaUrl: null }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus pesan' });
  }
});

// Add reaction
router.post('/:messageId/reactions', authMiddleware, async (req, res) => {
  try {
    const { emoji } = req.body;
    const reaction = await prisma.messageReaction.upsert({
      where: { messageId_userId: { messageId: req.params.messageId, userId: req.userId } },
      update: { emoji },
      create: { messageId: req.params.messageId, userId: req.userId, emoji }
    });
    res.json({ reaction });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambah reaksi' });
  }
});

// Remove reaction
router.delete('/:messageId/reactions', authMiddleware, async (req, res) => {
  try {
    await prisma.messageReaction.delete({
      where: { messageId_userId: { messageId: req.params.messageId, userId: req.userId } }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus reaksi' });
  }
});

// Search messages across chats
router.get('/search/all', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ messages: [] });

    const userChats = await prisma.chatMember.findMany({
      where: { userId: req.userId },
      select: { chatId: true }
    });
    const chatIds = userChats.map(c => c.chatId);

    const messages = await prisma.message.findMany({
      where: {
        chatId: { in: chatIds },
        isDeleted: false,
        content: { contains: q, mode: 'insensitive' }
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        chat: { select: { id: true, name: true, isGroup: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mencari pesan' });
  }
});

module.exports = router;
