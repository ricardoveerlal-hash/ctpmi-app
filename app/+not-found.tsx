import { Link, Stack } from "expo-router";
import { View } from "react-native";

import { AppText, Screen } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <Screen toggle={false}>
        <View style={{ gap: 12 }}>
          <AppText variant="title">This page doesn&apos;t exist.</AppText>
          <Link href="/" style={{ paddingVertical: 12 }}>
            <AppText color="tealText" variant="bodyStrong">Go to the home screen</AppText>
          </Link>
        </View>
      </Screen>
    </>
  );
}
