import * as Location from "expo-location";
import { Platform } from "react-native";

import { api } from "@/lib/api";
import { getLocationLastAt, getLocationLastPos, setLocationLastAt, setLocationLastPos } from "@/lib/prefs";

const supported = Platform.OS === "ios" || Platform.OS === "android";

// Check in at most once every 6 hours, unless the member has moved: if they are
// more than MOVED_KM from their last logged check-in we log a new one straight
// away. That shows "opened the app at A, then later at B" without a movement trail.
const MIN_GAP_MS = 6 * 60 * 60 * 1000;
const MOVED_KM = 0.5;

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

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
    const recent = Date.now() - (await getLocationLastAt()) < MIN_GAP_MS;

    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = pos.coords;

    // Within the 6-hour window: only log again if the member has moved.
    if (!opts?.force && recent) {
      const last = await getLocationLastPos();
      if (last && distanceKm(last, { lat: latitude, lng: longitude }) < MOVED_KM) return;
    }

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
    await setLocationLastPos(round(latitude), round(longitude));
  } catch {
    // No fix, offline, or the backend isn't ready yet. Try again next open.
  }
}
