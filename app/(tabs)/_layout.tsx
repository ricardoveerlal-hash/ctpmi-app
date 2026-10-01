import { Redirect, Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { SymbolView } from "expo-symbols";

import { fonts, useTheme } from "@/lib/theme";
import { useSession } from "@/lib/session";

type IconName = { ios: string; android: string; web: string };

function icon(name: IconName) {
  // eslint-disable-next-line react/display-name
  return ({ color }: { color: ColorValue }) => (
    <SymbolView name={name as never} tintColor={color} size={26} />
  );
}

export default function TabLayout() {
  const { theme } = useTheme();
  const { session, loading } = useSession();

  if (loading) return null;
  if (!session) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.goldText,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: { backgroundColor: theme.tabBar, borderTopColor: theme.line },
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 12 },
        sceneStyle: { backgroundColor: theme.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today", tabBarIcon: icon({ ios: "house.fill", android: "home", web: "home" }) }} />
      <Tabs.Screen name="quiz" options={{ title: "Quiz", tabBarIcon: icon({ ios: "questionmark.circle.fill", android: "quiz", web: "quiz" }) }} />
      <Tabs.Screen name="ranks" options={{ title: "Ranks", tabBarIcon: icon({ ios: "chart.bar.fill", android: "leaderboard", web: "leaderboard" }) }} />
      <Tabs.Screen name="help" options={{ title: "Help", tabBarIcon: icon({ ios: "bubble.left.fill", android: "chat", web: "chat" }) }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon({ ios: "person.fill", android: "person", web: "person" }) }} />
    </Tabs>
  );
}
