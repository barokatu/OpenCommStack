"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Send,
  Smile,
  Image as ImageIcon,
  FileText,
  Mic,
  X,
  Reply,
  Pencil,
  Trash2,
  Check,
  CheckCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useSocket, getSocket } from "@/hooks/useSocket";
import { useCall } from "@/components/call/CallProvider";
import { api } from "@/lib/api";
import { API_URL, EMOJI_REACTIONS } from "@/lib/constants";
import { id as t } from "@/lib/i18n";
import {
  cn,
  formatTime,
  formatChatDate,
  getChatDisplayName,
  getChatAvatar,
  getOtherUser,
  formatLastSeen,
} from "@/lib/utils";
import { Avatar } from "@/components/common/Avatar";

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id as string;
  const { token, user } = useAuthStore();
  const { typingUsers, onlineUsers } = useChatStore();
  const {
    sendMessage,
    sendTyping,
    markRead,
    editMessage,
    deleteMessage,
    addReaction,
    joinChat,
  } = useSocket();
  const { initiateCall } = useCall();
  const queryClient = useQueryClient();

  const [messageText, setMessageText] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const { data: chatData } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => api.getChat(token!, chatId),
    enabled: !!token && !!chatId,
  });

  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => api.getMessages(token!, chatId),
    enabled: !!token && !!chatId,
    refetchInterval: 3000,
  });

  const chat = chatData?.chat;
  const messages = messagesData?.messages || [];
  const otherUser =
    chat && !chat.isGroup ? getOtherUser(chat.members, user!.id) : null;
  const isOnline = otherUser
    ? (onlineUsers[otherUser.id] ?? otherUser.isOnline)
    : false;
  const isTyping = typingUsers[chatId]?.length > 0;

  // Join chat room
  useEffect(() => {
    if (chatId) joinChat(chatId);
  }, [chatId, joinChat]);

  // Listen for new messages via socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      if (msg.chatId === chatId) {
        refetchMessages();
        // Mark as read
        if (msg.senderId !== user?.id) {
          markRead(chatId, [msg.id]);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    };

    const handleEdited = (data: any) => {
      if (data.chatId === chatId) refetchMessages();
    };

    const handleDeleted = (data: any) => {
      if (data.chatId === chatId) refetchMessages();
    };

    const handleReaction = (data: any) => {
      if (data.chatId === chatId) refetchMessages();
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:edited", handleEdited);
    socket.on("message:deleted", handleDeleted);
    socket.on("message:reaction", handleReaction);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:edited", handleEdited);
      socket.off("message:deleted", handleDeleted);
      socket.off("message:reaction", handleReaction);
    };
  }, [chatId, refetchMessages, markRead, user?.id, queryClient]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark unread messages
  useEffect(() => {
    if (messages.length > 0) {
      const unreadIds = messages
        .filter(
          (m: any) => m.senderId !== user?.id && !m.readBy?.includes(user?.id),
        )
        .map((m: any) => m.id);
      if (unreadIds.length > 0) markRead(chatId, unreadIds);
    }
  }, [messages, user?.id, chatId, markRead]);

  const handleTyping = useCallback(() => {
    sendTyping(chatId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(chatId, false);
    }, 2000);
  }, [chatId, sendTyping]);

  const handleSend = async () => {
    if (!messageText.trim() && !selectedFile) return;

    if (editingMessage) {
      editMessage(editingMessage.id, chatId, messageText);
      setEditingMessage(null);
      setMessageText("");
      return;
    }

    try {
      let mediaUrl, mediaType, fileName, fileSize;

      if (selectedFile) {
        const upload = await api.uploadFile(token!, selectedFile);
        mediaUrl = upload.url;
        mediaType = upload.mediaType;
        fileName = upload.filename;
        fileSize = upload.size;
      }

      await sendMessage({
        chatId,
        content: messageText || undefined,
        type: selectedFile
          ? selectedFile.type.startsWith("image/")
            ? "image"
            : selectedFile.type.startsWith("video/")
              ? "video"
              : "document"
          : "text",
        mediaUrl,
        mediaType,
        fileName,
        fileSize,
        replyToId: replyTo?.id,
      });

      setMessageText("");
      setReplyTo(null);
      setSelectedFile(null);
      sendTyping(chatId, false);
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const groupMessagesByDate = (msgs: any[]) => {
    const groups: { date: string; messages: any[] }[] = [];
    let currentDate = "";
    for (const msg of msgs) {
      const date = formatChatDate(msg.createdAt);
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  };

  const dateGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-wa-primary dark:bg-wa-headerDark px-2 pt-12 pb-2 flex items-center gap-2 z-10">
        <button
          onClick={() => router.push("/chats")}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div
          className="flex items-center gap-3 flex-1 min-w-0"
          onClick={() => {}}
        >
          <Avatar
            src={chat ? getChatAvatar(chat, user!.id) : null}
            name={chat ? getChatDisplayName(chat, user!.id) : "..."}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-white font-semibold text-[15px] truncate">
              {chat ? getChatDisplayName(chat, user!.id) : "..."}
            </h2>
            <p className="text-white/60 text-xs truncate">
              {isTyping
                ? t.typing
                : isOnline
                  ? t.online
                  : otherUser?.lastSeen
                    ? `${t.lastSeen} ${formatLastSeen(otherUser.lastSeen)}`
                    : chat?.isGroup
                      ? `${chat.members.length} ${t.members}`
                      : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <button
            onClick={() =>
              otherUser &&
              initiateCall(
                [otherUser.id],
                "video",
                otherUser.name,
                otherUser.avatar,
              )
            }
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <Video className="w-5 h-5 text-white/90" />
          </button>
          <button
            onClick={() =>
              otherUser &&
              initiateCall(
                [otherUser.id],
                "voice",
                otherUser.name,
                otherUser.avatar,
              )
            }
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <Phone className="w-5 h-5 text-white/90" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-pattern dark:chat-pattern-dark px-3 py-2">
        {dateGroups.map((group) => (
          <div key={group.date}>
            <div className="flex justify-center my-3">
              <span className="bg-white/90 dark:bg-wa-darkSurface/90 text-gray-500 dark:text-gray-400 text-xs px-3 py-1 rounded-lg shadow-sm">
                {group.date}
              </span>
            </div>

            {group.messages.map((msg: any, idx: number) => {
              const isMine = msg.senderId === user?.id;
              const showAvatar =
                chat?.isGroup &&
                !isMine &&
                (idx === 0 ||
                  group.messages[idx - 1]?.senderId !== msg.senderId);

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "flex mb-1",
                    isMine ? "justify-end" : "justify-start",
                  )}
                >
                  {chat?.isGroup && !isMine && (
                    <div className="w-8 mr-1 flex-shrink-0">
                      {showAvatar && (
                        <Avatar
                          src={msg.sender.avatar}
                          name={msg.sender.name}
                          size="sm"
                        />
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      "relative max-w-[75%] rounded-lg px-3 py-1.5 shadow-sm group",
                      isMine
                        ? "bg-wa-outgoing dark:bg-wa-outgoingDark"
                        : "bg-wa-incoming dark:bg-wa-incomingDark",
                      idx === 0 &&
                        (isMine ? "bubble-tail-out" : "bubble-tail-in"),
                    )}
                  >
                    {/* Sender name in group */}
                    {chat?.isGroup && !isMine && showAvatar && (
                      <p className="text-xs font-semibold text-wa-primary dark:text-wa-accent mb-0.5">
                        {msg.sender.name}
                      </p>
                    )}

                    {/* Reply preview */}
                    {msg.replyTo && (
                      <div className="bg-black/5 dark:bg-black/20 rounded px-2 py-1 mb-1 border-l-2 border-wa-accent">
                        <p className="text-xs font-medium text-wa-primary dark:text-wa-accent">
                          {msg.replyTo.sender.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {msg.replyTo.content}
                        </p>
                      </div>
                    )}

                    {/* Media */}
                    {msg.mediaUrl && msg.type === "image" && (
                      <img
                        src={`${API_URL}${msg.mediaUrl}`}
                        alt="photo"
                        className="rounded-lg mb-1 max-w-full"
                      />
                    )}

                    {msg.mediaUrl && msg.type === "video" && (
                      <video
                        src={`${API_URL}${msg.mediaUrl}`}
                        controls
                        className="rounded-lg mb-1 max-w-full"
                      />
                    )}

                    {msg.mediaUrl && msg.type === "document" && (
                      <a
                        href={`${API_URL}${msg.mediaUrl}`}
                        target="_blank"
                        className="flex items-center gap-2 bg-black/5 dark:bg-black/20 rounded-lg p-2 mb-1"
                      >
                        <FileText className="w-8 h-8 text-wa-primary" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {msg.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {msg.fileSize
                              ? `${(msg.fileSize / 1024).toFixed(0)} KB`
                              : ""}
                          </p>
                        </div>
                      </a>
                    )}

                    {/* Content */}
                    {msg.isDeleted ? (
                      <p className="text-sm italic text-gray-400">
                        🚫 {t.deleted}
                      </p>
                    ) : (
                      msg.content && (
                        <p className="text-[14.5px] text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      )
                    )}

                    {/* Reactions */}
                    {msg.reactions?.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {msg.reactions.map((r: any) => (
                          <span
                            key={r.id}
                            className="text-xs bg-black/5 dark:bg-black/20 rounded-full px-1.5 py-0.5"
                          >
                            {r.emoji}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Time + status */}
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {msg.isEdited && (
                        <span className="text-[10px] text-gray-400 italic">
                          {t.edited}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {formatTime(msg.createdAt)}
                      </span>
                      {isMine && !msg.isDeleted && (
                        <span className="text-wa-blue">
                          {msg.readBy?.length > 1 ? (
                            <CheckCheck className="w-3.5 h-3.5 inline" />
                          ) : (
                            <Check className="w-3.5 h-3.5 inline text-gray-400" />
                          )}
                        </span>
                      )}
                    </div>

                    {/* Context menu (hover) */}
                    <div className="absolute -top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex bg-white dark:bg-wa-darkSurface rounded-lg shadow-md overflow-hidden z-20">
                      <button
                        onClick={() =>
                          setShowEmojiPicker(
                            showEmojiPicker === msg.id ? null : msg.id,
                          )
                        }
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-wa-darkInput"
                        title={t.react}
                      >
                        <Smile className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        onClick={() => {
                          setReplyTo(msg);
                          inputRef.current?.focus();
                        }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-wa-darkInput"
                        title={t.reply}
                      >
                        <Reply className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      {isMine && !msg.isDeleted && (
                        <>
                          <button
                            onClick={() => {
                              setEditingMessage(msg);
                              setMessageText(msg.content || "");
                              inputRef.current?.focus();
                            }}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-wa-darkInput"
                            title={t.edit}
                          >
                            <Pencil className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                          <button
                            onClick={() => deleteMessage(msg.id, chatId)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-wa-darkInput"
                            title={t.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Emoji picker */}
                    {showEmojiPicker === msg.id && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -top-10 right-0 bg-white dark:bg-wa-darkSurface rounded-full shadow-lg px-2 py-1 flex gap-1 z-30"
                      >
                        {EMOJI_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              addReaction(msg.id, chatId, emoji);
                              setShowEmojiPicker(null);
                            }}
                            className="hover:scale-125 transition-transform text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start mb-2">
            <div className="bg-white dark:bg-wa-incomingDark rounded-lg px-4 py-2.5 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply/Edit banner */}
      <AnimatePresence>
        {(replyTo || editingMessage) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-50 dark:bg-wa-darkSurface border-t border-gray-100 dark:border-wa-separatorDark px-4 py-2 flex items-center gap-3"
          >
            <div className="w-1 h-10 bg-wa-accent rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-wa-accent">
                {editingMessage ? t.edit : replyTo?.sender?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {editingMessage?.content || replyTo?.content}
              </p>
            </div>
            <button
              onClick={() => {
                setReplyTo(null);
                setEditingMessage(null);
                setMessageText("");
              }}
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected file preview */}
      {selectedFile && (
        <div className="bg-gray-50 dark:bg-wa-darkSurface border-t border-gray-100 dark:border-wa-separatorDark px-4 py-2 flex items-center gap-3">
          {selectedFile.type.startsWith("image/") ? (
            <img
              src={URL.createObjectURL(selectedFile)}
              className="w-12 h-12 rounded object-cover"
              alt=""
            />
          ) : (
            <FileText className="w-8 h-8 text-wa-primary" />
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300 flex-1 truncate">
            {selectedFile.name}
          </p>
          <button onClick={() => setSelectedFile(null)}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* Composer */}
      <div className="bg-white dark:bg-wa-darkSurface border-t border-gray-100 dark:border-wa-separatorDark px-3 py-2 flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-wa-darkInput transition-colors"
        >
          <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={messageText}
          onChange={(e) => {
            setMessageText(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={t.typeMessage}
          className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-wa-darkInput rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-wa-primary/30"
        />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={!messageText.trim() && !selectedFile}
          className={cn(
            "p-2.5 rounded-full transition-all",
            messageText.trim() || selectedFile
              ? "bg-wa-accent text-white shadow-md shadow-wa-accent/30"
              : "text-gray-400",
          )}
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
