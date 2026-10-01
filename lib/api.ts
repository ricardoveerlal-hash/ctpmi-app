// Typed client for the existing CTPMI Web API (n8n workflow "CTPMI Web API").
// The contract below is ported 1:1 from the website repo (lib/api.ts) so the
// app and ctpmi.online stay in lockstep until the Postgres API replaces n8n.

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://n8n.lirotech.co.za/webhook";

export type QuizOption = "A" | "B" | "C" | "D";

export interface QuizQuestion {
  id: number;
  question: string;
  options: Record<QuizOption, string>;
  // Optional: when the backend returns `correct` for every question the player
  // gives instant feedback, points and the 50/50 lifeline. Without it answers
  // are locked in and the full breakdown is shown at the end.
  correct?: QuizOption;
  reference?: string;
  hint?: string;
}

export interface QuizTodayResponse {
  waId: string;
  today: string;
  quizDay: number;
  tier: number;
  tierName: string;
  totalCorrect: number;
  totalPlayed: number;
  alreadyPlayed: boolean;
  questions: QuizQuestion[];
  error?: string;
}

export interface QuizAnswerBreakdown {
  id: number;
  question: string;
  given: string | null;
  correct: string;
  correctText: string;
  isCorrect: boolean;
}

export interface QuizAnswerResponse {
  alreadyPlayed: boolean;
  waId: string;
  correctCount?: number;
  totalQuestions?: number;
  breakdown?: QuizAnswerBreakdown[];
  totalCorrect: number;
  totalPlayed: number;
  leveledUp?: boolean;
  newTier?: number;
  newTierName?: string;
  error?: string;
}

export interface LeaderboardEntry {
  position: number;
  name: string;
  // points = correct * (1 + accuracy): the formula shared by the WhatsApp bot,
  // the Reporting Portal and /web/leaderboard. Rows are ranked by this.
  points: number;
  accuracy?: number;
  correct: number;
  played: number;
  qualified?: boolean;
  exempt?: boolean;
}

export type LeaderboardRange = "month" | "today" | "7d" | "30d" | "all";

export interface LeaderboardResponse {
  range: { key: string; label: string; monthKey?: string; minPlayed?: number };
  top10: LeaderboardEntry[];
  perfectScores: { name: string; correct: number; played: number }[];
  quickest: { name: string; avgSeconds: number }[];
  fastestEver: { name: string; seconds: number } | null;
  participation: {
    position: number;
    name: string;
    questionsAnswered: number;
    quizzesPlayed: number;
    correct: number;
  }[];
  rankClimbers: { name: string; from: number; to: number; delta: number }[];
  hasHistory: boolean;
}

export interface VerseResponse {
  date: string;
  ref: string;
  text: string;
  encouragement: string;
  firstName?: string;
  // Devotional of the Day fields (present once a devotional is published).
  title?: string;
  body?: string[];
  prayer?: string;
  author?: string;
  readMinutes?: number;
}

export interface LoginResponse {
  found: boolean;
  waId: string;
  fullName?: string;
  firstName?: string;
  zone?: string;
}

export interface RegisterPayload {
  wa_id: string;
  firstName: string;
  surname?: string;
  zone?: string;
  email?: string;
  isCtpmiMember: boolean;
  birthDay: number;
  birthMonth: number;
}

export interface RegisterResponse {
  success: boolean;
  waId?: string;
  fullName?: string;
  error?: string;
}

export interface ProfileResponse {
  found: boolean;
  waId: string;
  firstName?: string;
  surname?: string;
  fullName?: string;
  zone?: string;
  email?: string;
  cellNumber?: string;
  birthDay?: number | null;
  birthMonth?: number | null;
  isCtpmiMember?: boolean;
  registeredAt?: string;
}

export interface SeasonWinner {
  monthKey: string;
  monthLabel: string;
  name: string;
  points: number;
  accuracy: number;
  correct: number;
  played: number;
}

export interface SeasonResponse {
  latestWinner: SeasonWinner | null;
  winners: SeasonWinner[];
}

// "Latest News" tile published from the Reporting Portal.
export interface LatestResponse {
  active?: boolean;
  imageUrl?: string;
  title?: string;
  caption?: string;
  linkUrl?: string;
  linkLabel?: string;
}

export type PrayerRequestType =
  | "Prayer Request"
  | "Home Visit"
  | "Pastoral Care"
  | "Item Request"
  | "Church Visit";

export interface PrayerRequestPayload {
  request_type: PrayerRequestType;
  ctpmi_member: "Yes" | "No";
  full_name: string;
  cell_number: string;
  zone: string;
  prayer_request: string;
}

const TIMEOUT_MS = 15000;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function getJson<T>(path: string, params?: Record<string, string>): Promise<T> {
  const qs = params
    ? "?" +
      Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&")
    : "";
  return request<T>(`${API_BASE_URL}/${path}${qs}`);
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(`${API_BASE_URL}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export const api = {
  getQuizToday: (waId: string) =>
    getJson<QuizTodayResponse>("web/quiz/today", { wa_id: waId }),
  submitQuizAnswer: (waId: string, answers: string[]) =>
    postJson<QuizAnswerResponse>("web/quiz/answer", { wa_id: waId, answers }),
  getLeaderboard: (range: LeaderboardRange) =>
    getJson<LeaderboardResponse>("web/leaderboard", { range }),
  getSeason: () => getJson<SeasonResponse>("web/season"),
  getVerse: (waId?: string) =>
    getJson<VerseResponse>("web/verse", waId ? { wa_id: waId } : undefined),
  getLatest: () => getJson<LatestResponse>("web/latest"),
  login: (waId: string) => postJson<LoginResponse>("web/login", { wa_id: waId }),
  register: (payload: RegisterPayload) =>
    postJson<RegisterResponse>("web/register", payload),
  getProfile: (waId: string) =>
    getJson<ProfileResponse>("web/profile", { wa_id: waId }),
  sendPrayerRequest: (payload: PrayerRequestPayload) =>
    postJson<unknown>("website-prayer-request", payload),
};
