/**
 * Scorecard Stack Layout — Handles match scorecard list and detail view.
 */
import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function ScorecardLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === "web" ? "fade" : "slide_from_right",
        animationDuration: 350,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="detail" />
    </Stack>
  );
}
