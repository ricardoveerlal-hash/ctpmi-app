import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

import Leaderboard from "@/components/Leaderboard";
import QuizPlayer from "@/components/QuizPlayer";
import { Segmented } from "@/components/Segmented";
import { AppText, Button, Card, ErrorBlock, LoadingBlock, LogoOrbit, Screen } from "@/components/ui";
import { api, type QuizAnswerResponse, type QuizTodayResponse } from "@/lib/api";
import { useSession } from "@/lib/session";

type Phase = "loading" | "intro" | "play" | "already" | "results" | "error" | "notready";
type Section = "play" | "board";

export default function QuizTab() {
  const { session } = useSession();
  const [section, setSection] = useState<Section>("play");
  const [phase, setPhase] = useState<Phase>("loading");
  const [quiz, setQuiz] = useState<QuizTodayResponse | null>(null);
  const [result, setResult] = useState<QuizAnswerResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(() => {
    if (!session) return;
    setPhase("loading");
    api
      .getQuizToday(session.waId)
      .then((d) => {
        setQuiz(d);
        // New questions are generated each morning around 06:05 (SAST). Before that the
        // API returns an empty list, so say so instead of showing an empty quiz.
        setPhase(d.alreadyPlayed ? "already" : d.questions.length === 0 ? "notready" : "intro");
      })
      .catch(() => {
        setErrorMsg("Couldn't load today's quiz. Try again in a moment.");
        setPhase("error");
      });
  }, [session]);

  useEffect(load, [load]);

  async function finish(answers: string[]) {
    if (!session) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await api.submitQuizAnswer(session.waId, answers);
      if (res.alreadyPlayed) {
        setPhase("already");
        return;
      }
      setResult(res);
      setPhase("results");
    } catch {
      setErrorMsg("Couldn't submit your answers. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      {/* The switch is hidden mid-quiz so a player cannot walk out of a question. */}
      {(section === "board" || phase !== "play") && (
        <Segmented
          options={[
            { key: "play", label: "Play" },
            { key: "board", label: "Leaderboard" },
          ]}
          value={section}
          onChange={setSection}
        />
      )}

      {section === "board" && <Leaderboard />}

      {section === "play" && phase === "loading" && <LoadingBlock label="Loading today's quiz" />}
      {section === "play" && phase === "error" && <ErrorBlock message={errorMsg} onRetry={load} />}

      {section === "play" && phase === "notready" && (
        <Card style={{ gap: 10 }}>
          <AppText variant="h2">Today&apos;s quiz isn&apos;t ready yet</AppText>
          <AppText color="muted">
            Fresh questions are prepared every morning. Check back after 6:15 AM, and in the meantime see where you stand on the leaderboard.
          </AppText>
          <Button label="Check again" onPress={load} />
          <Button label="View the leaderboard" kind="teal" onPress={() => setSection("board")} />
        </Card>
      )}

      {section === "play" && phase === "intro" && quiz && (
        <View style={{ alignItems: "center", gap: 12 }}>
          <LogoOrbit size={90} />
          <AppText variant="title">Bible Quiz</AppText>
          <AppText color="muted" style={{ textAlign: "center" }}>
            {quiz.questions.length} questions · {quiz.tierName} difficulty. Answer fast for bonus points.
          </AppText>
          <Button label="Begin" onPress={() => setPhase("play")} style={{ alignSelf: "stretch", marginTop: 8 }} />
        </View>
      )}

      {section === "play" && phase === "play" && quiz && (
        <QuizPlayer tierName={quiz.tierName} questions={quiz.questions} submitting={submitting} errorMsg={errorMsg} onFinish={finish} />
      )}

      {section === "play" && phase === "already" && quiz && (
        <Card style={{ gap: 10 }}>
          <AppText variant="h2">You&apos;ve already played today</AppText>
          <AppText color="muted">
            {quiz.totalCorrect} correct across {quiz.totalPlayed} quizzes overall. Come back tomorrow for a new one.
          </AppText>
          <Button label="View the leaderboard" kind="teal" onPress={() => setSection("board")} />
        </Card>
      )}

      {section === "play" && phase === "results" && result && (
        <View style={{ gap: 14 }}>
          <Animated.View entering={ZoomIn.duration(500)}>
            <Card style={{ alignItems: "center", gap: 6 }}>
              <AppText variant="label" color="tealText">Quiz complete</AppText>
              <AppText variant="title">
                {result.correctCount}/{result.totalQuestions} correct
              </AppText>
              {result.leveledUp && (
                <AppText variant="bodyStrong" color="goldText">
                  Level up! You&apos;re now at {result.newTierName} difficulty
                </AppText>
              )}
            </Card>
          </Animated.View>
          {result.breakdown?.map((b) => (
            <Card key={b.id} style={{ gap: 4 }}>
              <AppText variant="bodyStrong">{b.question}</AppText>
              <AppText variant="small" color={b.isCorrect ? "tealText" : "redText"}>
                {b.isCorrect ? "Correct" : `You answered ${b.given || "nothing"}. Correct: ${b.correct}. ${b.correctText}`}
              </AppText>
            </Card>
          ))}
          <Button label="See the leaderboard" kind="teal" onPress={() => setSection("board")} />
        </View>
      )}
    </Screen>
  );
}
