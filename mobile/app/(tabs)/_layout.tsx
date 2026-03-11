import { Tabs, Redirect } from "expo-router";
import { Text, View } from "react-native";
import { useAuthStore } from "../../store/authStore";
import { useSocket } from "../../hooks/useSocket";
import { COLORS } from "../../lib/constants";
import { id as t } from "../../lib/i18n";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    chats: "💬",
    status: "⭕",
    calls: "📞",
    settings: "⚙️",
  };
  return (
    <Text style={{ fontSize: focused ? 24 : 22, opacity: focused ? 1 : 0.6 }}>
      {icons[name] || "•"}
    </Text>
  );
}

export default function TabsLayout() {
  const { isAuthenticated, serverUrl } = useAuthStore();
  useSocket();

  if (!serverUrl) return <Redirect href="/(auth)/server" />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
        tabBarStyle: {
          backgroundColor: COLORS.dark,
          borderTopColor: COLORS.separatorDark,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.grey,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: t.chats,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="chats" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="status"
        options={{
          title: t.status,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="status" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          title: t.calls,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="calls" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.settings,
          tabBarIcon: ({ focused }) => (
            <TabIcon name="settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
