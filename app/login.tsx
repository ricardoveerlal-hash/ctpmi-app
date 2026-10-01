import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Field } from "@/components/form";
import { AppText, Button, Screen } from "@/components/ui";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { normalizeSaMobile } from "@/lib/validatePhone";

export default function Login() {
  const router = useRouter();
  const { setSession } = useSession();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState<string | null>(null);

  async function submit() {
    setError("");
    setNotFound(null);
    const waId = normalizeSaMobile(phone);
    if (!waId) {
      setError("Enter a valid South African mobile number, e.g. 083 123 4567.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.login(waId);
      if (res.found) {
        await setSession({
          waId,
          firstName: res.firstName ?? "",
          fullName: res.fullName ?? "",
          zone: res.zone,
        });
        router.replace("/(tabs)");
      } else {
        setNotFound(waId);
      }
    } catch {
      setError("Couldn't reach the church server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <AppText variant="title">Welcome back</AppText>
      <AppText color="muted">
        Log in with the cell number you registered on WhatsApp or ctpmi.online.
      </AppText>
      <View style={{ height: 6 }} />
      <Field
        label="Cell number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoComplete="tel"
        placeholder="083 123 4567"
        error={error}
        onSubmitEditing={submit}
      />
      <Button label="Log in" onPress={submit} loading={busy} />
      {notFound && (
        <View style={{ gap: 10, marginTop: 8 }}>
          <AppText color="muted">
            We couldn&apos;t find that number. New here? Register in under a minute.
          </AppText>
          <Button
            label="Register"
            kind="teal"
            onPress={() => router.push({ pathname: "/register", params: { waId: notFound } })}
          />
        </View>
      )}
    </Screen>
  );
}
