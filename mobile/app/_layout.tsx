import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../store/authStore";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Small delay to allow zustand to rehydrate from AsyncStorage
    const timer = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="light" backgroundColor="#075E54" />
      <Stack
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="new-chat" />
      </Stack>
    </>
  );
}
