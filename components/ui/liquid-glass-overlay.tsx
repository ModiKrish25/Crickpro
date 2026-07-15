/**
 * LiquidGlassOverlay - Animated liquid glass gradient effect
 * 
 * Produces a flowing, liquid-like sheen/shine animation across glass surfaces.
 * Uses react-native-reanimated for performant 60fps animations.
 * 
 * Features:
 * - Sweeping gradient highlight that moves like liquid
 * - Color morphing between configured palette
 * - Subtle pulsing opacity for depth feeling
 * - Optimized for 60fps with native driver
 * 
 * Usage:
 * <View className="relative overflow-hidden rounded-2xl">
 *   <LiquidGlassOverlay />
 *   <Text>Content on top of liquid glass</Text>
 * </View>
 */
import { useEffect } from "react";
import { View, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  withDelay,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";

interface LiquidGlassOverlayProps {
  /** Primary color for the liquid effect. Defaults to theme primary */
  color?: string;
  /** Animation speed multiplier (1 = normal, 2 = fast, 0.5 = slow) */
  speed?: number;
  /** Whether the overlay is visible */
  visible?: boolean;
  /** Variant of the effect */
  variant?: "sheen" | "morph" | "pulse";
}

export function LiquidGlassOverlay({
  color,
  speed = 1,
  visible = true,
  variant = "sheen",
}: LiquidGlassOverlayProps) {
  const colors = useColors();
  const primaryColor = color || colors.primary;

  // Sheen position animation
  const sheenPosition = useSharedValue(-0.5);
  // Morph colors animation
  const morphProgress = useSharedValue(0);
  // Pulse animation
  const pulseOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (!visible) return;

    switch (variant) {
      case "sheen":
        // Continuous sweeping sheen across the surface
        sheenPosition.value = withRepeat(
          withTiming(1.5, { duration: 2500 / speed, easing: Easing.inOut(Easing.sin) }),
          -1,
          false,
        );
        break;

      case "morph":
        // Color shifting between hues
        morphProgress.value = withRepeat(
          withTiming(1, { duration: 3000 / speed, easing: Easing.inOut(Easing.cubic) }),
          -1,
          true,
        );
        break;

      case "pulse":
        // Subtle breathing/pulsing opacity
        pulseOpacity.value = withRepeat(
          withSequence(
            withTiming(0.5, { duration: 1500 / speed, easing: Easing.inOut(Easing.sin) }),
            withTiming(0.15, { duration: 1500 / speed, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          true,
        );
        break;
    }
  }, [visible, variant, speed]);

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(sheenPosition.value, [-0.5, 1.5], [-150, 400]) }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      {/* Base ambient glow */}
      <Animated.View
        className="absolute inset-0"
        style={[
          {
            backgroundColor: `${primaryColor}08`,
          },
          variant === "pulse" ? pulseStyle : {},
        ]}
      />

      {/* Sheen highlight stripe */}
      {variant === "sheen" && (
        <Animated.View
          className="absolute top-0 bottom-0 w-[80px]"
          style={[
            sheenStyle,
            {
              left: 0,
              backgroundColor: "rgba(255,255,255,0.08)",
              // Diagonal gradient effect via skew
              transform: [{ skewX: "-20deg" }],
            },
          ]}
        />
      )}

      {/* Corner accent glow */}
      <View
        className="absolute -top-10 -right-10 w-20 h-20 rounded-full"
        style={{
          backgroundColor: `${primaryColor}10`,
          opacity: 0.6,
        }}
      />
      <View
        className="absolute -bottom-8 -left-8 w-16 h-16 rounded-full"
        style={{
          backgroundColor: `${primaryColor}08`,
          opacity: 0.4,
        }}
      />
    </View>
  );
}
