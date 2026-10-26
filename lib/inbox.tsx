import * as Notifications from "expo-notifications";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

import { api, type InboxMessage } from "@/lib/api";
import { useSession } from "@/lib/session";

interface InboxValue {
  messages: InboxMessage[];
  unread: number;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  markRead: (ids: string[] | "all") => Promise<void>;
}

const Ctx = createContext<InboxValue | undefined>(undefined);

export function InboxProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const waId = session?.waId ?? "";
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!waId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getInbox(waId);
      if (!alive.current) return;
      setMessages(res.messages ?? []);
      setError(false);
    } catch {
      if (alive.current) setError(true);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [waId]);

  // Load on sign-in, whenever the app returns to the foreground, and when a push
  // arrives while the app is open.
  useEffect(() => {
    refresh();
    const appState = AppState.addEventListener("change", (s) => {
      if (s === "active") refresh();
    });
    let received: { remove: () => void } | undefined;
    try {
      received = Notifications.addNotificationReceivedListener(() => refresh());
    } catch {
      // Notifications unavailable on this platform (web preview).
    }
    return () => {
      appState.remove();
      received?.remove();
    };
  }, [refresh]);

  const markRead = useCallback(
    async (ids: string[] | "all") => {
      if (!waId) return;
      // Optimistic: update the UI first, the server catches up.
      setMessages((prev) =>
        prev.map((m) => (ids === "all" || ids.includes(m.id) ? { ...m, read: true } : m))
      );
      try {
        await api.markInboxRead(waId, ids);
      } catch {
        // Next refresh reconciles with the server.
      }
    },
    [waId]
  );

  const unread = useMemo(() => messages.filter((m) => !m.read).length, [messages]);

  const value = useMemo(
    () => ({ messages, unread, loading, error, refresh, markRead }),
    [messages, unread, loading, error, refresh, markRead]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInbox(): InboxValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useInbox must be used within InboxProvider");
  return v;
}
