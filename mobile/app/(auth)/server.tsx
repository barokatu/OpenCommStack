import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../lib/api";
import { COLORS } from "../../lib/constants";
import { id as t } from "../../lib/i18n";

export default function ServerScreen() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setServerUrl } = useAuthStore();

  const handleConnect = async () => {
    const trimmed = url.trim().replace(/\/$/, "");
    if (!trimmed) {
      Alert.alert("Error", t.serverRequired);
      return;
    }

    setLoading(true);
    try {
      // Temporarily set the URL so the health check can use it
      const ok = await api.checkServer(trimmed);
      if (ok) {
        setServerUrl(trimmed);
        router.replace("/(auth)/login");
      } else {
        Alert.alert("Error", t.connectionFailed);
      }
    } catch {
      Alert.alert(
        "Error",
        t.connectionFailed +
          "\n\nPastikan server berjalan dan alamat sudah benar.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>💬</Text>
        <Text style={styles.title}>{t.appName}</Text>
        <Text style={styles.subtitle}>Open Communication Stack</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>{t.serverUrl}</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder={t.enterServerUrl}
          placeholderTextColor={COLORS.grey}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleConnect}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t.connect}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Masukkan alamat server OpenCommStack yang berjalan di jaringan lokal Anda.
          {"\n\n"}Contoh: http://192.168.1.2:3001
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
    justifyContent: "center",
    padding: 24,
  },
  header: { alignItems: "center", marginBottom: 48 },
  logo: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: "800", color: COLORS.accent },
  subtitle: { fontSize: 14, color: COLORS.grey, marginTop: 4 },
  form: {},
  label: { fontSize: 14, fontWeight: "600", color: "#fff", marginBottom: 8 },
  input: {
    backgroundColor: COLORS.darkInput,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.separatorDark,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  hint: {
    marginTop: 24,
    fontSize: 13,
    color: COLORS.grey,
    textAlign: "center",
    lineHeight: 20,
  },
});
