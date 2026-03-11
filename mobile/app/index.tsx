import { Redirect } from "expo-router";
import { useAuthStore } from "../store/authStore";

export default function IndexPage() {
  const { isAuthenticated, serverUrl } = useAuthStore();

  if (!serverUrl) return <Redirect href="/(auth)/server" />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(tabs)/chats" />;
}
