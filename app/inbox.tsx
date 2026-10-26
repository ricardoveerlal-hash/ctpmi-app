import { Redirect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, View } from "react-native";

import {
  AppText,
  Button,
  Card,
  ErrorBlock,
  LoadingBlock,
  Screen,
} from "@/components/ui";
import type { InboxMessage } from "@/lib/api";
import { useInbox } from "@/lib/inbox";
import { getPushStatus, openSystemSettings, type PushStatus } from "@/lib/notifications";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";

function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Inbox() {
  const router = useRouter();
  const { theme } = useTheme();
  const { session, loading: sessionLoading } = useSession();
  const { messages, unread, loading, error, refresh, markRead } = useInbox();
  const [push, setPush] = useState<PushStatus>("granted");

  useEffect(() => {
    refresh();
    getPushStatus().then(setPush);
  }, [refresh]);

  const open = useCallback(
    (m: InboxMessage) => {
      if (!m.read) markRead([m.id]);
      if (!m.url) return;
      if (m.url.startsWith("/")) router.push(m.url as never);
      else if (/^https:\/\//i.test(m.url)) Linking.openURL(m.url).catch(() => {});
    },
    [markRead, router]
  );

  if (sessionLoading) return null;
  if (!session) return <Redirect href="/login" />;

  return (
    <Screen bell={false}>
      <View style={{ marginRight: 52, gap: 4 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}
        >
          <AppText color="goldText" variant="bodyStrong">‹ Back</AppText>
        </Pressable>
        <AppText variant="title">Inbox</AppText>
        <AppText color="muted">
          {unread ? `${unread} unread from the church` : "Messages from the church office"}
        </AppText>
      </View>

      {push === "denied" && (
        <Card style={{ gap: 10 }}>
          <AppText variant="bodyStrong">Notifications are off</AppText>
          <AppText color="muted">
            You&apos;ll still see messages here, but we can&apos;t alert you when new ones arrive.
          </AppText>
          <Button label="Open settings" kind="ghost" onPress={openSystemSettings} />
        </Card>
      )}

      {unread > 0 && <Button label="Mark all as read" kind="ghost" onPress={() => markRead("all")} />}

      {loading && messages.length === 0 && <LoadingBlock label="Loading your messages" />}
      {error && messages.length === 0 && (
        <ErrorBlock message="Couldn't load your messages." onRetry={refresh} />
      )}
      {!loading && !error && messages.length === 0 && (
        <Card style={{ alignItems: "center", gap: 6, paddingVertical: 28 }}>
          <AppText variant="h3">All caught up</AppText>
          <AppText color="muted" style={{ textAlign: "center" }}>
            Announcements and reminders from the church will appear here.
          </AppText>
        </Card>
      )}

      {messages.map((m) => (
        <Pressable
          key={m.id}
          accessibilityRole="button"
          accessibilityLabel={`${m.read ? "" : "Unread. "}${m.title}`}
          onPress={() => open(m)}
        >
          <Card style={{ gap: 6, borderColor: m.read ? theme.line : theme.teal }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {!m.read && (
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: theme.teal }} />
              )}
              <AppText variant="h3" style={{ flex: 1 }} numberOfLines={2}>
                {m.title}
              </AppText>
            </View>
            <AppText color="muted">{m.body}</AppText>
            <AppText variant="small" color="muted">{when(m.sentAt)}</AppText>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
