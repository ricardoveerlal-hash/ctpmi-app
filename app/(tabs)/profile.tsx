import { useRouter } from "expo-router";
import { Alert, Linking, Switch, View } from "react-native";

import { AppText, Button, Card, ErrorBlock, LoadingBlock, Screen, useAsync } from "@/components/ui";
import { api } from "@/lib/api";
import { MONTHS } from "@/lib/constants";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", minHeight: 40, alignItems: "center", gap: 12 }}>
      <AppText color="muted">{label}</AppText>
      <AppText variant="bodyStrong" style={{ flexShrink: 1, textAlign: "right" }}>{value}</AppText>
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const { theme, isDark, toggle } = useTheme();
  const { session, clearSession } = useSession();
  const waId = session?.waId ?? "";
  const profile = useAsync(() => api.getProfile(waId), [waId]);
  const p = profile.data;

  const name = p?.fullName || session?.fullName || session?.firstName || "Member";
  const birthday = p?.birthDay && p?.birthMonth ? `${p.birthDay} ${MONTHS[p.birthMonth - 1]}` : null;

  async function signOut() {
    await clearSession();
    router.replace("/");
  }

  function deleteAccount() {
    Alert.alert(
      "Delete account",
      "In-app deletion arrives with the new API. For now, send a deletion request to the church office on WhatsApp and we will remove your data.",
      [
        { text: "Open WhatsApp", onPress: () => Linking.openURL("https://wa.me/27834834334") },
        { text: "Cancel", style: "cancel" },
      ]
    );
  }

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginRight: 52 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.teal, alignItems: "center", justifyContent: "center" }}>
          <AppText variant="title" color="onAccent">{name.charAt(0).toUpperCase()}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="h2" numberOfLines={1}>{name}</AppText>
          <AppText color="muted" numberOfLines={1}>{p?.zone || session?.zone || "Zone not set"}</AppText>
        </View>
      </View>

      {profile.loading && <LoadingBlock label="Loading your profile" />}
      {profile.error && <ErrorBlock message="Couldn't load your profile." onRetry={profile.reload} />}

      {p?.found && (
        <Card>
          <Row label="Cell number" value={p.cellNumber ? "0" + p.cellNumber.replace(/^27/, "") : null} />
          <Row label="Email" value={p.email} />
          <Row label="Birthday" value={birthday} />
          <Row label="CTPMI member" value={p.isCtpmiMember === undefined ? null : p.isCtpmiMember ? "Yes" : "No"} />
        </Card>
      )}

      <Card style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <AppText variant="bodyStrong">Light mode</AppText>
        <Switch
          accessibilityLabel="Light mode"
          value={!isDark}
          onValueChange={toggle}
          trackColor={{ true: theme.teal, false: theme.line }}
          thumbColor="#ffffff"
        />
      </Card>

      <Button label="Give" kind="gold" onPress={() => router.push("/(tabs)/give")} />
      <Button label="Sign out" kind="ghost" onPress={signOut} />
      <Button label="Delete account" kind="danger" onPress={deleteAccount} />
    </Screen>
  );
}
