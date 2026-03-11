import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../lib/api";
import { COLORS, STATUS_COLORS } from "../../lib/constants";
import { id as t } from "../../lib/i18n";

export default function StatusScreen() {
  const { token, user } = useAuthStore();
  const [myStatuses, setMyStatuses] = useState<any>(null);
  const [otherStatuses, setOtherStatuses] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [bgColor, setBgColor] = useState(STATUS_COLORS[0]);

  const fetchStatuses = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getStatuses(token);
      setMyStatuses(data.myStatuses);
      setOtherStatuses(data.otherStatuses || []);
    } catch (err) {
      console.error("Fetch statuses error:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatuses();
    setRefreshing(false);
  };

  const handleCreateStatus = async () => {
    if (!statusText.trim() || !token) return;
    try {
      await api.createStatus(token, {
        content: statusText,
        backgroundColor: bgColor,
        type: "text",
      });
      setStatusText("");
      setShowCreator(false);
      fetchStatuses();
    } catch (err) {
      console.error("Create status error:", err);
    }
  };

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <View style={styles.container}>
      {/* My status */}
      <TouchableOpacity
        style={styles.myStatus}
        onPress={() => setShowCreator(true)}
      >
        <View style={styles.myStatusAvatar}>
          <Text style={{ fontSize: 32 }}>👤</Text>
          <View style={styles.addBadge}>
            <Text style={{ fontSize: 14, color: "#fff" }}>+</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.myStatusName}>{t.myStatus}</Text>
          <Text style={styles.myStatusHint}>{t.addStatus}</Text>
        </View>
      </TouchableOpacity>

      {/* Recent updates */}
      {otherStatuses.length > 0 && (
        <Text style={styles.sectionTitle}>{t.recentUpdates}</Text>
      )}
      <FlatList
        data={otherStatuses}
        keyExtractor={(item) => item.user.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.statusItem}>
            <View style={[styles.statusRing, { borderColor: COLORS.accent }]}>
              <Text style={{ fontSize: 28 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusName}>{item.user.name}</Text>
              <Text style={styles.statusTime}>
                {item.statuses?.[0]
                  ? formatTime(item.statuses[0].createdAt)
                  : ""}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t.noStatus}</Text>
          </View>
        }
      />

      {/* Creator Modal */}
      <Modal visible={showCreator} animationType="slide" transparent={false}>
        <View style={[styles.creatorContainer, { backgroundColor: bgColor }]}>
          <View style={styles.creatorHeader}>
            <TouchableOpacity onPress={() => setShowCreator(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreateStatus}>
              <Text style={styles.sendBtn}>Kirim</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.creatorInput}
            value={statusText}
            onChangeText={setStatusText}
            placeholder={t.statusPlaceholder}
            placeholderTextColor="rgba(255,255,255,0.5)"
            multiline
            autoFocus
          />
          <View style={styles.colorPicker}>
            {STATUS_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorDot,
                  { backgroundColor: color },
                  bgColor === color && styles.colorDotActive,
                ]}
                onPress={() => setBgColor(color)}
              />
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  myStatus: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.separatorDark,
  },
  myStatusAvatar: { position: "relative", marginRight: 12 },
  addBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  myStatusName: { fontSize: 16, fontWeight: "600", color: "#fff" },
  myStatusHint: { fontSize: 13, color: COLORS.grey, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.grey,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statusRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statusName: { fontSize: 16, fontWeight: "500", color: "#fff" },
  statusTime: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  empty: { padding: 48, alignItems: "center" },
  emptyText: { fontSize: 15, color: COLORS.grey },
  creatorContainer: { flex: 1, justifyContent: "center", padding: 24 },
  creatorHeader: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 1,
  },
  closeBtn: { fontSize: 22, color: "#fff", fontWeight: "700" },
  sendBtn: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  creatorInput: {
    fontSize: 24,
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  colorPicker: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  colorDot: { width: 32, height: 32, borderRadius: 16, marginHorizontal: 4 },
  colorDotActive: { borderWidth: 3, borderColor: "#fff" },
});
