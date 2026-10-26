import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Linking, Platform } from "react-native";

import { api } from "@/lib/api";

// Show alerts as a banner (and in the notification list) while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type PushStatus = "granted" | "denied" | "undetermined" | "unsupported";

const supported = Platform.OS === "ios" || Platform.OS === "android";

export async function getPushStatus(): Promise<PushStatus> {
  if (!supported) return "unsupported";
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch {
    return "unsupported";
  }
}

// Android 13+ only shows the permission prompt once a channel exists.
async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Church updates",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/** Asks the OS for notification permission (if needed). Returns the final status. */
export async function requestPushPermission(): Promise<PushStatus> {
  if (!supported) return "unsupported";
  try {
    await ensureAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.status === "granted") return "granted";
    if (!current.canAskAgain) return "denied";
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    return status;
  } catch {
    return "unsupported";
  }
}

/**
 * Fetches this device's Expo push token and registers it against the member.
 * Safe to call on every launch: the backend upserts, and it keeps rotated
 * tokens current. Never throws, since notifications are a nice-to-have.
 */
export async function registerPushToken(waId: string): Promise<void> {
  if (!supported || !waId) return;
  try {
    if ((await getPushStatus()) !== "granted") return;
    await ensureAndroidChannel();
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.registerPushToken({
      wa_id: waId,
      token,
      platform: Platform.OS === "ios" ? "ios" : "android",
    });
  } catch {
    // Offline, Expo Go on Android, or the backend isn't ready yet. Retry next launch.
  }
}

export function openSystemSettings() {
  Linking.openSettings().catch(() => {});
}
