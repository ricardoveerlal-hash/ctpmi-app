import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Field } from "@/components/form";
import { AppText, Button, Card, Chip, Screen } from "@/components/ui";
import { api, type PrayerRequestType } from "@/lib/api";
import { ZONES } from "@/lib/constants";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";

const WHATSAPP = "https://wa.me/27834834334";

// Answers come from the bot's Church FAQ Answers table; this static copy is a
// placeholder until the FAQ is served from the API so the office can edit it.
const FAQS = [
  { q: "Who leads CTPMI?", a: "Senior Pastor Clive Gopaul leads CTPMI. Your zone pastor is your first point of contact for pastoral care." },
  { q: "How do I request anointing oil?", a: "Send a request with your name and zone to the church office and they will arrange it for you." },
  { q: "What do I do in an emergency?", a: "Call 10177 or 112 first. Then contact your zone pastor or the church office so we can support you." },
];

const TYPES: PrayerRequestType[] = ["Prayer Request", "Home Visit", "Pastoral Care", "Item Request", "Church Visit"];

export default function Help() {
  const { theme } = useTheme();
  const { session } = useSession();
  const [open, setOpen] = useState(-1);

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<PrayerRequestType>("Prayer Request");
  const [member, setMember] = useState<"Yes" | "No">("Yes");
  const [zone, setZone] = useState(session?.zone ?? "");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!session) return;
    if (!zone || !text.trim()) {
      setError("Please choose your zone and tell us how we can pray with you.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.sendPrayerRequest({
        request_type: type,
        ctpmi_member: member,
        full_name: session.fullName || session.firstName,
        cell_number: "0" + session.waId.slice(2),
        zone,
        prayer_request: text.trim(),
      });
      setSent(true);
      setText("");
    } catch {
      setError("Sorry, something went wrong sending that. Please try again, or WhatsApp us.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <AppText variant="title">Help</AppText>

      <Card style={{ gap: 12 }}>
        <Pressable accessibilityRole="button" onPress={() => { setShowForm((s) => !s); setSent(false); }} style={{ minHeight: 44, justifyContent: "center" }}>
          <AppText variant="h3">Prayer and pastoral requests</AppText>
          <AppText variant="small" color="muted">A pastor from your zone will follow up.</AppText>
        </Pressable>
        {showForm && !sent && (
          <Animated.View entering={FadeIn.duration(300)} style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {TYPES.map((t) => <Chip key={t} label={t} selected={type === t} onPress={() => setType(t)} />)}
            </View>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <AppText variant="small" color="muted">CTPMI member?</AppText>
              <Chip label="Yes" selected={member === "Yes"} onPress={() => setMember("Yes")} />
              <Chip label="No" selected={member === "No"} onPress={() => setMember("No")} />
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {ZONES.map((z) => <Chip key={z} label={z} selected={zone === z} onPress={() => setZone(z)} />)}
            </View>
            <Field label="How can we pray with you?" value={text} onChangeText={setText} multiline />
            {!!error && <AppText color="redText">{error}</AppText>}
            <Button label="Send request" onPress={send} loading={busy} />
          </Animated.View>
        )}
        {sent && (
          <Animated.View entering={FadeIn.duration(400)}>
            <AppText variant="h3" color="tealText">Thank you 🙏</AppText>
            <AppText color="muted">Your request has been sent to our Pastoralship team.</AppText>
          </Animated.View>
        )}
      </Card>

      <View>
        <AppText variant="label" style={{ marginBottom: 4 }}>Common questions</AppText>
        {FAQS.map((f, i) => (
          <View key={f.q} style={{ borderBottomWidth: 1, borderBottomColor: theme.line }}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: open === i }} onPress={() => setOpen(open === i ? -1 : i)} style={{ minHeight: 52, justifyContent: "center" }}>
              <AppText variant="bodyStrong">{f.q}</AppText>
            </Pressable>
            {open === i && (
              <Animated.View entering={FadeIn.duration(300)}>
                <AppText color="muted" style={{ paddingBottom: 14 }}>{f.a}</AppText>
              </Animated.View>
            )}
          </View>
        ))}
      </View>

      <Button label="Chat with us on WhatsApp" kind="teal" onPress={() => Linking.openURL(WHATSAPP)} />
      <Button label="Emergency: call 10177" kind="danger" onPress={() => Linking.openURL("tel:10177")} />
    </Screen>
  );
}
