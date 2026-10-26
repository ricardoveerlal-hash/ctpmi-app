import AsyncStorage from "@react-native-async-storage/async-storage";

// Local, per-device choices. Nothing here leaves the phone.
const K = {
  pushAsked: "ctpmi_push_asked",
  locationChoice: "ctpmi_location_choice", // "yes" | "no"
  locationLastAt: "ctpmi_location_last_at",
} as const;

export type LocationChoice = "yes" | "no" | null;

export async function getPushAsked(): Promise<boolean> {
  return (await AsyncStorage.getItem(K.pushAsked).catch(() => null)) === "1";
}
export async function setPushAsked(): Promise<void> {
  await AsyncStorage.setItem(K.pushAsked, "1").catch(() => {});
}

export async function getLocationChoice(): Promise<LocationChoice> {
  const v = await AsyncStorage.getItem(K.locationChoice).catch(() => null);
  return v === "yes" || v === "no" ? v : null;
}
export async function setLocationChoice(v: "yes" | "no"): Promise<void> {
  await AsyncStorage.setItem(K.locationChoice, v).catch(() => {});
}

export async function getLocationLastAt(): Promise<number> {
  const v = await AsyncStorage.getItem(K.locationLastAt).catch(() => null);
  return v ? Number(v) || 0 : 0;
}
export async function setLocationLastAt(ms: number): Promise<void> {
  await AsyncStorage.setItem(K.locationLastAt, String(ms)).catch(() => {});
}
