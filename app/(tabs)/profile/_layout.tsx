/**
 * Profile Stack Layout — Animated transitions for profile sub-screens.
 *
 * Wraps `edit.tsx` and `theme.tsx` in a Stack navigator with:
 * - `slide_from_right` push animation (iOS-style)
 * - `slide_from_left` pop animation for back navigation
 * - Hidden header (custom headers are rendered per-screen)
 * - Gesture-driven swipe-back on iOS
 */
import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === "web" ? "fade" : "slide_from_right",
        animationDuration: 350,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name="edit"
        options={{
          title: "Edit Profile",
          animation: "slide_from_right",
          animationDuration: 350,
        }}
      />
      <Stack.Screen
        name="theme"
        options={{
          title: "Theme & Display",
          animation: "slide_from_right",
          animationDuration: 350,
        }}
      />
    </Stack>
  );
}
