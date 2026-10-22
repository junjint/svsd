import { Text, View } from "react-native";
import { color } from "@/theme/tokens";
/** This product film intentionally targets a web browser, rather than a native app. */
export default function Prototype() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color.paper,
        padding: 32,
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 32, color: color.ink }}>
        A little detour. A better story.
      </Text>
      <Text style={{ fontSize: 16, color: color.ink2, marginTop: 16 }}>
        Open the Sidequest web preview to experience the interactive navigation
        prototype.
      </Text>
    </View>
  );
}
