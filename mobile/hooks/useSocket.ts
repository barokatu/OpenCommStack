import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function useSocket() {
  const { token, isAuthenticated, serverUrl } = useAuthStore();
  const { setTyping, setUserOnline } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated || !token || !serverUrl) return;
    if (socket?.connected) return;

    socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => console.log('🔌 Socket connected'));
    socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
    socket.on('user:online', (data: { userId: string; isOnline: boolean }) => {
      setUserOnline(data.userId, data.isOnline);
    });
    socket.on('message:typing', (data: { chatId: string; userId: string; isTyping: boolean }) => {
      setTyping(data.chatId, data.userId, data.isTyping);
    });

    return () => {};
  }, [isAuthenticated, token, serverUrl, setTyping, setUserOnline]);

  const sendMessage = useCallback((data: any) => {
    return new Promise<any>((resolve, reject) => {
      if (!socket) return reject('Not connected');
      socket.emit('message:send', data, (response: any) => {
        if (response.success) resolve(response.message);
        else reject(response.error);
      });
    });
  }, []);

  const sendTyping = useCallback((chatId: string, isTyping: boolean) => {
    socket?.emit('message:typing', { chatId, isTyping });
  }, []);

  const markRead = useCallback((chatId: string, messageIds: string[]) => {
    socket?.emit('message:read', { chatId, messageIds });
  }, []);

  const editMessage = useCallback((messageId: string, chatId: string, content: string) => {
    socket?.emit('message:edit', { messageId, chatId, content });
  }, []);

  const deleteMessage = useCallback((messageId: string, chatId: string) => {
    socket?.emit('message:delete', { messageId, chatId });
  }, []);

  const addReaction = useCallback((messageId: string, chatId: string, emoji: string) => {
    socket?.emit('message:reaction', { messageId, chatId, emoji });
  }, []);

  const joinChat = useCallback((chatId: string) => {
    socket?.emit('chat:join', { chatId });
  }, []);

  return { sendMessage, sendTyping, markRead, editMessage, deleteMessage, addReaction, joinChat };
}
