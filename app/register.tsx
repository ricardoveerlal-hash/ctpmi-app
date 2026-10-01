import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Field } from "@/components/form";
import { AppText, Button, Chip, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { MONTHS, ZONES } from "@/lib/constants";
import { useSession } from "@/lib/session";

export default function Register() {
  const router = useRouter();
  const { waId } = useLocalSearchParams<{ waId?: string }>();
  const { setSession } = useSession();

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

  async function submit() {
    if (!waId) {
      router.replace("/login");
      return;
    }
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "First name is required.";
    const d = parseInt(day, 10);
    if (!d || d < 1 || d > 31) e.day = "Enter a day from 1 to 31.";
    if (!month) e.month = "Pick your birth month.";
    if (member === null) e.member = "Tell us if you are a CTPMI member.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setBusy(true);
    setFormError("");
    try {
      const res = await api.register({
        wa_id: waId,
        firstName: firstName.trim(),
        surname: surname.trim() || undefined,
        zone: zone || undefined,
        email: email.trim() || undefined,
        isCtpmiMember: member === true,
        birthDay: d,
        birthMonth: month,
      });
      if (!res.success) {
        setFormError(res.error ?? "Registration failed. Please try again.");
        return;
      }
      await setSession({
        waId,
        firstName: firstName.trim(),
        fullName: res.fullName ?? `${firstName.trim()} ${surname.trim()}`.trim(),
        zone: zone || undefined,
      });
      router.replace("/(tabs)");
    } catch {
      setFormError("Couldn't reach the church server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <AppText variant="title">Join CTPMI</AppText>
      <AppText color="muted">A few details so your pastors can look after you.</AppText>

      <Field label="First name" value={firstName} onChangeText={setFirstName} error={errors.firstName} autoComplete="given-name" />
      <Field label="Surname" value={surname} onChangeText={setSurname} autoComplete="family-name" />
      <Field label="Email (optional)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />

      <View style={{ gap: 8 }}>
        <AppText variant="small" color="muted">Your zone</AppText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {ZONES.map((z) => (
            <Chip key={z} label={z} selected={zone === z} onPress={() => setZone(zone === z ? "" : z)} />
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
        {!!errors.month && <AppText variant="small" color="redText">{errors.month}</AppText>}
      </View>

      {!!formError && <AppText color="redText">{formError}</AppText>}
      <Button label="Create my account" onPress={submit} loading={busy} />
    </Screen>
  );
}
