import { router } from "expo-router";
import { Paper, PillButton, Text, space } from "@/theme";
import { View } from "react-native";

export default function WalkingScreen() {
  return (
    <Paper edges={["top", "bottom"]}>
      <View
        style={{
          flex: 1,
          padding: space.xl,
          justifyContent: "center",
          gap: space.lg,
        }}
      >
        <Text variant="title">The iOS walking demo</Text>
        <Text variant="body">
          Open the web preview to try simulated Maps, notification banners and
          the Dynamic Island. This is not live navigation.
        </Text>
        <PillButton label="Back to Sidequest" onPress={() => router.back()} />
      </View>
    </Paper>
  );
}
