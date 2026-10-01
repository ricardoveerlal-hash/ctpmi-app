import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, Share, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppText, Button, Card, Screen } from "@/components/ui";
import { GIVING } from "@/lib/giving";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";

export default function Give() {
  const { theme } = useTheme();
  const router = useRouter();
  const { session } = useSession();
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // A ready-made reference: "Name Surname 0821234567".
  const cell = session?.waId ? "0" + session.waId.slice(2) : "";
  const reference = session ? `${session.fullName || session.firstName} ${cell}`.trim() : GIVING.referenceHint;

  const rows = [
    { key: "bank", label: "Bank", value: GIVING.bank },
    { key: "name", label: "Account name", value: GIVING.accountName },
    { key: "number", label: "Account number", value: GIVING.accountNumber },
    { key: "branch", label: "Branch code", value: GIVING.branchCode },
    { key: "ref", label: "Payment reference", value: reference },
  ];

  async function copy(key: string, value: string) {
    await Clipboard.setStringAsync(value).catch(() => {});
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopied(key);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1800);
  }

  const summary =
    `CTPMI giving details\n` +
    `Bank: ${GIVING.bank}\nAccount name: ${GIVING.accountName}\n` +
    `Account number: ${GIVING.accountNumber}\nBranch code: ${GIVING.branchCode}\n` +
    `Reference: ${GIVING.referenceHint}`;

  return (
    <Screen>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}>
        <AppText color="tealText" variant="bodyStrong">‹ Back</AppText>
      </Pressable>

      <View>
        <AppText variant="title">Give</AppText>
        <AppText color="muted" style={{ marginTop: 4 }}>{GIVING.intro}</AppText>
      </View>

      <Animated.View entering={FadeInDown.duration(450)}>
        <Card style={{ gap: 4, borderColor: theme.gold }}>
          <AppText variant="h3">{GIVING.verse}</AppText>
          <AppText variant="small" color="goldText">{GIVING.verseRef}</AppText>
        </Card>
      </Animated.View>

      <AppText variant="label" style={{ marginTop: 4 }}>Bank transfer (EFT)</AppText>
      <Card style={{ paddingVertical: 4 }}>
        {rows.map((r, i) => (
          <Pressable
            key={r.key}
            accessibilityRole="button"
            accessibilityLabel={`Copy ${r.label}`}
            onPress={() => copy(r.key, r.value)}
            style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: i < rows.length - 1 ? 1 : 0, borderBottomColor: theme.line }}
          >
            <View style={{ flex: 1 }}>
              <AppText variant="small" color="muted">{r.label}</AppText>
              <AppText variant="bodyStrong" selectable>{r.value}</AppText>
            </View>
            <AppText variant="small" color={copied === r.key ? "tealText" : "goldText"} style={{ fontWeight: "700" }}>
              {copied === r.key ? "Copied" : "Copy"}
            </AppText>
          </Pressable>
        ))}
      </Card>
      <AppText variant="small" color="muted">
        Use your name and cell number as the payment reference so the office can thank you. Tap any line to copy it.
      </AppText>

      <Button label="Share these details" kind="teal" onPress={() => Share.share({ message: summary }).catch(() => {})} />
      <Button label="Ask the office on WhatsApp" kind="ghost" onPress={() => Linking.openURL("https://wa.me/27834834334").catch(() => {})} />
    </Screen>
  );
}
