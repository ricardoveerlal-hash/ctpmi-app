import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import Animated, { FadeInRight, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

import { AppText, Card, Chip, ErrorBlock, LoadingBlock, Screen, useAsync } from "@/components/ui";
import { api, type LeaderboardEntry, type LeaderboardRange } from "@/lib/api";
import { isMonthViewLive, winnerTitle } from "@/lib/season";
import { useTheme } from "@/lib/theme";

const RANGES: { key: LeaderboardRange; label: string }[] = [
  { key: "month", label: "This month" },
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "All time" },
];

const fmt = (n: number) => String(Math.round(n * 10) / 10);

function PodiumBar({ entry, height, color, delay }: { entry: LeaderboardEntry; height: number; color: string; delay: number }) {
  const { theme } = useTheme();
  const h = useSharedValue(8);
  useEffect(() => {
    h.value = withDelay(delay, withTiming(height, { duration: 900 }));
  }, [h, height, delay]);
  const style = useAnimatedStyle(() => ({ height: h.value }));
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
      <AppText variant="small" numberOfLines={1} style={{ textAlign: "center" }}>{entry.name}</AppText>
      <AppText variant="small" color="muted" style={{ marginBottom: 6 }}>{fmt(entry.points)} pts</AppText>
      <Animated.View style={[{ width: "100%", borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: color, alignItems: "center", paddingTop: 8 }, style]}>
        <AppText variant="h2" color="onAccent" style={{ color: theme.onAccent }}>{entry.position}</AppText>
      </Animated.View>
    </View>
  );
}

export default function Ranks() {
  const { theme } = useTheme();
  const monthLive = isMonthViewLive();
  const ranges = RANGES.filter((r) => r.key !== "month" || monthLive);
  const [range, setRange] = useState<LeaderboardRange>(monthLive ? "month" : "all");

  const board = useAsync(() => api.getLeaderboard(range), [range]);
  const season = useAsync(() => api.getSeason(), []);

  const top = board.data?.top10 ?? [];
  const podium = [top[1], top[0], top[2]].filter(Boolean) as LeaderboardEntry[];
  const heights: Record<number, number> = { 1: 150, 2: 118, 3: 92 };
  const colors: Record<number, string> = { 1: "#f3d58b", 2: "#cfd8e3", 3: "#d49b6a" };
  const winner = season.data?.latestWinner;

  return (
    <Screen>
      <AppText variant="title">Leaderboard</AppText>

      {winner && (
        <Card style={{ borderColor: theme.gold, gap: 4 }}>
          <AppText variant="label">{winnerTitle(winner.monthKey, winner.monthLabel)}</AppText>
          <AppText variant="h3">{winner.name}</AppText>
          <AppText variant="small" color="muted">
            {fmt(winner.points)} pts · {winner.correct} correct from {winner.played} quizzes
          </AppText>
        </Card>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {ranges.map((r) => (
          <Chip key={r.key} label={r.label} selected={range === r.key} onPress={() => setRange(r.key)} />
        ))}
      </ScrollView>

      {board.loading && <LoadingBlock label="Loading the leaderboard" />}
      {board.error && <ErrorBlock message="Couldn't load the leaderboard." onRetry={board.reload} />}

      {!board.loading && board.data && top.length === 0 && (
        <Card><AppText color="muted">No scores yet for this period. Play the quiz to get on the board!</AppText></Card>
      )}

      {!board.loading && top.length >= 3 && (
        <View key={range} style={{ flexDirection: "row", alignItems: "flex-end", gap: 10, height: 230, paddingTop: 10 }}>
          {podium.map((e, i) => (
            <PodiumBar key={e.position} entry={e} height={heights[e.position]} color={colors[e.position]} delay={i * 150} />
          ))}
        </View>
      )}

      {!board.loading &&
        top.slice(3).map((e, i) => (
          <Animated.View key={`${range}-${e.position}`} entering={FadeInRight.delay(400 + i * 90).duration(450)}>
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 }}>
              <AppText variant="h3" color="muted" style={{ width: 28 }}>{e.position}</AppText>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{e.name}</AppText>
                {e.qualified === false && <AppText variant="small" color="muted">Not yet qualified</AppText>}
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <AppText variant="bodyStrong">{fmt(e.points)} pts</AppText>
                <AppText variant="small" color="muted">{e.correct} correct · {e.played} played</AppText>
              </View>
            </Card>
          </Animated.View>
        ))}

      {/* The API returns display names only, so the signed-in member is not
          highlighted yet. Add `isYou` (or waId) to /web/leaderboard to do it. */}
    </Screen>
  );
}
