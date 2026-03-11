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

export default function LoginScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const handleSubmit = async () => {
    if (!phone || !pin) {
      Alert.alert("Error", "Nomor telepon dan PIN wajib diisi");
      return;
    }
    if (pin.length < 6) {
      Alert.alert("Error", "PIN minimal 6 digit");
      return;
    }
    if (mode === "register" && !name) {
      Alert.alert("Error", "Nama wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const result =
        mode === "register"
          ? await api.register({ phone, pin, name })
          : await api.login({ phone, pin });
      setAuth(result.token, result.user);
      router.replace("/(tabs)/chats");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Gagal masuk");
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
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, mode === "login" && styles.tabActive]}
          onPress={() => setMode("login")}
        >
          <Text
            style={[styles.tabText, mode === "login" && styles.tabTextActive]}
          >
            {t.login}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === "register" && styles.tabActive]}
          onPress={() => setMode("register")}
        >
          <Text
            style={[
              styles.tabText,
              mode === "register" && styles.tabTextActive,
            ]}
          >
            {t.register}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        {mode === "register" && (
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t.enterName}
            placeholderTextColor={COLORS.grey}
          />
        )}
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder={t.enterPhone}
          placeholderTextColor={COLORS.grey}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          placeholder={t.enterPin}
          placeholderTextColor={COLORS.grey}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={6}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t.submit}</Text>
          )}
        </TouchableOpacity>
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
  header: { alignItems: "center", marginBottom: 32 },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.accent },
  tabs: {
    flexDirection: "row",
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: COLORS.darkSurface,
    overflow: "hidden",
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { backgroundColor: COLORS.accent },
  tabText: { fontSize: 15, fontWeight: "600", color: COLORS.grey },
  tabTextActive: { color: "#fff" },
  form: {},
  input: {
    backgroundColor: COLORS.darkInput,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.separatorDark,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
