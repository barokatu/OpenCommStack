import { create } from 'zustand';

interface ChatState {
  activeChatId: string | null;
  typingUsers: Record<string, string[]>;
  onlineUsers: Record<string, boolean>;
  setActiveChat: (id: string | null) => void;
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  activeChatId: null,
  typingUsers: {},
  onlineUsers: {},
  setActiveChat: (id) => set({ activeChatId: id }),
  setTyping: (chatId, userId, isTyping) =>
    set((s) => {
      const current = s.typingUsers[chatId] || [];
      const updated = isTyping
        ? [...new Set([...current, userId])]
        : current.filter((u) => u !== userId);
      return { typingUsers: { ...s.typingUsers, [chatId]: updated } };
    }),
  setUserOnline: (userId, isOnline) =>
    set((s) => ({ onlineUsers: { ...s.onlineUsers, [userId]: isOnline } })),
}));
