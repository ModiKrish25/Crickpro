/**
 * LiquidGlassOverlay - Premium liquid glass effect with real-time blur simulation,
 * dynamic reflections, light scattering, and ambient glow.
 * 
 * Features:
 * - Sweeping liquid sheen animation
 * - Dynamic reflections with refraction simulation
 * - Ambient light scattering particles
 * - Corner glow accents
 * - GPU-accelerated 60fps animations via Reanimated
 * - Works cross-platform (web + native)
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
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";

interface LiquidGlassOverlayProps {
  /** Primary accent color */
  color?: string;
  /** Animation speed multiplier (1 = normal) */
  speed?: number;
  /** Whether the overlay is visible */
  visible?: boolean;
  /** Effect variant */
  variant?: "sheen" | "pulse" | "morph" | "refraction";
  /** Intensity of the effect 0-1 */
  intensity?: number;
}

export function LiquidGlassOverlay({
  color,
  speed = 1,
  visible = true,
  variant = "sheen",
  intensity = 1,
}: LiquidGlassOverlayProps) {
  const colors = useColors();
  const primaryColor = color || colors.primary;
  const normalizedSpeed = Math.max(0.1, speed);

  // Animation shared values
  const sheenPosition = useSharedValue(-0.4);
  const refractionAngle = useSharedValue(0);
  const ambientGlow = useSharedValue(0.3);
  const particleDrift = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    switch (variant) {
      case "sheen":
        sheenPosition.value = withRepeat(
          withTiming(1.5, {
            duration: 3000 / normalizedSpeed,
            easing: Easing.inOut(Easing.sin),
          }),
          -1,
          false,
        );
        break;

      case "pulse":
        ambientGlow.value = withRepeat(
          withSequence(
            withTiming(0.6 * intensity, {
              duration: 1800 / normalizedSpeed,
              easing: Easing.inOut(Easing.sin),
            }),
            withTiming(0.15 * intensity, {
              duration: 1800 / normalizedSpeed,
              easing: Easing.inOut(Easing.sin),
            }),
          ),
          -1,
          true,
        );
        break;

      case "refraction":
        refractionAngle.value = withRepeat(
          withTiming(1, {
            duration: 4000 / normalizedSpeed,
            easing: Easing.inOut(Easing.cubic),
          }),
          -1,
          true,
        );
        break;

      case "morph":
        sheenPosition.value = withRepeat(
          withTiming(1.5, {
            duration: 2500 / normalizedSpeed,
            easing: Easing.inOut(Easing.sin),
          }),
          -1,
          false,
        );
        ambientGlow.value = withRepeat(
          withTiming(0.5, {
            duration: 2000 / normalizedSpeed,
            easing: Easing.inOut(Easing.sin),
          }),
          -1,
          true,
        );
        break;
    }

    // Subtle particle drift for all variants
    particleDrift.value = withRepeat(
      withTiming(1, {
        duration: 8000 / normalizedSpeed,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [visible, variant, normalizedSpeed, intensity]);

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          sheenPosition.value,
          [-0.4, 1.5],
          [-180, 500],
        ),
      },
      { skewX: "-25deg" },
    ],
  }));

  const refractionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(refractionAngle.value, [0, 0.5, 1], [0.4, 0.8, 0.4]),
    transform: [
      {
        translateX: interpolate(refractionAngle.value, [0, 1], [-5, 5]),
      },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: ambientGlow.value,
  }));

  const particleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(particleDrift.value, [0, 1], [0, -20]),
      },
      {
        translateX: interpolate(particleDrift.value, [0, 1], [0, 10]),
      },
    ],
    opacity: interpolate(particleDrift.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  if (!visible) return null;

  return (
    <View className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      {/* Base ambient layer */}
      <Animated.View
        className="absolute inset-0"
        style={[{ backgroundColor: `${primaryColor}06` }, glowStyle]}
      />

      {/* Refraction distortion layer */}
      {variant === "refraction" && (
        <Animated.View
          className="absolute inset-0"
          style={[
            refractionStyle,
            {
              backgroundColor: `${primaryColor}04`,
              borderRadius: 999,
            },
          ]}
        />
      )}

      {/* Sheen highlight stripe */}
      {(variant === "sheen" || variant === "morph") && (
        <Animated.View
          className="absolute top-0 bottom-0"
          style={[
            sheenStyle,
            {
              left: 0,
              width: 120,
              backgroundColor: `rgba(255,255,255,${0.08 * intensity})`,
            },
          ]}
        />
      )}

      {/* Secondary sheen for morph variant */}
      {variant === "morph" && (
        <Animated.View
          className="absolute top-0 bottom-0"
          style={[
            sheenStyle,
            {
              left: -60,
              width: 60,
              backgroundColor: `${primaryColor}06`,
              transform: [{ skewX: "15deg" }],
            },
          ]}
        />
      )}

      {/* Light scattering particles */}
      <Animated.View
        className="absolute top-[15%] right-[20%] w-2 h-2 rounded-full"
        style={[
          particleStyle,
          { backgroundColor: `${primaryColor}20` },
        ]}
      />
      <Animated.View
        className="absolute top-[60%] right-[10%] w-1.5 h-1.5 rounded-full"
        style={[
          particleStyle,
          { backgroundColor: `${primaryColor}15` },
        ]}
      />

      {/* Corner glow accents */}
      <View
        className="absolute -top-12 -right-12 w-24 h-24 rounded-full"
        style={{
          backgroundColor: `${primaryColor}12`,
          opacity: 0.6 * intensity,
        }}
      />
      <View
        className="absolute -bottom-10 -left-10 w-20 h-20 rounded-full"
        style={{
          backgroundColor: `${primaryColor}08`,
          opacity: 0.4 * intensity,
        }}
      />

      {/* Dynamic reflection line */}
      <View
        className="absolute top-0 left-[30%] right-[30%] h-[1px]"
        style={{
          backgroundColor: `rgba(255,255,255,${0.15 * intensity})`,
        }}
      />
    </View>
  );
}
