import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";

export interface Session {
  waId: string;
  firstName: string;
  fullName: string;
  zone?: string;
}

interface SessionValue {
  session: Session | null;
  loading: boolean;
  setSession: (s: Session) => Promise<void>;
  clearSession: () => Promise<void>;
}

const KEY = "ctpmi_session";
const Ctx = createContext<SessionValue | undefined>(undefined);

// SecureStore has no web implementation; fall back to localStorage there so the
// web preview (expo start --web) still works during development.
async function read(): Promise<string | null> {
  if (Platform.OS === "web") return globalThis.localStorage?.getItem(KEY) ?? null;
  return SecureStore.getItemAsync(KEY);
}
async function write(v: string): Promise<void> {
  if (Platform.OS === "web") return void globalThis.localStorage?.setItem(KEY, v);
  await SecureStore.setItemAsync(KEY, v);
}
async function remove(): Promise<void> {
  if (Platform.OS === "web") return void globalThis.localStorage?.removeItem(KEY);
  await SecureStore.deleteItemAsync(KEY);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    read()
      .then((raw) => {
        if (raw) setSessionState(JSON.parse(raw) as Session);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setSession = useCallback(async (s: Session) => {
    setSessionState(s);
    await write(JSON.stringify(s));
  }, []);

  const clearSession = useCallback(async () => {
    setSessionState(null);
    await remove();
  }, []);

  const value = useMemo(
    () => ({ session, loading, setSession, clearSession }),
    [session, loading, setSession, clearSession]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession must be used within SessionProvider");
  return v;
}
