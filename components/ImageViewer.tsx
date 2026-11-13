import { Image } from "expo-image";
import { Modal, Pressable, ScrollView, StatusBar, useWindowDimensions, View } from "react-native";

import { AppText } from "@/components/ui";

/**
 * Full-screen image viewer. Shows the whole image (never cropped) on a dark
 * background; pinch to zoom on iOS. Tap anywhere or the Close button to dismiss.
 * Core React Native only, so it ships over the air with no new build.
 */
export function ImageViewer({
  uri,
  visible,
  onClose,
  label,
}: {
  uri: string;
  visible: boolean;
  onClose: () => void;
  label?: string;
}) {
  const { width, height } = useWindowDimensions();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.94)" }}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center" }}
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={onClose} accessibilityRole="imagebutton" accessibilityLabel={label ?? "Close image"}>
            <Image source={{ uri }} style={{ width, height: height * 0.85 }} contentFit="contain" accessibilityLabel={label} />
          </Pressable>
        </ScrollView>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={{
            position: "absolute",
            top: 54,
            right: 20,
            minHeight: 44,
            minWidth: 44,
            borderRadius: 22,
            paddingHorizontal: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.18)",
          }}
        >
          <AppText variant="bodyStrong" style={{ color: "#ffffff" }}>Close</AppText>
        </Pressable>
      </View>
    </Modal>
  );
}
