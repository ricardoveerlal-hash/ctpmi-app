import { TextInput, View, type TextInputProps } from "react-native";

import { fonts, useTheme } from "@/lib/theme";
import { AppText } from "./ui";

export function Field({
  label,
  error,
  multiline,
  ...input
}: TextInputProps & { label: string; error?: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="small" color="muted">
        {label}
      </AppText>
      <TextInput
        {...input}
        multiline={multiline}
        accessibilityLabel={label}
        placeholderTextColor={theme.muted}
        style={{
          minHeight: multiline ? 110 : 50,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 0,
          textAlignVertical: multiline ? "top" : "center",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: error ? theme.red : theme.line,
          backgroundColor: theme.card,
          color: theme.ink,
          fontFamily: fonts.body,
          fontSize: 16,
        }}
      />
      {!!error && (
        <AppText variant="small" color="redText">
          {error}
        </AppText>
      )}
    </View>
  );
}
