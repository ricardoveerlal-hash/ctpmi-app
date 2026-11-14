import * as Updates from "expo-updates";
import { Platform } from "react-native";

export type UpdateResult =
  | { kind: "unsupported" } // dev build, Expo Go or web: no over-the-air updates
  | { kind: "latest" } // already on the newest version
  | { kind: "ready" } // downloaded; restart to use it
  | { kind: "error"; message: string };

const supported = Platform.OS === "android" || Platform.OS === "ios";

/** Short id of the running update, or "built-in" if the app is still on the version it was installed with. */
export function runningVersionLabel(): string {
  if (!supported || !Updates.isEnabled) return "development";
  return Updates.isEmbeddedLaunch || !Updates.updateId ? "built-in" : Updates.updateId.slice(0, 8);
}

/** Checks for an over-the-air update and downloads it if there is one. Does not restart the app. */
export async function checkAndFetchUpdate(): Promise<UpdateResult> {
  if (!supported || !Updates.isEnabled) return { kind: "unsupported" };
  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable && !check.isRollBackToEmbedded) return { kind: "latest" };
    const fetched = await Updates.fetchUpdateAsync();
    if (fetched.isNew || fetched.isRollBackToEmbedded) return { kind: "ready" };
    return { kind: "latest" };
  } catch (e) {
    return { kind: "error", message: e instanceof Error ? e.message : "Could not check for updates." };
  }
}

export function restartApp(): void {
  Updates.reloadAsync().catch(() => {});
}
