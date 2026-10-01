import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, useTheme, type Palette } from "@/lib/theme";

export const LOGO = require("../assets/images/logo.png");

/* ------------------------------------------------------------------ text */

type Variant = "title" | "h2" | "h3" | "body" | "bodyStrong" | "small" | "label";
type ColorKey = "ink" | "muted" | "goldText" | "tealText" | "redText" | "onAccent";

const variants: Record<Variant, TextStyle> = {
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34 },
  h2: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28 },
  h3: { fontFamily: fonts.displaySemi, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
};

export function AppText({
  variant = "body",
  color,
  style,
  ...rest
}: TextProps & { variant?: Variant; color?: ColorKey }) {
  const { theme } = useTheme();
  const c = color ?? (variant === "label" ? "goldText" : "ink");
  return <Text {...rest} style={[variants[variant], { color: theme[c] }, style]} />;
}

/* ----------------------------------------------------------------- cards */

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.card,
          borderColor: theme.line,
          borderWidth: 1,
          borderRadius: 18,
          padding: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* --------------------------------------------------------------- buttons */

type ButtonKind = "gold" | "teal" | "ghost" | "danger";

export function Button({
  label,
  onPress,
  kind = "gold",
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: ButtonKind;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const off = disabled || loading;

  const bg =
    kind === "gold" ? theme.gold : kind === "teal" ? theme.teal : "transparent";
  const fg =
    kind === "ghost" ? theme.ink : kind === "danger" ? theme.redText : theme.onAccent;
  const border = kind === "ghost" ? theme.line : kind === "danger" ? theme.red : "transparent";

  return (
    <Animated.View style={[anim, { opacity: off ? 0.55 : 1 }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!off, busy: !!loading }}
        disabled={off}
        onPressIn={() => (scale.value = withSpring(0.96, { duration: 150 }))}
        onPressOut={() => (scale.value = withSpring(1, { duration: 200 }))}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onPress();
        }}
        style={{
          minHeight: 52,
          borderRadius: 14,
          backgroundColor: bg,
          borderColor: border,
          borderWidth: kind === "ghost" || kind === "danger" ? 1 : 0,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 20,
        }}
      >
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <Text style={{ fontFamily: fonts.display, fontSize: 16, color: fg }}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={{
        minHeight: 40,
        paddingHorizontal: 14,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: selected ? theme.teal : theme.line,
        backgroundColor: selected ? theme.teal : "transparent",
      }}
    >
      <Text
        style={{
          fontFamily: fonts.bodySemi,
          fontSize: 13,
          color: selected ? theme.onAccent : theme.muted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ----------------------------------------------------------- theme toggle */

export function ThemeToggle({ style }: { style?: StyleProp<ViewStyle> }) {
  const { theme, isDark, toggle } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        toggle();
      }}
      style={[
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.card,
          borderColor: theme.line,
          borderWidth: 1,
        },
        style,
      ]}
    >
      <Animated.View key={isDark ? "moon" : "sun"} entering={ZoomIn.duration(350)}>
        <SymbolView
          name={
            isDark
              ? { ios: "moon.fill", android: "dark_mode", web: "dark_mode" }
              : { ios: "sun.max.fill", android: "light_mode", web: "light_mode" }
          }
          tintColor={theme.gold}
          size={22}
        />
      </Animated.View>
    </Pressable>
  );
}

/* ------------------------------------------------------------- background */

// Deterministic so the sky is the same on every launch.
const STARS = (() => {
  let seed = 11;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: 30 }, () => ({
    x: rnd() * 100,
    y: rnd() * 100,
    size: 1 + rnd() * 2.2,
    dur: 2200 + rnd() * 3200,
  }));
})();

function Star({ s, color }: { s: (typeof STARS)[number]; color: string }) {
  const o = useSharedValue(0.2);
  useEffect(() => {
    o.value = withRepeat(
      withSequence(
        withTiming(1, { duration: s.dur, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: s.dur, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, [o, s.dur]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: s.size,
          height: s.size,
          borderRadius: s.size,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function StarField({ palette }: { palette: Palette }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {STARS.map((s, i) => (
        <Star key={i} s={s} color={palette.star} />
      ))}
    </View>
  );
}

/* ---------------------------------------------------------------- screen */

export function Screen({
  children,
  scroll = true,
  contentStyle,
  toggle = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  toggle?: boolean;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: insets.top + 56, paddingHorizontal: 20 };
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <LinearGradient colors={[theme.bg0, theme.bg, theme.bg2]} style={StyleSheet.absoluteFill} />
      <StarField palette={theme} />
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[pad, { paddingBottom: 40, gap: 14 }, contentStyle]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      )}
      {toggle && <ThemeToggle style={{ position: "absolute", top: insets.top + 6, right: 12 }} />}
    </View>
  );
}

/* ------------------------------------------------------------- logo orbit */

function Ring({
  size,
  duration,
  reverse,
  color,
  dashed,
  dot,
}: {
  size: number;
  duration: number;
  reverse?: boolean;
  color: string;
  dashed?: boolean;
  dot: string;
}) {
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(withTiming(360, { duration, easing: Easing.linear }), -1);
  }, [r, duration]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${reverse ? -r.value : r.value}deg` }],
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
          borderStyle: dashed ? "dashed" : "solid",
        },
        style,
      ]}
    >
      <View
        style={{
          position: "absolute",
          top: -5,
          left: size / 2 - 5,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: dot,
        }}
      />
    </Animated.View>
  );
}

export function LogoOrbit({ size = 120 }: { size?: number }) {
  const { theme } = useTheme();
  const box = size * 2.6;
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, [pulse]);
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  return (
    <View style={{ width: box, height: box, alignItems: "center", justifyContent: "center" }}>
      <Ring size={size * 1.55} duration={9000} color="rgba(29,156,144,0.7)" dot={theme.teal} />
      <Ring size={size * 2} duration={16000} reverse dashed color="rgba(217,169,78,0.55)" dot={theme.gold} />
      <Ring size={size * 2.5} duration={28000} color="rgba(130,150,170,0.3)" dot={theme.ink} />
      <Animated.View style={logoStyle}>
        <Image
          source={LOGO}
          accessibilityLabel="CTPMI logo"
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
}

/* ------------------------------------------------------------------ data */

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(() => {
    setLoading(true);
    setError(null);
    fnRef
      .current()
      .then((d) => setData(d))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Something went wrong"))
      .finally(() => setLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(run, deps);
  return { data, error, loading, reload: run };
}

export function LoadingBlock({ label }: { label: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: "center", gap: 12, paddingVertical: 40 }}>
      <ActivityIndicator color={theme.teal} />
      <AppText variant="small" color="muted">
        {label}
      </AppText>
    </View>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card style={{ gap: 12 }}>
      <AppText variant="bodyStrong">{message}</AppText>
      <Button label="Try again" kind="ghost" onPress={onRetry} />
    </Card>
  );
}
