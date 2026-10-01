import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { AppText, Button, Card, ErrorBlock, LOGO, LoadingBlock, Screen, useAsync } from "@/components/ui";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Today() {
  const router = useRouter();
  const { theme } = useTheme();
  const { session } = useSession();
  const waId = session?.waId ?? "";

  const verse = useAsync(() => api.getVerse(waId), [waId]);
  const quiz = useAsync(() => api.getQuizToday(waId), [waId]);
  const news = useAsync(() => api.getLatest(), []);

  const [revealed, setRevealed] = useState(false);
  const [devoOpen, setDevoOpen] = useState(false);

  const v = verse.data;
  const q = quiz.data;
  const n = news.data;
  const today = new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" });

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginRight: 52 }}>
        <Image source={LOGO} style={{ width: 44, height: 44, borderRadius: 22 }} accessibilityLabel="CTPMI logo" />
        <View style={{ flex: 1 }}>
          <AppText variant="small" color="muted">{today}</AppText>
          <AppText variant="h2" numberOfLines={1}>
            {greeting()}, {session?.firstName || "friend"}
          </AppText>
        </View>
      </View>

      <Card style={{ minHeight: 150, justifyContent: "center" }}>
        <AppText variant="label">Verse of the day</AppText>
        {verse.loading && <LoadingBlock label="Loading today's verse" />}
        {verse.error && <ErrorBlock message="Couldn't load today's verse." onRetry={verse.reload} />}
        {v && (
          <Pressable accessibilityRole="button" accessibilityLabel="Reveal today's verse" onPress={() => setRevealed(true)}>
            <AppText variant="h3" style={{ marginTop: 8, lineHeight: 26 }}>{v.text}</AppText>
            <AppText variant="small" color="muted" style={{ marginTop: 6 }}>{v.ref}</AppText>
            {!!v.encouragement && (
              <AppText variant="small" color="muted" style={{ marginTop: 10 }}>{v.encouragement}</AppText>
            )}
            {!revealed && (
              <Animated.View
                exiting={FadeOut.duration(600)}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: theme.card,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppText variant="bodyStrong" color="goldText">Tap to reveal today&apos;s verse</AppText>
              </Animated.View>
            )}
          </Pressable>
        )}
      </Card>

      <Card style={{ backgroundColor: theme.teal, borderColor: theme.teal, gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <AppText variant="h2" color="onAccent">Bible Quiz</AppText>
          {q && <AppText variant="bodyStrong" color="onAccent">{q.tierName}</AppText>}
        </View>
        <AppText variant="small" color="onAccent">
          {q?.alreadyPlayed
            ? `You've played today: ${q.totalCorrect} correct across ${q.totalPlayed} quizzes. See you tomorrow!`
            : q
            ? `${q.questions.length} questions today · answer fast for bonus points`
            : "Checking today's quiz…"}
        </AppText>
        {!q?.alreadyPlayed && (
          <Button label="Start today's quiz" onPress={() => router.push("/(tabs)/quiz")} style={{ marginTop: 4 }} />
        )}
      </Card>

      {!!v?.title && !!v.body?.length && (
        <Card>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: devoOpen }}
            onPress={() => setDevoOpen((o) => !o)}
            style={{ minHeight: 44 }}
          >
            <AppText variant="label">Today&apos;s devotional</AppText>
            <AppText variant="h3" style={{ marginTop: 4 }}>{v.title}</AppText>
            {!!v.readMinutes && <AppText variant="small" color="muted">{v.readMinutes} min read</AppText>}
          </Pressable>
          {devoOpen && (
            <Animated.View entering={FadeIn.duration(350)} style={{ gap: 10, marginTop: 12 }}>
              {v.body!.map((p, i) => (
                <AppText key={i} color="muted">{p}</AppText>
              ))}
              {!!v.prayer && <AppText variant="bodyStrong">{v.prayer}</AppText>}
            </Animated.View>
          )}
        </Card>
      )}

      {n?.active && !!n.imageUrl && (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <Image source={{ uri: n.imageUrl }} style={{ width: "100%", height: 170 }} contentFit="cover" accessibilityLabel={n.title ?? "Latest news"} />
          <View style={{ padding: 16, gap: 6 }}>
            <AppText variant="label">Latest news</AppText>
            <AppText variant="h3">{n.title ?? "From the church office"}</AppText>
            {!!n.caption && <AppText color="muted">{n.caption}</AppText>}
            {!!n.linkUrl && /^https?:/i.test(n.linkUrl) && (
              <Button label={n.linkLabel ?? "Learn more"} kind="ghost" onPress={() => Linking.openURL(n.linkUrl!)} style={{ marginTop: 6 }} />
            )}
          </View>
        </Card>
      )}
    </Screen>
  );
}
