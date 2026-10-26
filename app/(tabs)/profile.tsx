import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Pressable, Switch, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { AppText, Button, Card, ErrorBlock, LoadingBlock, Screen, useAsync } from "@/components/ui";
import { api } from "@/lib/api";
import { pickAndUploadAvatar } from "@/lib/avatar";
import { MONTHS } from "@/lib/constants";
import {
  checkInLocation,
  getLocationPermission,
  requestLocationPermission,
  type LocationPermission,
} from "@/lib/location";
import {
  getPushStatus,
  openSystemSettings,
  registerPushToken,
  requestPushPermission,
  type PushStatus,
} from "@/lib/notifications";
import { getLocationChoice, setLocationChoice } from "@/lib/prefs";
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

// Stored numbers are a mix of "0823795056" and "27823795056"; show 0xx either way.
function displayCell(raw?: string): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("27")) return "0" + digits.slice(2);
  return digits.startsWith("0") ? digits : "0" + digits;
}

export default function Profile() {
  const router = useRouter();
  const { theme, isDark, toggle } = useTheme();
  const { session, clearSession } = useSession();
  const waId = session?.waId ?? "";
  const profile = useAsync(() => api.getProfile(waId), [waId]);
  const p = profile.data;

  // Pick up changes made on the Edit screen when coming back.
  const reloadProfile = profile.reload;
  useFocusEffect(
    useCallback(() => {
      reloadProfile();
    }, [reloadProfile])
  );

  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [push, setPush] = useState<PushStatus>("undetermined");
  const [locPerm, setLocPerm] = useState<LocationPermission>("undetermined");
  const [locChoice, setLocChoice] = useState<"yes" | "no" | null>(null);

  const loadPrefs = useCallback(async () => {
    setPush(await getPushStatus());
    setLocPerm(await getLocationPermission());
    setLocChoice(await getLocationChoice());
  }, []);
  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  const name = p?.fullName || session?.fullName || session?.firstName || "Member";
  const birthday = p?.birthDay && p?.birthMonth ? `${p.birthDay} ${MONTHS[p.birthMonth - 1]}` : null;

  async function signOut() {
    await clearSession();
    router.replace("/");
  }

  async function changePhoto() {
    if (uploading || !waId) return;
    setUploading(true);
    const res = await pickAndUploadAvatar(waId);
    setUploading(false);
    if (res.ok) {
      setLocalAvatar(res.localUri);
      profile.reload();
    } else if (res.reason === "failed") {
      Alert.alert("Couldn't update your photo", "Please check your connection and try again.");
    }
  }

  async function toggleNotifications() {
    if (push === "granted" || push === "denied") {
      // The OS owns this switch once the question has been answered.
      openSystemSettings();
      return;
    }
    const next = await requestPushPermission();
    setPush(next);
    if (next === "granted") await registerPushToken(waId);
  }

  async function toggleLocation(on: boolean) {
    if (!on) {
      await setLocationChoice("no");
      setLocChoice("no");
      return;
    }
    await setLocationChoice("yes");
    setLocChoice("yes");
    let perm = await getLocationPermission();
    if (perm !== "granted") perm = await requestLocationPermission();
    setLocPerm(perm);
    if (perm === "granted") await checkInLocation(waId, { force: true });
    else if (perm === "denied") openSystemSettings();
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change profile picture"
          onPress={changePhoto}
          style={{ opacity: uploading ? 0.6 : 1 }}
        >
          <Avatar uri={localAvatar ?? p?.avatarUrl} name={name} size={72} />
          <View
            style={{
              position: "absolute",
              right: -2,
              bottom: -2,
              minWidth: 26,
              height: 26,
              borderRadius: 13,
              paddingHorizontal: 6,
              backgroundColor: theme.gold,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText variant="small" color="onAccent" style={{ lineHeight: 16 }}>{uploading ? "…" : "✎"}</AppText>
          </View>
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="h2" numberOfLines={1}>{name}</AppText>
          <AppText color="muted" numberOfLines={1}>{p?.zone || session?.zone || "Zone not set"}</AppText>
        </View>
      </View>

      {profile.loading && <LoadingBlock label="Loading your profile" />}
      {profile.error && <ErrorBlock message="Couldn't load your profile." onRetry={profile.reload} />}

      {p?.found && (
        <Card>
          <Row label="Cell number" value={displayCell(p.cellNumber)} />
          <Row label="Email" value={p.email} />
          <Row label="Birthday" value={birthday} />
          <Row label="CTPMI member" value={p.isCtpmiMember === undefined ? null : p.isCtpmiMember ? "Yes" : "No"} />
          <Button label="Edit my details" kind="ghost" onPress={() => router.push("/edit-profile")} style={{ marginTop: 6 }} />
        </Card>
      )}

      <Card style={{ gap: 14 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">Notifications</AppText>
            <AppText variant="small" color="muted">
              {push === "granted" ? "On. Change in system settings." : push === "denied" ? "Off in system settings." : "Church updates and reminders."}
            </AppText>
          </View>
          <Switch
            accessibilityLabel="Notifications"
            value={push === "granted"}
            onValueChange={toggleNotifications}
            trackColor={{ true: theme.teal, false: theme.line }}
            thumbColor="#ffffff"
          />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">Share where I log in from</AppText>
            <AppText variant="small" color="muted">
              Your suburb and online status, only while the app is open. Never in the background.
            </AppText>
          </View>
          <Switch
            accessibilityLabel="Share where I log in from"
            value={locChoice === "yes" && locPerm === "granted"}
            onValueChange={toggleLocation}
            trackColor={{ true: theme.teal, false: theme.line }}
            thumbColor="#ffffff"
          />
        </View>
      </Card>

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
