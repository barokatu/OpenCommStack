const { prisma } = require('../lib/prisma');
const { encrypt, decrypt } = require('../lib/crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'opencommstack-local-secret-key-2024';

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

function setupSocket(io) {
  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`User connected: ${userId} (socket: ${socket.id})`);

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Update user online status
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, lastSeen: new Date() }
    });

    // Join user's chat rooms
    const chatMembers = await prisma.chatMember.findMany({
      where: { userId },
      select: { chatId: true }
    });
    chatMembers.forEach(cm => socket.join(`chat:${cm.chatId}`));

    // Broadcast online status
    io.emit('user:online', { userId, isOnline: true });

    // ---- Message events ----

    socket.on('message:send', async (data, callback) => {
      try {
        const { chatId, content, type = 'text', mediaUrl, mediaType, fileName, fileSize, replyToId, tempId } = data;

        const message = await prisma.message.create({
          data: {
            chatId,
            senderId: userId,
            content: type === 'text' ? content : null,
            encryptedContent: type === 'text' && content ? encrypt(content) : null,
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
            },
            reactions: true
          }
        });

        await prisma.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() }
        });

        const messageToSend = { ...message, content, tempId };

        // Emit to chat room
        io.to(`chat:${chatId}`).emit('message:new', messageToSend);

        if (callback) callback({ success: true, message: messageToSend });
      } catch (err) {
        console.error('Socket message:send error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('message:typing', (data) => {
      socket.to(`chat:${data.chatId}`).emit('message:typing', {
        chatId: data.chatId,
        userId,
        isTyping: data.isTyping
      });
    });

    socket.on('message:read', async (data) => {
      try {
        const { chatId, messageIds } = data;

        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
            chatId,
            NOT: { readBy: { has: userId } }
          },
          data: {
            readBy: { push: userId }
          }
        });

        io.to(`chat:${chatId}`).emit('message:read', {
          chatId,
          messageIds,
          userId
        });
      } catch (err) {
        console.error('Socket message:read error:', err);
      }
    });

    socket.on('message:edit', async (data) => {
      try {
        const { messageId, chatId, content } = data;
        await prisma.message.update({
          where: { id: messageId, senderId: userId },
          data: { content, encryptedContent: encrypt(content), isEdited: true }
        });

        io.to(`chat:${chatId}`).emit('message:edited', {
          messageId, chatId, content, isEdited: true
        });
      } catch (err) {
        console.error('Socket message:edit error:', err);
      }
    });

    socket.on('message:delete', async (data) => {
      try {
        const { messageId, chatId } = data;
        await prisma.message.update({
          where: { id: messageId, senderId: userId },
          data: { isDeleted: true, content: null, encryptedContent: null, mediaUrl: null }
        });

        io.to(`chat:${chatId}`).emit('message:deleted', {
          messageId, chatId
        });
      } catch (err) {
        console.error('Socket message:delete error:', err);
      }
    });

    socket.on('message:reaction', async (data) => {
      try {
        const { messageId, chatId, emoji } = data;
        const reaction = await prisma.messageReaction.upsert({
          where: { messageId_userId: { messageId, userId } },
          update: { emoji },
          create: { messageId, userId, emoji },
          include: { user: { select: { id: true, name: true } } }
        });

        io.to(`chat:${chatId}`).emit('message:reaction', {
          messageId, chatId, reaction
        });
      } catch (err) {
        console.error('Socket message:reaction error:', err);
      }
    });

    // ---- Chat events ----

    socket.on('chat:join', (data) => {
      socket.join(`chat:${data.chatId}`);
    });

    socket.on('chat:leave', (data) => {
      socket.leave(`chat:${data.chatId}`);
    });

    // ---- WebRTC signaling ----

    socket.on('call:initiate', async (data) => {
      try {
        const { targetUserIds, type = 'voice', isGroup = false } = data;

        const call = await prisma.call.create({
          data: {
            initiatorId: userId,
            type,
            isGroup,
            participants: {
              create: [
                { userId, status: 'connected', joinedAt: new Date() },
                ...targetUserIds.map(id => ({ userId: id, status: 'ringing' }))
              ]
            }
          },
          include: {
            initiator: { select: { id: true, name: true, avatar: true } },
            participants: {
              include: { user: { select: { id: true, name: true, avatar: true } } }
            }
          }
        });

        // Notify target users
        targetUserIds.forEach(targetId => {
          const targetSockets = onlineUsers.get(targetId);
          if (targetSockets) {
            targetSockets.forEach(socketId => {
              io.to(socketId).emit('call:incoming', {
                call,
                from: { id: userId, name: call.initiator.name, avatar: call.initiator.avatar }
              });
            });
          }
        });

        socket.emit('call:initiated', { call });
      } catch (err) {
        console.error('Call initiate error:', err);
      }
    });

    socket.on('call:accept', async (data) => {
      try {
        const { callId } = data;
        await prisma.callParticipant.update({
          where: { callId_userId: { callId, userId } },
          data: { status: 'connected', joinedAt: new Date() }
        });

        await prisma.call.update({
          where: { id: callId },
          data: { status: 'active', startedAt: new Date() }
        });

        // Notify all participants
        const call = await prisma.call.findUnique({
          where: { id: callId },
          include: { participants: { select: { userId: true } } }
        });

        call.participants.forEach(p => {
          const sockets = onlineUsers.get(p.userId);
          if (sockets) {
            sockets.forEach(sid => {
              io.to(sid).emit('call:accepted', { callId, userId });
            });
          }
        });
      } catch (err) {
        console.error('Call accept error:', err);
      }
    });

    socket.on('call:reject', async (data) => {
      try {
        const { callId } = data;
        await prisma.callParticipant.update({
          where: { callId_userId: { callId, userId } },
          data: { status: 'rejected' }
        });

        const call = await prisma.call.findUnique({
          where: { id: callId },
          include: { participants: { select: { userId: true } } }
        });

        call.participants.forEach(p => {
          const sockets = onlineUsers.get(p.userId);
          if (sockets) {
            sockets.forEach(sid => {
              io.to(sid).emit('call:rejected', { callId, userId });
            });
          }
        });
      } catch (err) {
        console.error('Call reject error:', err);
      }
    });

    socket.on('call:end', async (data) => {
      try {
        const { callId } = data;
        const call = await prisma.call.update({
          where: { id: callId },
          data: {
            status: 'ended',
            endedAt: new Date(),
            duration: data.duration || 0
          },
          include: { participants: { select: { userId: true } } }
        });

        call.participants.forEach(p => {
          const sockets = onlineUsers.get(p.userId);
          if (sockets) {
            sockets.forEach(sid => {
              io.to(sid).emit('call:ended', { callId, duration: call.duration });
            });
          }
        });
      } catch (err) {
        console.error('Call end error:', err);
      }
    });

    // WebRTC SDP/ICE exchange
    socket.on('webrtc:offer', (data) => {
      const { targetUserId, offer, callId } = data;
      const targetSockets = onlineUsers.get(targetUserId);
      if (targetSockets) {
        targetSockets.forEach(sid => {
          io.to(sid).emit('webrtc:offer', { offer, callId, from: userId });
        });
      }
    });

    socket.on('webrtc:answer', (data) => {
      const { targetUserId, answer, callId } = data;
      const targetSockets = onlineUsers.get(targetUserId);
      if (targetSockets) {
        targetSockets.forEach(sid => {
          io.to(sid).emit('webrtc:answer', { answer, callId, from: userId });
        });
      }
    });

    socket.on('webrtc:ice-candidate', (data) => {
      const { targetUserId, candidate, callId } = data;
      const targetSockets = onlineUsers.get(targetUserId);
      if (targetSockets) {
        targetSockets.forEach(sid => {
          io.to(sid).emit('webrtc:ice-candidate', { candidate, callId, from: userId });
        });
      }
    });

    // ---- Disconnect ----

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId} (socket: ${socket.id})`);

      if (onlineUsers.has(userId)) {
        onlineUsers.get(userId).delete(socket.id);
        if (onlineUsers.get(userId).size === 0) {
          onlineUsers.delete(userId);

          await prisma.user.update({
            where: { id: userId },
            data: { isOnline: false, lastSeen: new Date() }
          });

          io.emit('user:online', { userId, isOnline: false, lastSeen: new Date() });
        }
      }
    });
  });
}

module.exports = { setupSocket, onlineUsers };
