import * as Location from "expo-location";
import { useEffect } from "react";
import { Alert, AppState, Platform } from "react-native";

import { api } from "@/lib/api";
import { getLocationPermission } from "@/lib/location";
import {
  getLocationChoice,
  getPresenceNoticeShown,
  setLocationChoice,
  setPresenceNoticeShown,
} from "@/lib/prefs";

const supported = Platform.OS === "ios" || Platform.OS === "android";
const BEAT_MS = 3 * 60 * 1000;

async function beat(waId: string): Promise<void> {
  try {
    if ((await getLocationChoice()) !== "yes") return;
    if ((await getLocationPermission()) !== "granted") return;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    let place: Location.LocationGeocodedAddress | undefined;
    try {
      [place] = await Location.reverseGeocodeAsync(pos.coords);
    } catch {
      // Best-effort: presence is still useful without a place name.
    }
    await api.sendPresence({
      wa_id: waId,
      suburb: place?.district ?? place?.subregion ?? null,
      city: place?.city ?? place?.subregion ?? null,
    });
  } catch {
    // Offline or no fix: try again on the next beat.
  }
}

/**
 * While the app is open and on screen, tell the church "this member is online"
 * every few minutes (suburb only, no coordinates). Stops the moment the app goes
 * to the background. Only runs for members who allowed location sharing.
 */
export function usePresence(waId: string) {
  useEffect(() => {
    if (!supported || !waId) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      void beat(waId);
      timer = setInterval(() => void beat(waId), BEAT_MS);
    };

    // One-time heads-up for members who agreed to location before this existed.
    (async () => {
      if ((await getLocationChoice()) === "yes" && !(await getPresenceNoticeShown())) {
        await setPresenceNoticeShown();
        Alert.alert(
          "Update to location sharing",
          "While the app is open, church leadership can now also see that you are online, and your suburb. Nothing is tracked when the app is closed.",
          [
            { text: "Turn off", style: "destructive", onPress: () => void setLocationChoice("no") },
            { text: "OK" },
          ]
        );
      }
    })();

    if (AppState.currentState === "active") start();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") start();
      else stop();
    });
    return () => {
      sub.remove();
      stop();
    };
  }, [waId]);
}
