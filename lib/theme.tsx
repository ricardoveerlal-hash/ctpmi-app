import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// Brand tokens from the CTPMI website (navy / teal / gold, Bricolage + Inter).
export interface Palette {
  bg0: string; // gradient top
  bg: string; // gradient mid / page
  bg2: string; // gradient bottom
  card: string;
  line: string;
  surface: string;
  ink: string;
  muted: string;
  teal: string;
  tealText: string;
  gold: string;
  goldText: string;
  red: string;
  redText: string;
  onAccent: string; // text on teal/gold fills
  tabBar: string;
  star: string;
}

export const darkPalette: Palette = {
  bg0: "#0f2140",
  bg: "#050d1a",
  bg2: "#02060d",
  card: "rgba(15,33,64,0.85)",
  line: "#1b3a63",
  surface: "#12335a",
  ink: "#f3f7f6",
  muted: "#9fb3c8",
  teal: "#1d9c90",
  tealText: "#1d9c90",
  gold: "#d9a94e",
  goldText: "#e3b65f",
  red: "#e0637a",
  redText: "#f3c4cc",
  onAccent: "#050d1a",
  tabBar: "rgba(10,24,48,0.96)",
  star: "#ffffff",
};

export const lightPalette: Palette = {
  bg0: "#ffffff",
  bg: "#eef5f4",
  bg2: "#dbe8e7",
  card: "rgba(255,255,255,0.94)",
  line: "#cbdadc",
  surface: "#e1ecec",
  ink: "#0a1830",
  muted: "#4a5f75",
  teal: "#1d9c90",
  tealText: "#0e6b62",
  gold: "#c8912f",
  goldText: "#8a5d0c",
  red: "#d2475f",
  redText: "#a62a42",
  onAccent: "#050d1a",
  tabBar: "rgba(255,255,255,0.97)",
  star: "#7f9bb5",
};

export const fonts = {
  display: "BricolageGrotesque_700Bold",
  displaySemi: "BricolageGrotesque_600SemiBold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemi: "Inter_600SemiBold",
} as const;

type Mode = "dark" | "light";

interface ThemeValue {
  theme: Palette;
  mode: Mode;
  isDark: boolean;
  setMode: (m: Mode) => void;
  toggle: () => void;
}

const KEY = "ctpmi_theme";
const Ctx = createContext<ThemeValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("dark");

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === "light" || v === "dark") setModeState(v);
      })
      .catch(() => {});
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m).catch(() => {});
  }, []);

  const toggle = useCallback(
    () => setMode(mode === "dark" ? "light" : "dark"),
    [mode, setMode]
  );

  const value = useMemo<ThemeValue>(
    () => ({
      theme: mode === "dark" ? darkPalette : lightPalette,
      mode,
      isDark: mode === "dark",
      setMode,
      toggle,
    }),
    [mode, setMode, toggle]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used within ThemeProvider");
  return v;
}
