import * as Location from "expo-location";
import { Platform } from "react-native";

import { api } from "@/lib/api";
import { getLocationLastAt, setLocationLastAt } from "@/lib/prefs";

const supported = Platform.OS === "ios" || Platform.OS === "android";

// Check in at most once every 6 hours so we log "where do members open the app
// from", not a movement trail.
const MIN_GAP_MS = 6 * 60 * 60 * 1000;

// Coordinates are rounded to 3 decimals (about 100 m) and we store the suburb
// name. That shows which suburb or neighbourhood a member logs in from, but not
// a street address or house.
const round = (n: number) => Math.round(n * 1000) / 1000;

export type LocationPermission = "granted" | "denied" | "undetermined" | "unsupported";

export async function getLocationPermission(): Promise<LocationPermission> {
  if (!supported) return "unsupported";
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status;
  } catch {
    return "unsupported";
  }
}

export async function requestLocationPermission(): Promise<LocationPermission> {
  if (!supported) return "unsupported";
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status;
  } catch {
    return "unsupported";
  }
}

/**
 * Records the member's approximate location. Foreground only: it runs while
 * the app is open and never in the background. Returns quietly on any failure.
 */
export async function checkInLocation(waId: string, opts?: { force?: boolean }): Promise<void> {
  if (!supported || !waId) return;
  try {
    if ((await getLocationPermission()) !== "granted") return;
    if (!opts?.force && Date.now() - (await getLocationLastAt()) < MIN_GAP_MS) return;

    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = pos.coords;

    let place: Location.LocationGeocodedAddress | undefined;
    try {
      [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    } catch {
      // Geocoding is best-effort; coordinates alone are still useful.
    }

    await api.logLoginLocation({
      wa_id: waId,
      latitude: round(latitude),
      longitude: round(longitude),
      suburb: place?.district ?? place?.subregion ?? null,
      city: place?.city ?? place?.subregion ?? null,
      region: place?.region ?? null,
      country: place?.country ?? null,
      platform: Platform.OS === "ios" ? "ios" : "android",
      capturedAt: new Date().toISOString(),
    });
    await setLocationLastAt(Date.now());
  } catch {
    // No fix, offline, or the backend isn't ready yet. Try again next open.
  }
}
