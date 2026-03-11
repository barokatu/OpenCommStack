import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import { useSocket, getSocket } from "../../hooks/useSocket";
import { api } from "../../lib/api";
import { COLORS, EMOJI_REACTIONS } from "../../lib/constants";
import { id as t } from "../../lib/i18n";

export default function ChatDetailScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token, user, serverUrl } = useAuthStore();
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

  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchChat = useCallback(async () => {
    if (!token || !chatId) return;
    try {
      const data = await api.getChat(token, chatId);
      setChat(data.chat);
    } catch (err) {
      console.error(err);
    }
  }, [token, chatId]);

  const fetchMessages = useCallback(async () => {
    if (!token || !chatId) return;
    try {
      const data = await api.getMessages(token, chatId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
    }
  }, [token, chatId]);

  useEffect(() => {
    fetchChat();
    fetchMessages();
  }, [fetchChat, fetchMessages]);
  useEffect(() => {
    if (chatId) joinChat(chatId);
  }, [chatId, joinChat]);

  // Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNew = (msg: any) => {
      if (msg.chatId === chatId) {
        fetchMessages();
        if (msg.senderId !== user?.id) markRead(chatId, [msg.id]);
      }
    };
    const onEdit = (data: any) => {
      if (data.chatId === chatId) fetchMessages();
    };
    const onDel = (data: any) => {
      if (data.chatId === chatId) fetchMessages();
    };
    const onReact = (data: any) => {
      if (data.chatId === chatId) fetchMessages();
    };
    socket.on("message:new", onNew);
    socket.on("message:edited", onEdit);
    socket.on("message:deleted", onDel);
    socket.on("message:reaction", onReact);
    return () => {
      socket.off("message:new", onNew);
      socket.off("message:edited", onEdit);
      socket.off("message:deleted", onDel);
      socket.off("message:reaction", onReact);
    };
  }, [chatId, fetchMessages, markRead, user?.id]);

  // Poll
  useEffect(() => {
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Mark unread
  useEffect(() => {
    if (messages.length > 0) {
      const unread = messages
        .filter(
          (m: any) => m.senderId !== user?.id && !m.readBy?.includes(user?.id),
        )
        .map((m: any) => m.id);
      if (unread.length > 0) markRead(chatId, unread);
    }
  }, [messages, user?.id, chatId, markRead]);

  const getOtherUser = () =>
    chat?.members?.find((m: any) => m.userId !== user?.id)?.user;
  const otherUser = getOtherUser();
  const isOnline = otherUser
    ? (onlineUsers[otherUser.id] ?? otherUser.isOnline)
    : false;
  const isTyping = typingUsers[chatId]?.length > 0;

  const handleTyping = () => {
    sendTyping(chatId, true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendTyping(chatId, false), 2000);
  };

  const handleSend = async () => {
    if (!messageText.trim()) return;
    if (editingMessage) {
      editMessage(editingMessage.id, chatId, messageText);
      setEditingMessage(null);
      setMessageText("");
      return;
    }
    try {
      await sendMessage({
        chatId,
        content: messageText,
        type: "text",
        replyToId: replyTo?.id,
      });
      setMessageText("");
      setReplyTo(null);
      sendTyping(chatId, false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLongPress = (msg: any) => {
    const isMine = msg.senderId === user?.id;
    const buttons: any[] = [
      { text: t.reply, onPress: () => setReplyTo(msg) },
      { text: t.react, onPress: () => setShowReactions(msg.id) },
    ];
    if (isMine && !msg.isDeleted) {
      buttons.push({
        text: t.edit,
        onPress: () => {
          setEditingMessage(msg);
          setMessageText(msg.content || "");
        },
      });
      buttons.push({
        text: t.delete,
        style: "destructive",
        onPress: () => deleteMessage(msg.id, chatId),
      });
    }
    buttons.push({ text: "Batal", style: "cancel" });
    Alert.alert("Pesan", undefined, buttons);
  };

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const renderMessage = ({ item: msg }: { item: any }) => {
    const isMine = msg.senderId === user?.id;
    return (
      <View
        style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowOther]}
      >
        <TouchableOpacity
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleOther,
          ]}
          onLongPress={() => handleLongPress(msg)}
          activeOpacity={0.8}
        >
          {/* Sender name in group */}
          {chat?.isGroup && !isMine && (
            <Text style={styles.senderName}>{msg.sender?.name}</Text>
          )}

          {/* Reply preview */}
          {msg.replyTo && (
            <View style={styles.replyPreview}>
              <Text style={styles.replyName}>{msg.replyTo.sender?.name}</Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {msg.replyTo.content}
              </Text>
            </View>
          )}

          {/* Media */}
          {msg.mediaUrl && msg.type === "image" && (
            <Text style={styles.mediaPlaceholder}>📷 {t.photo}</Text>
          )}
          {msg.mediaUrl && msg.type === "video" && (
            <Text style={styles.mediaPlaceholder}>📹 {t.video}</Text>
          )}
          {msg.mediaUrl && msg.type === "document" && (
            <Text style={styles.mediaPlaceholder}>
              📄 {msg.fileName || t.document}
            </Text>
          )}

          {/* Content */}
          {msg.isDeleted ? (
            <Text style={styles.deletedText}>🚫 {t.deleted}</Text>
          ) : (
            msg.content && (
              <Text
                style={[
                  styles.msgText,
                  isMine ? styles.msgTextMine : styles.msgTextOther,
                ]}
              >
                {msg.content}
              </Text>
            )
          )}

          {/* Reactions */}
          {msg.reactions?.length > 0 && (
            <View style={styles.reactions}>
              {msg.reactions.map((r: any) => (
                <Text key={r.id} style={styles.reaction}>
                  {r.emoji}
                </Text>
              ))}
            </View>
          )}

          {/* Time + status */}
          <View style={styles.metaRow}>
            {msg.isEdited && <Text style={styles.editedLabel}>{t.edited}</Text>}
            <Text style={styles.timeText}>{formatTime(msg.createdAt)}</Text>
            {isMine && !msg.isDeleted && (
              <Text style={styles.readStatus}>
                {msg.readBy?.length > 1 ? "✓✓" : "✓"}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Reaction picker */}
        {showReactions === msg.id && (
          <View style={styles.reactionPicker}>
            {EMOJI_REACTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => {
                  addReaction(msg.id, chatId, emoji);
                  setShowReactions(null);
                }}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerAvatar}>👤</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName} numberOfLines={1}>
            {chat ? (chat.isGroup ? chat.name : otherUser?.name) : "..."}
          </Text>
          <Text style={styles.headerStatus}>
            {isTyping ? t.typing : isOnline ? t.online : ""}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      {/* Typing indicator */}
      {isTyping && (
        <View style={styles.typingBar}>
          <Text style={styles.typingText}>⋯ {t.typing}</Text>
        </View>
      )}

      {/* Reply/Edit banner */}
      {(replyTo || editingMessage) && (
        <View style={styles.replyBanner}>
          <View style={styles.replyBannerBar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.replyBannerTitle}>
              {editingMessage ? t.edit : replyTo?.sender?.name}
            </Text>
            <Text style={styles.replyBannerText} numberOfLines={1}>
              {editingMessage?.content || replyTo?.content}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setReplyTo(null);
              setEditingMessage(null);
              setMessageText("");
            }}
          >
            <Text style={styles.closeBannerBtn}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Composer */}
      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          value={messageText}
          onChangeText={(text) => {
            setMessageText(text);
            handleTyping();
          }}
          placeholder={t.typeMessage}
          placeholderTextColor={COLORS.grey}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, messageText.trim() && styles.sendBtnActive]}
          onPress={handleSend}
          disabled={!messageText.trim()}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 22, color: "#fff" },
  headerAvatar: { fontSize: 32, marginHorizontal: 8 },
  headerName: { fontSize: 17, fontWeight: "700", color: "#fff" },
  headerStatus: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 1 },
  messagesList: { padding: 8, paddingBottom: 4 },
  msgRow: { marginBottom: 4 },
  msgRowMine: { alignItems: "flex-end" },
  msgRowOther: { alignItems: "flex-start" },
  bubble: {
    maxWidth: "78%",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    elevation: 1,
  },
  bubbleMine: {
    backgroundColor: COLORS.outgoingDark,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: COLORS.darkSurface,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.accent,
    marginBottom: 2,
  },
  replyPreview: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    padding: 6,
    marginBottom: 4,
  },
  replyName: { fontSize: 11, fontWeight: "600", color: COLORS.accent },
  replyText: { fontSize: 12, color: COLORS.grey },
  mediaPlaceholder: { fontSize: 14, color: COLORS.blue, marginBottom: 2 },
  msgText: { fontSize: 15, lineHeight: 20 },
  msgTextMine: { color: "#E9EDEF" },
  msgTextOther: { color: "#E9EDEF" },
  deletedText: { fontSize: 14, fontStyle: "italic", color: COLORS.grey },
  reactions: { flexDirection: "row", flexWrap: "wrap", marginTop: 2, gap: 2 },
  reaction: {
    fontSize: 14,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 8,
    paddingHorizontal: 4,
    overflow: "hidden",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 2,
    gap: 4,
  },
  editedLabel: { fontSize: 10, fontStyle: "italic", color: COLORS.grey },
  timeText: { fontSize: 10, color: COLORS.grey },
  readStatus: { fontSize: 11, color: COLORS.blue },
  reactionPicker: {
    flexDirection: "row",
    backgroundColor: COLORS.darkSurface,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 4,
    gap: 6,
    alignSelf: "center",
  },
  reactionEmoji: { fontSize: 22 },
  typingBar: { paddingHorizontal: 16, paddingVertical: 4 },
  typingText: { fontSize: 13, color: COLORS.accent },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.darkSurface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  replyBannerBar: {
    width: 3,
    height: "100%",
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  replyBannerTitle: { fontSize: 12, fontWeight: "600", color: COLORS.accent },
  replyBannerText: { fontSize: 12, color: COLORS.grey },
  closeBannerBtn: { fontSize: 16, color: COLORS.grey, padding: 4 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    gap: 8,
    backgroundColor: COLORS.darkSurface,
  },
  composerInput: {
    flex: 1,
    backgroundColor: COLORS.darkInput,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#fff",
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.grey,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnActive: { backgroundColor: COLORS.accent },
  sendIcon: { fontSize: 18, color: "#fff" },
});
