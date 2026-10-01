import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Linking, Platform, Pressable, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { AppText, Button, Card, Chip, Screen } from "@/components/ui";
import {
  CONTACT,
  FACEBOOK_URL,
  LOCATIONS,
  SERVICES,
  SOCIALS,
  clock,
  dayWord,
  isCommunion,
  nextOccurrence,
  nextService,
  type CtaAction,
} from "@/lib/schedule";
import { useTheme } from "@/lib/theme";

type Filter = "all" | "in" | "online";

function open(url: string) {
  Linking.openURL(url).catch(() => {});
}

function directions(address: string) {
  const q = encodeURIComponent(`${address}, South Africa`);
  open(Platform.OS === "ios" ? `http://maps.apple.com/?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`);
}

function Sym({ ios, android, color, size = 22 }: { ios: string; android: string; color: string; size?: number }) {
  return <SymbolView name={{ ios, android, web: android } as never} tintColor={color} size={size} />;
}

export default function Church() {
  const { theme } = useTheme();
  const router = useRouter();
  const now = useMemo(() => new Date(), []);
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [locIdx, setLocIdx] = useState(0);

  const next = nextService(now);
  const loc = LOCATIONS[locIdx];
  const list = SERVICES.filter((s) => filter === "all" || (filter === "online") === s.online);

  function runCta(action: CtaAction) {
    if (action === "directions") directions(LOCATIONS[0].address);
    else if (action === "facebook") open(FACEBOOK_URL);
    else open(SOCIALS[2].url);
  }

  const contacts = [
    { title: "Call the office", value: CONTACT.phoneDisplay, url: CONTACT.phoneUrl, ios: "phone.fill", android: "call" },
    { title: "WhatsApp", value: CONTACT.whatsappDisplay, url: CONTACT.whatsappUrl, ios: "message.fill", android: "chat" },
    { title: "Email", value: CONTACT.email, url: `mailto:${CONTACT.email}`, ios: "envelope.fill", android: "mail" },
  ];

  return (
    <Screen>
      <View>
        <AppText variant="small" color="muted">Overport, Durban · Since 1991</AppText>
        <AppText variant="title">Visit CTPMI</AppText>
      </View>

      <Animated.View entering={FadeInDown.duration(500)}>
        <LinearGradient
          colors={[theme.teal, "#127a70"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 18, padding: 16, gap: 4 }}
        >
          <AppText variant="label" color="onAccent">Next up</AppText>
          <AppText variant="title" color="onAccent">{next.service.title}</AppText>
          <AppText variant="bodyStrong" color="onAccent">
            {dayWord(next.at, now)} · {clock(next.at)}
          </AppText>
          {next.service.cta && (
            <View style={{ marginTop: 10, alignSelf: "flex-start" }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => runCta(next.service.cta!.action)}
                style={{ minHeight: 44, borderRadius: 12, backgroundColor: "#050d1a", paddingHorizontal: 18, justifyContent: "center" }}
              >
                <AppText variant="bodyStrong" style={{ color: "#ffffff" }}>{next.service.cta.label}</AppText>
              </Pressable>
            </View>
          )}
        </LinearGradient>
      </Animated.View>

      <AppText variant="label" style={{ marginTop: 6 }}>Service times</AppText>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Chip label="All" selected={filter === "all"} onPress={() => setFilter("all")} />
        <Chip label="In person" selected={filter === "in"} onPress={() => setFilter("in")} />
        <Chip label="Online" selected={filter === "online"} onPress={() => setFilter("online")} />
      </View>

      <Card style={{ paddingVertical: 4 }}>
        {list.map((s, i) => {
          const at = nextOccurrence(s.slots, now);
          const isOpen = expanded === s.id;
          const today = dayWord(at, now);
          const badge = s.online ? "Online" : isCommunion(at) && s.id === "sunday" ? "Communion Sunday" : today === "Today" || today === "Tonight" ? today : "";
          return (
            <View key={s.id} style={{ borderBottomWidth: i < list.length - 1 ? 1 : 0, borderBottomColor: theme.line }}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                onPress={() => setExpanded(isOpen ? null : s.id)}
                style={{ minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 }}
              >
                <View style={{ width: 60, borderRadius: 10, paddingVertical: 9, backgroundColor: "rgba(217,169,78,0.14)", alignItems: "center" }}>
                  <AppText variant="small" color="goldText" style={{ fontWeight: "700", letterSpacing: 0.5 }}>{s.days}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">{s.title}</AppText>
                  <AppText variant="small" color="muted">{s.time}</AppText>
                </View>
                {!!badge && (
                  <View style={{ borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: s.online ? "rgba(29,156,144,0.18)" : "rgba(217,169,78,0.18)" }}>
                    <AppText variant="small" color={s.online ? "tealText" : "goldText"} style={{ fontWeight: "700", fontSize: 11 }}>{badge}</AppText>
                  </View>
                )}
                <Sym ios={isOpen ? "chevron.up" : "chevron.down"} android={isOpen ? "expand_less" : "expand_more"} color={theme.muted} size={18} />
              </Pressable>
              {isOpen && (
                <Animated.View entering={FadeIn.duration(250)} style={{ paddingLeft: 72, paddingBottom: 14, gap: 10, alignItems: "flex-start" }}>
                  <AppText variant="small" color="muted">{s.note}</AppText>
                  {s.cta && <Chip label={s.cta.label} onPress={() => runCta(s.cta!.action)} />}
                </Animated.View>
              )}
            </View>
          );
        })}
      </Card>

      <Pressable accessibilityRole="button" onPress={() => open(FACEBOOK_URL)}>
        <Card style={{ flexDirection: "row", alignItems: "center", gap: 14, minHeight: 72 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.teal, alignItems: "center", justifyContent: "center" }}>
            <Sym ios="play.fill" android="play_arrow" color={theme.onAccent} size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="h3">Watching online?</AppText>
            <AppText variant="small" color="muted">Join our services and prayer live on Facebook</AppText>
          </View>
          <Sym ios="chevron.right" android="chevron_right" color={theme.muted} size={18} />
        </Card>
      </Pressable>

      <AppText variant="label" style={{ marginTop: 6 }}>Find us</AppText>
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {LOCATIONS.map((l, i) => (
            <Chip key={l.key} label={l.label} selected={locIdx === i} onPress={() => setLocIdx(i)} />
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Sym ios="mappin.circle.fill" android="location_on" color={theme.goldText} size={30} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">{loc.label}</AppText>
            <AppText variant="small" color="muted">{loc.address}</AppText>
          </View>
        </View>
        <Button label="Get directions" kind="teal" onPress={() => directions(loc.address)} />
      </Card>

      <AppText variant="label" style={{ marginTop: 6 }}>Church office</AppText>
      <Card style={{ paddingVertical: 4 }}>
        {contacts.map((c, i) => (
          <Pressable
            key={c.title}
            accessibilityRole="button"
            onPress={() => open(c.url)}
            style={{ minHeight: 60, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: i < contacts.length - 1 ? 1 : 0, borderBottomColor: theme.line }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(29,156,144,0.18)", alignItems: "center", justifyContent: "center" }}>
              <Sym ios={c.ios} android={c.android} color={theme.tealText} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{c.title}</AppText>
              <AppText variant="small" color="muted">{c.value}</AppText>
            </View>
            <Sym ios="chevron.right" android="chevron_right" color={theme.muted} size={16} />
          </Pressable>
        ))}
        <AppText variant="small" color="muted" style={{ paddingVertical: 10 }}>Office hours: {CONTACT.hours}</AppText>
      </Card>

      <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/give")}>
        <Card style={{ flexDirection: "row", alignItems: "center", gap: 14, minHeight: 72, borderColor: theme.gold }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.gold, alignItems: "center", justifyContent: "center" }}>
            <Sym ios="heart.fill" android="favorite" color={theme.onAccent} size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="h3">Give</AppText>
            <AppText variant="small" color="muted">Tithes, offerings and banking details</AppText>
          </View>
          <Sym ios="chevron.right" android="chevron_right" color={theme.muted} size={18} />
        </Card>
      </Pressable>

      <AppText variant="label" style={{ marginTop: 6 }}>About CTPMI</AppText>
      <Card style={{ gap: 10 }}>
        <AppText variant="h2">A non-denominational church built on prayer</AppText>
        <AppText color="muted">
          Reaching the city, the nation and the nations of the world through prayer and the gospel of Jesus Christ. Led by
          Senior Pastors Clive and Sandra Gopaul since 1991.
        </AppText>
      </Card>

      <AppText variant="label" style={{ marginTop: 6 }}>Follow us</AppText>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {SOCIALS.map((s) => (
          <Chip key={s.label} label={s.label} onPress={() => open(s.url)} />
        ))}
      </View>
    </Screen>
  );
}
