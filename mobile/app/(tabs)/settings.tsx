import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../lib/api";
import { COLORS } from "../../lib/constants";
import { id as t } from "../../lib/i18n";

export default function SettingsScreen() {
  const { token, user, serverUrl, updateUser, logout, setServerUrl } =
    useAuthStore();
  const router = useRouter();
  const [name, setName] = useState(user?.name || "");
  const [about, setAbout] = useState(user?.about || "");
  const [editing, setEditing] = useState(false);

  const handleSave = async () => {
    if (!token) return;
    try {
      const result = await api.updateProfile(token, { name, about });
      updateUser(result.user);
      setEditing(false);
      Alert.alert("✅", "Profil berhasil diperbarui");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleLogout = () => {
    Alert.alert(t.logout, "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: t.logout,
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleChangeServer = () => {
    Alert.alert(
      "Ganti Server",
      "Anda akan keluar dan diminta memasukkan alamat server baru.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ganti",
          onPress: () => {
            logout();
            setServerUrl("");
            router.replace("/(auth)/server");
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile */}
      <View style={styles.profileSection}>
        <Text style={styles.profileAvatar}>👤</Text>
        <View style={{ flex: 1 }}>
          {editing ? (
            <>
              <TextInput
                style={styles.editInput}
                value={name}
                onChangeText={setName}
                placeholder={t.name}
                placeholderTextColor={COLORS.grey}
              />
              <TextInput
                style={[styles.editInput, { marginTop: 8 }]}
                value={about}
                onChangeText={setAbout}
                placeholder={t.about}
                placeholderTextColor={COLORS.grey}
              />
            </>
          ) : (
            <>
              <Text style={styles.profileName}>{user?.name || "?"}</Text>
              <Text style={styles.profileAbout}>{user?.about || ""}</Text>
              <Text style={styles.profilePhone}>{user?.phone}</Text>
            </>
          )}
        </View>
      </View>
      {editing ? (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t.save}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditing(true)}
        >
          <Text style={styles.editButtonText}>{t.edit} Profil</Text>
        </TouchableOpacity>
      )}

      {/* Server info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Server</Text>
        <View style={styles.menuItem}>
          <Text style={styles.menuText}>🌐</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>Alamat Server</Text>
            <Text style={styles.menuValue}>{serverUrl}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.menuItem} onPress={handleChangeServer}>
          <Text style={styles.menuText}>🔄</Text>
          <Text style={styles.menuLabel}>Ganti Server</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t.logout}</Text>
      </TouchableOpacity>

      <Text style={styles.version}>OpenCommStack v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  content: { padding: 16 },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.darkSurface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  profileAvatar: { fontSize: 48, marginRight: 16 },
  profileName: { fontSize: 20, fontWeight: "700", color: "#fff" },
  profileAbout: { fontSize: 14, color: COLORS.grey, marginTop: 2 },
  profilePhone: { fontSize: 14, color: COLORS.accent, marginTop: 4 },
  editInput: {
    backgroundColor: COLORS.darkInput,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#fff",
    borderWidth: 1,
    borderColor: COLORS.separatorDark,
  },
  editButton: {
    backgroundColor: COLORS.darkSurface,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  editButtonText: { fontSize: 15, fontWeight: "600", color: COLORS.accent },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  saveButtonText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  section: {
    backgroundColor: COLORS.darkSurface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.grey,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  menuText: { fontSize: 20 },
  menuLabel: { fontSize: 15, color: "#fff" },
  menuValue: { fontSize: 13, color: COLORS.grey, marginTop: 2 },
  logoutButton: {
    backgroundColor: "#3B1A1A",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#EF4444" },
  version: {
    textAlign: "center",
    color: COLORS.grey,
    fontSize: 12,
    marginTop: 24,
    marginBottom: 32,
  },
});
