import { useRouter } from "expo-router";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppText, Button, LogoOrbit, Screen } from "@/components/ui";
import { fonts } from "@/lib/theme";
import { useSession } from "@/lib/session";

export default function Welcome() {
  const router = useRouter();
  const { session, loading } = useSession();

  return (
    <Screen scroll={false} contentStyle={{ alignItems: "center", justifyContent: "center" }}>
      <LogoOrbit size={124} />
      <Animated.Text
        entering={FadeInDown.delay(250).duration(900)}
        style={{
          fontFamily: fonts.display,
          fontSize: 44,
          letterSpacing: 6,
          color: "#f3f7f6",
          marginTop: -20,
        }}
      >
        CTPMI
      </Animated.Text>
      <Animated.View entering={FadeInDown.delay(500).duration(900)}>
        <AppText variant="body" color="muted" style={{ textAlign: "center", marginTop: 8 }}>
          Conquering Through Prayer{"\n"}Ministries International
        </AppText>
      </Animated.View>
      <Animated.View
        entering={FadeInDown.delay(900).duration(900)}
        style={{ marginTop: 40, width: "100%" }}
      >
        <Button
          label={session ? `Continue as ${session.firstName || "member"}` : "Enter the app"}
          disabled={loading}
          onPress={() => router.replace(session ? "/(tabs)" : "/login")}
        />
      </Animated.View>
      <View style={{ height: 24 }} />
    </Screen>
  );
}
