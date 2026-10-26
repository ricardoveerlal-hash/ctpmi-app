import { useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";

import { checkInLocation, requestLocationPermission } from "@/lib/location";
import { getPushStatus, registerPushToken, requestPushPermission } from "@/lib/notifications";
import {
  getLocationChoice,
  getPushAsked,
  setLocationChoice,
  setPushAsked,
} from "@/lib/prefs";

// Resolves true when the member taps the affirmative button.
function ask(title: string, message: string, yes: string, no: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: no, style: "cancel", onPress: () => resolve(false) },
        { text: yes, onPress: () => resolve(true) },
      ],
      { cancelable: false }
    );
  });
}

/**
 * Runs once per app launch after sign-in:
 *  1. Notifications: explain, then ask the OS (first time only), then register
 *     this device's push token.
 *  2. Location: explain and ask for consent (first time only), then record an
 *     approximate "logged in from" check-in.
 * We always explain in our own words before the system prompt appears, and a
 * "Not now" is remembered and respected. Both can be changed in Profile.
 */
export function useFirstRunPrompts(waId: string) {
  const ran = useRef<string>("");

  useEffect(() => {
    if (!waId || ran.current === waId) return;
    if (Platform.OS !== "ios" && Platform.OS !== "android") return;
    ran.current = waId;

    let cancelled = false;
    const run = async () => {
      // Give the home screen a moment to appear before any dialog.
      await new Promise((r) => setTimeout(r, 1200));
      if (cancelled) return;

      // 1. Notifications
      const push = await getPushStatus();
      if (push === "granted") {
        await registerPushToken(waId);
      } else if (push === "undetermined" && !(await getPushAsked())) {
        await setPushAsked();
        const yes = await ask(
          "Stay in the loop",
          "Allow notifications so the church can send you service updates, announcements and reminders. You can turn them off any time in Profile.",
          "Turn on",
          "Not now"
        );
        if (yes && (await requestPushPermission()) === "granted") {
          await registerPushToken(waId);
        }
      }
      if (cancelled) return;

      // 2. Location
      const choice = await getLocationChoice();
      if (choice === "yes") {
        await checkInLocation(waId);
      } else if (choice === null) {
        const yes = await ask(
          "Share where you log in from?",
          "Church leadership can see the suburb members open the app from, so we understand who we are reaching.\n\nWe only check while the app is open, keep it to about 100 m, and never track you in the background. You can switch this off any time in Profile.",
          "Allow",
          "Not now"
        );
        await setLocationChoice(yes ? "yes" : "no");
        if (yes && (await requestLocationPermission()) === "granted") {
          await checkInLocation(waId, { force: true });
        }
      }
    };
    run().catch(() => {});
    return () => {
      cancelled = true;
      ran.current = ""; // lets a remount (or dev StrictMode) run the flow again
    };
  }, [waId]);
}
