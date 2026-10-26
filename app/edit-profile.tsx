import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";

import { Field } from "@/components/form";
import { AppText, Button, Chip, ErrorBlock, LoadingBlock, Screen, useAsync } from "@/components/ui";
import { api } from "@/lib/api";
import { MONTHS, ZONES } from "@/lib/constants";
import { useSession } from "@/lib/session";

export default function EditProfile() {
  const router = useRouter();
  const { session, setSession } = useSession();
  const waId = session?.waId ?? "";
  const profile = useAsync(() => api.getProfile(waId), [waId]);
  const p = profile.data;

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [zone, setZone] = useState("");
  const [member, setMember] = useState<boolean | null>(null);
  const [day, setDay] = useState("");
  const [month, setMonth] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const filled = useRef(false);

  // Fill the form once, from the saved profile.
  useEffect(() => {
    if (!p?.found || filled.current) return;
    filled.current = true;
    setFirstName(p.firstName ?? "");
    setSurname(p.surname ?? "");
    setEmail(p.email ?? "");
    setZone(p.zone ?? "");
    setMember(p.isCtpmiMember === undefined ? null : p.isCtpmiMember);
    setDay(p.birthDay ? String(p.birthDay) : "");
    setMonth(p.birthMonth ?? 0);
  }, [p]);

  async function save() {
    const e: Record<string, string> = {};
    if (firstName.trim().length < 2) e.firstName = "Enter your first name.";
    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) e.email = "That email doesn't look right.";
    const d = day ? parseInt(day, 10) : 0;
    if (day && (!d || d < 1 || d > 31)) e.day = "Enter a day from 1 to 31.";
    if ((d && !month) || (!d && month)) e.day = e.day ?? "Set both the day and the month, or leave both as they are.";
    if (member === null) e.member = "Tell us if you are a CTPMI member.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    setFormError("");
    try {
      const res = await api.updateProfile({
        wa_id: waId,
        firstName: firstName.trim(),
        surname: surname.trim() || undefined,
        zone: zone || undefined,
        email: trimmedEmail || undefined,
        isCtpmiMember: member === true,
        birthDay: d || undefined,
        birthMonth: month || undefined,
      });
      if (!res.success) {
        setFormError(res.error ?? "Couldn't save your changes. Please try again.");
        return;
      }
      await setSession({
        waId,
        firstName: firstName.trim(),
        fullName: res.fullName ?? `${firstName.trim()} ${surname.trim()}`.trim(),
        zone: zone || session?.zone,
      });
      router.back();
    } catch {
      setFormError("Couldn't reach the church server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen toggle={false}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ minHeight: 44, justifyContent: "center" }}>
        <AppText color="goldText">{"\u2039 Back"}</AppText>
      </Pressable>
      <AppText variant="title">Edit my details</AppText>

      {profile.loading && !p && <LoadingBlock label="Loading your details" />}
      {profile.error && <ErrorBlock message="Couldn't load your details." onRetry={profile.reload} />}

      {p?.found && (
        <>
          <Field label="First name" value={firstName} onChangeText={setFirstName} error={errors.firstName} autoComplete="given-name" />
          <Field label="Surname" value={surname} onChangeText={setSurname} autoComplete="family-name" />
          <Field label="Email" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />

          <View style={{ gap: 8 }}>
            <AppText variant="small" color="muted">Your zone</AppText>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {ZONES.map((z) => (
                <Chip key={z} label={z} selected={zone === z} onPress={() => setZone(z)} />
              ))}
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <AppText variant="small" color="muted">Are you a CTPMI member?</AppText>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Chip label="Yes" selected={member === true} onPress={() => setMember(true)} />
              <Chip label="No" selected={member === false} onPress={() => setMember(false)} />
            </View>
            {!!errors.member && <AppText variant="small" color="redText">{errors.member}</AppText>}
          </View>

          <Field label="Birth day" value={day} onChangeText={setDay} keyboardType="number-pad" maxLength={2} error={errors.day} />
          <View style={{ gap: 8 }}>
            <AppText variant="small" color="muted">Birth month</AppText>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {MONTHS.map((m, i) => (
                <Chip key={m} label={m.slice(0, 3)} selected={month === i + 1} onPress={() => setMonth(i + 1)} />
              ))}
            </View>
          </View>

          <AppText variant="small" color="muted">
            Your cell number is what you log in with, so it can&apos;t be changed here. To change it, message the church office on WhatsApp.
          </AppText>

          {!!formError && <AppText color="redText">{formError}</AppText>}
          <Button label="Save changes" onPress={save} loading={busy} />
        </>
      )}
    </Screen>
  );
}
