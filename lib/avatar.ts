import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { api } from "@/lib/api";

export type AvatarResult =
  | { ok: true; avatarUrl: string; localUri: string }
  | { ok: false; reason: "cancelled" | "failed" };

/**
 * Lets the member choose a photo from their library, crops it square, shrinks
 * it to 256x256 JPEG (a few KB, so it uploads fast on mobile data) and sends it.
 * Picking a single image uses the system photo picker, so the app never gets
 * access to the rest of the camera roll.
 */
export async function pickAndUploadAvatar(waId: string): Promise<AvatarResult> {
  try {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (picked.canceled || !picked.assets?.[0]) return { ok: false, reason: "cancelled" };

    const rendered = await ImageManipulator.manipulate(picked.assets[0].uri)
      .resize({ width: 256, height: 256 })
      .renderAsync();
    const small = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.8,
      base64: true,
    });
    if (!small.base64) return { ok: false, reason: "failed" };

    const res = await api.uploadAvatar(waId, small.base64);
    if (!res.success || !res.avatarUrl) return { ok: false, reason: "failed" };
    return { ok: true, avatarUrl: res.avatarUrl, localUri: small.uri };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
