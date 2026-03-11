import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import { api } from "../../lib/api";
import { COLORS } from "../../lib/constants";
import { id as t } from "../../lib/i18n";
import { getSocket } from "../../hooks/useSocket";

export default function ChatsScreen() {
  const { token, user } = useAuthStore();
  const { typingUsers, onlineUsers } = useChatStore();
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getChats(token);
      setChats(data.chats || []);
    } catch (err) {
      console.error("Fetch chats error:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Poll for new chats + refresh on socket events
  useEffect(() => {
    const interval = setInterval(fetchChats, 5000);
    const socket = getSocket();
    if (socket) {
      socket.on("message:new", fetchChats);
      return () => {
        clearInterval(interval);
        socket.off("message:new", fetchChats);
      };
    }
    return () => clearInterval(interval);
  }, [fetchChats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  };

  const getOtherUser = (members: any[]) =>
    members?.find((m: any) => m.userId !== user?.id)?.user;
  const getChatName = (chat: any) =>
    chat.isGroup ? chat.name : getOtherUser(chat.members)?.name || "?";
  const getChatAvatar = (chat: any) => (chat.isGroup ? "👥" : "👤");
  const getLastMsg = (chat: any) => {
    const msg = chat.messages?.[0];
    if (!msg) return "";
    if (msg.isDeleted) return "🚫 " + t.deleted;
    if (msg.type === "image") return "📷 " + t.photo;
    if (msg.type === "video") return "📹 " + t.video;
    if (msg.type === "document") return "📄 " + t.document;
    return msg.content || "";
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUnreadCount = (chat: any) => {
    return (
      chat.messages?.filter(
        (m: any) => m.senderId !== user?.id && !m.readBy?.includes(user?.id),
      ).length || 0
    );
  };

  const filtered = chats.filter((c) => {
    if (!search) return true;
    return getChatName(c).toLowerCase().includes(search.toLowerCase());
  });

  const renderChat = ({ item: chat }: { item: any }) => {
    const isTyping = typingUsers[chat.id]?.length > 0;
    const otherUser = getOtherUser(chat.members);
    const isOnline = otherUser
      ? (onlineUsers[otherUser.id] ?? otherUser.isOnline)
      : false;
    const unread = getUnreadCount(chat);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push(`/chat/${chat.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{getChatAvatar(chat)}</Text>
          {isOnline && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {getChatName(chat)}
            </Text>
            <Text
              style={[styles.chatTime, unread > 0 && { color: COLORS.accent }]}
            >
              {chat.messages?.[0] ? formatTime(chat.messages[0].createdAt) : ""}
            </Text>
          </View>
          <View style={styles.chatFooter}>
            <Text
              style={[styles.lastMessage, isTyping && { color: COLORS.accent }]}
              numberOfLines={1}
            >
              {isTyping ? t.typing : getLastMsg(chat)}
            </Text>
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder={t.searchChat}
          placeholderTextColor={COLORS.grey}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        renderItem={renderChat}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
        contentContainerStyle={
          filtered.length === 0 ? styles.emptyContainer : undefined
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>{t.noChats}</Text>
            <Text style={styles.emptySubtext}>{t.startChatting}</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/new-chat")}
      >
        <Text style={styles.fabIcon}>✏️</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  searchBar: { padding: 8, backgroundColor: COLORS.darkSurface },
  searchInput: {
    backgroundColor: COLORS.darkInput,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#fff",
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.separatorDark,
  },
  avatarContainer: { position: "relative", marginRight: 12 },
  avatar: { fontSize: 36 },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  chatContent: { flex: 1 },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    marginRight: 8,
  },
  chatTime: { fontSize: 12, color: COLORS.grey },
  chatFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: { fontSize: 14, color: COLORS.grey, flex: 1, marginRight: 8 },
  badge: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  emptyContainer: { flex: 1 },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: "600", color: COLORS.grey },
  emptySubtext: { fontSize: 14, color: COLORS.grey, marginTop: 8 },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: { fontSize: 24 },
});
