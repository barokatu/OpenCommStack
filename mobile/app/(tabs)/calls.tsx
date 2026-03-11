import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../lib/api";
import { getSocket } from "../../hooks/useSocket";
import { COLORS } from "../../lib/constants";
import { id as t } from "../../lib/i18n";

export default function CallsScreen() {
  const { token, user } = useAuthStore();
  const [calls, setCalls] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCalls = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getCalls(token);
      setCalls(data.calls || []);
    } catch (err) {
      console.error("Fetch calls error:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on("call:ended", fetchCalls);
    socket.on("call:rejected", fetchCalls);
    return () => {
      socket.off("call:ended", fetchCalls);
      socket.off("call:rejected", fetchCalls);
    };
  }, [fetchCalls]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCalls();
    setRefreshing(false);
  };

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getCallIcon = (call: any) => {
    if (call.status === "missed" || call.status === "rejected") return "❌";
    if (call.isInitiator) return "📤";
    return "📲";
  };

  const getStatusText = (call: any) => {
    if (call.status === "missed") return "Tidak Terjawab";
    if (call.status === "rejected") return "Ditolak";
    if (call.duration > 0) {
      const m = Math.floor(call.duration / 60);
      const s = call.duration % 60;
      return m > 0 ? `${m} mnt ${s} dtk` : `${s} dtk`;
    }
    return call.isInitiator ? "Keluar" : "Masuk";
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={calls}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
        contentContainerStyle={calls.length === 0 ? { flex: 1 } : undefined}
        renderItem={({ item: call }) => (
          <View style={styles.callItem}>
            <Text style={styles.avatar}>👤</Text>
            <View style={styles.callInfo}>
              <Text
                style={[
                  styles.callName,
                  (call.status === "missed" || call.status === "rejected") && {
                    color: "#EF4444",
                  },
                ]}
              >
                {call.otherUser?.name || "Pengguna"}
              </Text>
              <View style={styles.callMeta}>
                <Text style={styles.callIcon}>{getCallIcon(call)}</Text>
                <Text style={styles.callTime}>
                  {formatTime(call.createdAt)} • {getStatusText(call)}
                </Text>
              </View>
            </View>
            <Text style={styles.callType}>
              {call.type === "video" ? "📹" : "📞"}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📞</Text>
            <Text style={styles.emptyText}>{t.noCalls}</Text>
            <Text style={styles.emptySubtext}>
              Gunakan tombol panggilan di halaman obrolan
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  callItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.separatorDark,
  },
  avatar: { fontSize: 36, marginRight: 12 },
  callInfo: { flex: 1 },
  callName: { fontSize: 16, fontWeight: "600", color: "#fff" },
  callMeta: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  callIcon: { fontSize: 12, marginRight: 4 },
  callTime: { fontSize: 13, color: COLORS.grey },
  callType: { fontSize: 22 },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: "600", color: COLORS.grey },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 8,
    textAlign: "center",
  },
});
