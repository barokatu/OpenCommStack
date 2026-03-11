import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../lib/api";
import { COLORS } from "../../lib/constants";
import { id as t } from "../../lib/i18n";

export default function NewChatScreen() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"chat" | "group">("chat");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const data = search
        ? await api.searchUsers(token, search)
        : await api.getUsers(token);
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    }
  }, [token, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDirectChat = async (userId: string) => {
    if (!token) return;
    try {
      const data = await api.createDirectChat(token, userId);
      router.replace(`/chat/${data.chat.id}`);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0 || !token) {
      Alert.alert("Error", "Nama grup dan minimal 1 anggota diperlukan");
      return;
    }
    try {
      const data = await api.createGroup(token, {
        name: groupName,
        memberIds: selectedMembers,
      });
      router.replace(`/chat/${data.chat.id}`);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === "group" ? t.newGroup : t.newChat}
        </Text>
      </View>

      {/* Mode tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, mode === "chat" && styles.tabActive]}
          onPress={() => setMode("chat")}
        >
          <Text
            style={[styles.tabText, mode === "chat" && styles.tabTextActive]}
          >
            {t.newChat}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === "group" && styles.tabActive]}
          onPress={() => setMode("group")}
        >
          <Text
            style={[styles.tabText, mode === "group" && styles.tabTextActive]}
          >
            {t.newGroup}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Group name */}
      {mode === "group" && (
        <>
          <TextInput
            style={styles.groupInput}
            value={groupName}
            onChangeText={setGroupName}
            placeholder={t.groupName}
            placeholderTextColor={COLORS.grey}
          />
          {selectedMembers.length > 0 && (
            <TouchableOpacity
              style={styles.createGroupBtn}
              onPress={handleCreateGroup}
            >
              <Text style={styles.createGroupText}>
                {t.createGroup} ({selectedMembers.length})
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Search */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t.search}
          placeholderTextColor={COLORS.grey}
        />
      </View>

      {/* User list */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item: u }) => {
          const isSelected = selectedMembers.includes(u.id);
          return (
            <TouchableOpacity
              style={styles.userItem}
              onPress={() =>
                mode === "chat" ? handleDirectChat(u.id) : toggleMember(u.id)
              }
            >
              <Text style={styles.userAvatar}>👤</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{u.name}</Text>
                <Text style={styles.userPhone}>{u.phone}</Text>
              </View>
              {mode === "group" && (
                <View
                  style={[styles.checkbox, isSelected && styles.checkboxActive]}
                >
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 8,
  },
  tabs: {
    flexDirection: "row",
    margin: 12,
    borderRadius: 10,
    backgroundColor: COLORS.darkSurface,
    overflow: "hidden",
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { fontSize: 14, fontWeight: "600", color: COLORS.grey },
  tabTextActive: { color: "#fff" },
  groupInput: {
    backgroundColor: COLORS.darkInput,
    marginHorizontal: 12,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#fff",
    borderWidth: 1,
    borderColor: COLORS.separatorDark,
  },
  createGroupBtn: {
    backgroundColor: COLORS.accent,
    margin: 12,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  createGroupText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  searchBar: { padding: 12, paddingTop: 8 },
  searchInput: {
    backgroundColor: COLORS.darkInput,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#fff",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.separatorDark,
  },
  userAvatar: { fontSize: 32, marginRight: 12 },
  userName: { fontSize: 16, fontWeight: "500", color: "#fff" },
  userPhone: { fontSize: 13, color: COLORS.grey, marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.grey,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  checkmark: { fontSize: 14, color: "#fff", fontWeight: "700" },
});
