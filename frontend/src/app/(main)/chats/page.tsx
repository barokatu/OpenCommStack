"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MoreVertical,
  MessageSquarePlus,
  X,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { api } from "@/lib/api";
import { id as t } from "@/lib/i18n";
import {
  cn,
  formatTime,
  getChatDisplayName,
  getChatAvatar,
  getOtherUser,
  truncate,
} from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";

export default function ChatsPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const { typingUsers, onlineUsers } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { data: chatsData, refetch } = useQuery({
    queryKey: ["chats"],
    queryFn: () => api.getChats(token!),
    enabled: !!token,
    refetchInterval: 5000,
  });

  const chats = chatsData?.chats || [];
  const filteredChats = searchQuery
    ? chats.filter((chat: any) =>
        getChatDisplayName(chat, user!.id)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      )
    : chats;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-wa-primary dark:bg-wa-headerDark px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-white tracking-tight">
            OpenCommStack
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <Search className="w-5 h-5 text-white/90" />
            </button>
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <MoreVertical className="w-5 h-5 text-white/90" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchChat}
                  className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-wa-darkInput rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-wa-dark">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-wa-darkSurface flex items-center justify-center mb-4">
              <MessageSquarePlus className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {t.noChats}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              {t.startChatting}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-wa-separatorDark">
            {filteredChats.map((chat: any, index: number) => {
              const displayName = getChatDisplayName(chat, user!.id);
              const avatar = getChatAvatar(chat, user!.id);
              const other = !chat.isGroup
                ? getOtherUser(chat.members, user!.id)
                : null;
              const isOnline = other
                ? (onlineUsers[other.id] ?? other.isOnline)
                : false;
              const isTyping = typingUsers[chat.id]?.length > 0;
              const lastMessage = chat.lastMessage;

              return (
                <motion.button
                  key={chat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => router.push(`/chats/${chat.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-wa-darkSurface transition-colors text-left"
                >
                  <Avatar
                    src={avatar}
                    name={displayName}
                    size="lg"
                    online={!chat.isGroup ? isOnline : undefined}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-[15px] truncate">
                        {displayName}
                      </h3>
                      {lastMessage && (
                        <span
                          className={cn(
                            "text-xs flex-shrink-0 ml-2",
                            chat.unreadCount > 0
                              ? "text-wa-accent font-medium"
                              : "text-gray-400 dark:text-gray-500",
                          )}
                        >
                          {formatTime(lastMessage.createdAt)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-0.5">
                      <p
                        className={cn(
                          "text-sm truncate pr-2",
                          isTyping
                            ? "text-wa-accent italic"
                            : "text-gray-500 dark:text-gray-400",
                        )}
                      >
                        {isTyping ? (
                          t.typing
                        ) : lastMessage ? (
                          <>
                            {lastMessage.sender?.id === user!.id && (
                              <span className="text-wa-blue mr-1">
                                {lastMessage.readBy?.length > 1 ? "✓✓" : "✓"}
                              </span>
                            )}
                            {lastMessage.isDeleted
                              ? t.deleted
                              : lastMessage.type !== "text"
                                ? `📎 ${lastMessage.type === "image" ? t.photo : lastMessage.type === "video" ? t.video : t.document}`
                                : truncate(lastMessage.content || "", 35)}
                          </>
                        ) : (
                          <span className="text-gray-400">
                            {t.startChatting}
                          </span>
                        )}
                      </p>

                      {chat.unreadCount > 0 && (
                        <span className="bg-wa-accent text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/new-chat")}
        className="fixed bottom-20 right-5 w-14 h-14 bg-wa-accent rounded-full shadow-lg shadow-wa-accent/30 flex items-center justify-center z-30 hover:shadow-xl transition-shadow"
      >
        <MessageSquarePlus className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
}
