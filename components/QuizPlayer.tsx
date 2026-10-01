import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import type { QuizOption, QuizQuestion } from "@/lib/api";
import { fonts, useTheme } from "@/lib/theme";
import { AppText, Button, Card } from "./ui";

const SECONDS = 60; // same as the website player
const LOCK_IN_DELAY_MS = 650;
const R = 24;
const C = 2 * Math.PI * R;
const OPTIONS: QuizOption[] = ["A", "B", "C", "D"];

interface Props {
  tierName: string;
  questions: QuizQuestion[];
  submitting: boolean;
  errorMsg: string;
  // Called once every question is answered (or timed out). Unanswered = "".
  onFinish: (orderedAnswers: string[]) => void;
}

export default function QuizPlayer({ tierName, questions, submitting, errorMsg, onFinish }: Props) {
  const { theme } = useTheme();
  const total = questions.length;
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SECONDS);
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState<QuizOption | null>(null);
  const [eliminated, setEliminated] = useState<QuizOption[]>([]);
  const [hintShown, setHintShown] = useState(false);
  const [used, setUsed] = useState({ fifty: false, hint: false });
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gain, setGain] = useState<number | null>(null);

  const answers = useRef<string[]>([]);
  const lockedRef = useRef(false);
  const timeRef = useRef(SECONDS);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  timeRef.current = timeLeft;

  const q = questions[index];
  const last = index === total - 1;
  // Instant feedback only when the backend sends the answer for every question.
  const instant = questions.every((x) => !!x.correct);

  const lock = useCallback(
    (opt: QuizOption | null) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      setLocked(true);
      setPicked(opt);
      answers.current[index] = opt ?? "";
      if (instant) {
        if (opt !== null && opt === q.correct) {
          const g = 100 + Math.round((Math.max(0, timeRef.current) / SECONDS) * 50);
          setPoints((p) => p + g);
          setStreak((s) => s + 1);
          setGain(g);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        } else {
          setStreak(0);
          setGain(null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        }
      }
    },
    [index, instant, q]
  );

  const advance = useCallback(() => {
    if (last) {
      finishRef.current(questions.map((_, i) => answers.current[i] ?? ""));
      return;
    }
    lockedRef.current = false;
    setIndex((i) => i + 1);
    setLocked(false);
    setPicked(null);
    setEliminated([]);
    setHintShown(false);
    setGain(null);
    setTimeLeft(SECONDS);
  }, [last, questions]);

  useEffect(() => {
    if (locked) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [locked, index]);

  useEffect(() => {
    if (timeLeft <= 0) lock(null);
  }, [timeLeft, lock]);

  // Without instant feedback, lock the answer in and move straight on.
  useEffect(() => {
    if (!locked || instant) return;
    const id = setTimeout(advance, LOCK_IN_DELAY_MS);
    return () => clearTimeout(id);
  }, [locked, instant, advance]);

  const shown = Math.max(0, timeLeft);
  const urgent = shown <= 10 && !locked;
  const ring = urgent ? theme.red : theme.teal;

  function stateOf(o: QuizOption): "idle" | "ok" | "bad" | "dim" {
    if (!locked) return "idle";
    if (instant) {
      if (o === q.correct) return "ok";
      if (o === picked) return "bad";
      return "dim";
    }
    return o === picked ? "ok" : "dim";
  }

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <AppText variant="bodyStrong">{instant ? `🔥 ${streak}` : tierName}</AppText>
        <View accessibilityRole="timer" accessibilityLabel={`${shown} seconds left`} style={{ width: 56, height: 56, alignItems: "center", justifyContent: "center" }}>
          <Svg width={56} height={56} viewBox="0 0 56 56" style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
            <Circle cx={28} cy={28} r={R} stroke={theme.line} strokeWidth={4} fill="none" />
            <Circle cx={28} cy={28} r={R} stroke={ring} strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - shown / SECONDS)} />
          </Svg>
          <Text style={{ fontFamily: fonts.display, fontSize: 16, color: urgent ? theme.redText : theme.ink }}>{shown}</Text>
        </View>
        <AppText variant="bodyStrong">{instant ? `⭐ ${points}` : `${index + 1}/${total}`}</AppText>
      </View>

      <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.line, overflow: "hidden" }}>
        <View style={{ height: 8, width: `${((index + (locked ? 1 : 0)) / total) * 100}%`, backgroundColor: theme.teal }} />
      </View>

      <Animated.View key={index} entering={FadeInDown.duration(400)} style={{ gap: 12 }}>
        <AppText variant="small" color="muted">
          {tierName} difficulty · Question {index + 1} of {total}
        </AppText>
        <AppText variant="h2" style={{ lineHeight: 30 }}>{q.question}</AppText>

        {OPTIONS.filter((o) => !eliminated.includes(o)).map((o) => {
          const s = stateOf(o);
          const border = s === "ok" ? theme.teal : s === "bad" ? theme.red : theme.line;
          return (
            <Pressable
              key={o}
              accessibilityRole="button"
              accessibilityLabel={`${o}. ${q.options[o]}`}
              disabled={locked}
              onPress={() => lock(o)}
              style={{
                minHeight: 58,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 14,
                borderRadius: 14,
                borderWidth: s === "idle" ? 1 : 2,
                borderColor: border,
                backgroundColor: theme.card,
                opacity: s === "dim" ? 0.5 : 1,
              }}
            >
              <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: theme.goldText }}>{o}</Text>
              </View>
              <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 16, color: theme.ink }}>{q.options[o]}</Text>
            </Pressable>
          );
        })}

        {instant && !locked && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button
              label="50/50"
              kind="ghost"
              disabled={used.fifty}
              style={{ flex: 1 }}
              onPress={() => {
                const wrong = OPTIONS.filter((o) => o !== q.correct);
                setEliminated(wrong.slice(0, 2));
                setUsed((u) => ({ ...u, fifty: true }));
              }}
            />
            {!!q.hint && (
              <Button
                label="Hint"
                kind="ghost"
                disabled={used.hint}
                style={{ flex: 1 }}
                onPress={() => {
                  setHintShown(true);
                  setUsed((u) => ({ ...u, hint: true }));
                }}
              />
            )}
          </View>
        )}
        {hintShown && !locked && !!q.hint && <AppText color="goldText">Hint: {q.hint}</AppText>}

        {instant && locked && (
          <Card style={{ gap: 6 }}>
            <AppText variant="bodyStrong" color={picked === q.correct ? "tealText" : "redText"}>
              {picked === null ? "Time's up" : picked === q.correct ? `Correct! +${gain ?? 100} points` : `Not quite. The answer is ${q.correct}.`}
            </AppText>
            {!!q.reference && <AppText variant="small" color="muted">{q.reference}</AppText>}
            <Button label={last ? "Finish" : "Next question"} kind="teal" loading={submitting} onPress={advance} style={{ marginTop: 6 }} />
          </Card>
        )}
      </Animated.View>

      {submitting && !instant && <AppText color="muted">Submitting your answers…</AppText>}
      {!!errorMsg && <AppText color="redText">{errorMsg}</AppText>}
    </View>
  );
}
