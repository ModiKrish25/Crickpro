/**
 * SuccessAnimation — Small confirmation animation for successful actions
 *
 * Animation pattern: Success → Small confirmation animation
 *
 * Shows a brief checkmark or sparkle animation:
 * - Scale-up checkmark with spring
 * - Subtle glow pulse
 * - Auto-dismisses after animation
 * - Haptic feedback on show
 * - Minimal, non-intrusive
 */
import { useEffect, useCallback } from "react";
import { View, Text, Platform, Dimensions } from "react-native";
import { useThemeContext } from "@/lib/theme-provider";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
  interpolate,
} from "react-native-reanimated";

export type SuccessVariant = "checkmark" | "sparkle" | "star" | "save" | "complete";

export interface SuccessAnimationProps {
  /** Whether the animation is visible */
  visible: boolean;
  /** Animation variant */
  variant?: SuccessVariant;
  /** Message to show beneath the icon */
  message?: string;
  /** Duration in ms before auto-dismiss */
  duration?: number;
  /** Called when animation completes (including dismiss) */
  onComplete?: () => void;
  /** Size of the icon */
  size?: "sm" | "md" | "lg";
}

const ICON_MAP: Record<SuccessVariant, string> = {
  checkmark: "✓",
  sparkle: "✦",
  star: "⭐",
  save: "💾",
  complete: "✅",
};

const SIZE_MAP = {
  sm: { icon: 32, fontSize: 18, messageSize: 11, container: 56 },
  md: { icon: 48, fontSize: 26, messageSize: 13, container: 80 },
  lg: { icon: 64, fontSize: 34, messageSize: 15, container: 104 },
};

export function SuccessAnimation({
  visible,
  variant = "checkmark",
  message,
  duration = 1500,
  onComplete,
  size = "md",
}: SuccessAnimationProps) {
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const dims = SIZE_MAP[size];

  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const checkmarkPath = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      opacity.value = 0;
      scale.value = 0;
      return;
    }

    // Haptic feedback
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Container entrance animation
    scale.value = withSequence(
      withTiming(0.8, { duration: 50 }),
      withSpring(1, { damping: 14, stiffness: 220, mass: 0.6 }),
    );

    opacity.value = withTiming(1, { duration: 200 });

    // Icon spring entrance (slightly delayed)
    iconScale.value = withDelay(
      100,
      withSpring(1, { damping: 12, stiffness: 200, mass: 0.5 }),
    );

    // Rotation effect for sparkle variant
    if (variant === "sparkle" || variant === "star") {
      rotation.value = withDelay(
        100,
        withSpring(1, { damping: 10, stiffness: 150, mass: 0.4 }),
      );
    }

    // Glow ring pulse
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.3, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      2,
      true,
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 600 }),
        withTiming(0.1, { duration: 600 }),
      ),
      2,
      true,
    );

    // Auto-dismiss
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });
      if (onComplete) {
        setTimeout(() => runOnJS(onComplete)(), 200);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const iconContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${interpolate(rotation.value, [0, 1], [0, 360])}deg` },
    ],
  }));

  const glowRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  if (!visible) return null;

  const icon = ICON_MAP[variant];
  const color = variant === "complete" ? "#34C759" : "#0066FF";

  return (
    <Animated.View
      className="absolute inset-0 items-center justify-center z-[9999]"
      pointerEvents="box-none"
      style={[
        containerStyle,
        {
          backgroundColor: isDark
            ? "rgba(0,0,0,0.3)"
            : "rgba(255,255,255,0.3)",
          ...(Platform.OS === "web" ? {
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          } : {}),
        },
      ]}
    >
      <View className="items-center gap-3">
        {/* Glow ring */}
        <Animated.View
          className="absolute rounded-full"
          style={[
            glowRingStyle,
            {
              width: dims.container + 20,
              height: dims.container + 20,
              borderWidth: 2,
              borderColor: color,
              backgroundColor: "transparent",
            },
          ]}
        />

        {/* Icon container */}
        <Animated.View
          className="items-center justify-center rounded-full"
          style={[
            iconContainerStyle,
            {
              width: dims.container,
              height: dims.container,
              backgroundColor: isDark ? `${color}25` : `${color}12`,
              shadowColor: color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            },
          ]}
        >
          {/* Checkmark path animation for checkmark variant */}
          {variant === "checkmark" ? (
            <View
              className="items-center justify-center rounded-full"
              style={{
                width: dims.icon,
                height: dims.icon,
                backgroundColor: color,
              }}
            >
              <Text
                style={{
                  fontSize: dims.fontSize,
                  color: "#FFFFFF",
                  fontWeight: "bold",
                }}
              >
                ✓
              </Text>
            </View>
          ) : (
            <Text style={{ fontSize: dims.fontSize }}>{icon}</Text>
          )}
        </Animated.View>

        {/* Message */}
        {message && (
          <Animated.Text
            className="font-semibold text-center"
            style={{
              fontSize: dims.messageSize,
              color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)",
              opacity: opacity,
            }}
          >
            {message}
          </Animated.Text>
        )}
      </View>
    </Animated.View>
  );
}

export default SuccessAnimation;
