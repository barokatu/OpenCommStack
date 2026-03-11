import { create } from 'zustand';

interface ChatState {
  activeChatId: string | null;
  typingUsers: Record<string, string[]>; // chatId -> userId[]
  onlineUsers: Record<string, boolean>;
  setActiveChatId: (id: string | null) => void;
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  activeChatId: null,
  typingUsers: {},
  onlineUsers: {},

  setActiveChatId: (id) => set({ activeChatId: id }),

  setTyping: (chatId, userId, isTyping) => set((state) => {
    const current = state.typingUsers[chatId] || [];
    const updated = isTyping
      ? [...new Set([...current, userId])]
      : current.filter(id => id !== userId);
    return {
      typingUsers: { ...state.typingUsers, [chatId]: updated }
    };
  }),

  setUserOnline: (userId, isOnline) => set((state) => ({
    onlineUsers: { ...state.onlineUsers, [userId]: isOnline }
  })),
}));
