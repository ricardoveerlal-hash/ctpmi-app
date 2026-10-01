import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { fonts, useTheme } from "@/lib/theme";

// Two-or-more option switch with a sliding teal pill (used for Play | Leaderboard).
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);
  const idx = Math.max(0, options.findIndex((o) => o.key === value));
  const segW = width > 0 ? (width - 10) / options.length : 0;
  const x = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring(idx * segW, { damping: 16, stiffness: 180 });
  }, [idx, segW, x]);

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        flexDirection: "row",
        height: 48,
        padding: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.line,
        backgroundColor: theme.card,
      }}
    >
      {segW > 0 && (
        <Animated.View
          style={[
            { position: "absolute", top: 4, left: 4, width: segW, height: 38, borderRadius: 999, backgroundColor: theme.teal },
            pill,
          ]}
        />
      )}
      {options.map((o) => (
        <Pressable
          key={o.key}
          accessibilityRole="tab"
          accessibilityState={{ selected: o.key === value }}
          onPress={() => {
            if (o.key === value) return;
            Haptics.selectionAsync().catch(() => {});
            onChange(o.key);
          }}
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: o.key === value ? theme.onAccent : theme.muted }}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
