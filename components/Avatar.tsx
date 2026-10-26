import { Image } from "expo-image";
import { View } from "react-native";

import { AppText } from "@/components/ui";
import { useTheme } from "@/lib/theme";

/** Profile picture, or the member's initial on a teal disc when there isn't one. */
export function Avatar({
  uri,
  name,
  size = 64,
}: {
  uri?: string | null;
  name: string;
  size?: number;
}) {
  const { theme } = useTheme();
  const radius = size / 2;
  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessibilityLabel={`${name}'s profile picture`}
        contentFit="cover"
        transition={200}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: theme.surface }}
      />
    );
  }
  return (
    <View
      accessibilityLabel={`${name}'s initial`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: theme.teal,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppText variant="title" color="onAccent">
        {name.charAt(0).toUpperCase()}
      </AppText>
    </View>
  );
}
