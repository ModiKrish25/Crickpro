/**
 * GlassPreloader - Premium preloader/loading screen with cricket-themed animation
 * 
 * Design: Apple-inspired glassmorphism with animated cricket ball, 
 * shimmering text effects, and ambient glow particles
 * 
 * Features:
 * - Animated cricket ball with spinning seam
 * - Pulsing glow ring
 * - Loading text with shimmer animation
 * - Ambient particles
 * - Spring entrance/exit animations
 * - Dark/Light mode support
 */
import { View, Text, Platform } from "react-native";
import { useResponsive } from "@/hooks/use-responsive";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useEffect, useMemo } from "react";
import { useThemeContext } from "@/lib/theme-provider";

interface GlassPreloaderProps {
  /** Optional message to display under the loading animation */
  message?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether the preloader is visible */
  visible?: boolean;
  /** Show as fullscreen overlay */
  fullscreen?: boolean;
}

const MESSAGES = [
  "Setting up the pitch...",
  "Preparing the scorecard...",
  "Warming up the players...",
  "Checking the weather...",
  "Tossing the coin...",
  "Loading match data...",
];

export function GlassPreloader({
  message,
  size = "md",
  visible = true,
  fullscreen = false,
}: GlassPreloaderProps) {
  const { colorScheme } = useThemeContext();
  const responsive = useResponsive();
  const isDark = colorScheme === "dark";

  // Ball rotation animation
  const rotation = useSharedValue(0);
  // Ball bounce animation
  const bounce = useSharedValue(0);
  // Ring pulse animation
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.3);
  // Message shimmer
  const shimmerPosition = useSharedValue(-1);
  // Dot animations
  const dot1 = useSharedValue(0.5);
  const dot2 = useSharedValue(0.5);
  const dot3 = useSharedValue(0.5);
  // Particle animations
  const particle1 = useSharedValue(0);
  const particle2 = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    // Continuous rotation
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    // Gentle bounce
    bounce.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    // Ring pulse
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    // Shimmer effect
    shimmerPosition.value = withRepeat(
      withTiming(1.5, {
        duration: 2500,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      false,
    );

    // Loading dots staggered pulse
    dot1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    dot2.value = withRepeat(
      withSequence(
        withDelay(200, withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) })),
        withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    dot3.value = withRepeat(
      withSequence(
        withDelay(400, withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) })),
        withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    // Particle drift
    particle1.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false,
    );
    particle2.value = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [visible]);

  const dot1Style = useAnimatedStyle(() => ({ opacity: dot1.value, transform: [{ scale: dot1.value }] }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dot2.value, transform: [{ scale: dot2.value }] }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dot3.value, transform: [{ scale: dot3.value }] }));

  const ballRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const ballBounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(shimmerPosition.value, [-1, 1.5], [-200, 400]),
    }],
  }));

  const particle1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(particle1.value, [0, 1], [0, -30]) },
      { translateX: interpolate(particle1.value, [0, 1], [0, 15]) },
    ],
    opacity: interpolate(particle1.value, [0, 0.5, 1], [0.2, 0.6, 0.2]),
  }));

  const particle2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(particle2.value, [0, 1], [0, -25]) },
      { translateX: interpolate(particle2.value, [0, 1], [0, -12]) },
    ],
    opacity: interpolate(particle2.value, [0, 0.5, 1], [0.15, 0.5, 0.15]),
  }));

  // Memoize the loading message to prevent flicker on re-renders
  const loadingMessage = useMemo(
    () => message || MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
    [message]
  );

  // Size mappings
  const ballSizes = { sm: 40, md: 56, lg: 72 };
  const ballSize = ballSizes[size];
  const messageFontSize = { sm: 10, md: 12, lg: 14 }[size];

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(300)}
      className={`items-center justify-center ${fullscreen ? "absolute inset-0" : ""}`}
      style={fullscreen ? {
        zIndex: 9999,
        width: responsive.width,
        height: responsive.height,
      } : {}}
    >
      {/* Background blur overlay for fullscreen */}
      {fullscreen && (
        <View
          className="absolute inset-0"
          style={{
            backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.7)",
            ...(Platform.OS === "web" ? {
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
            } : {}),
          }}
        />
      )}

      {/* Glass container */}
      <View
        className={`items-center gap-4 ${fullscreen ? "" : ""}`}
        style={{
          backgroundColor: isDark ? "rgba(20,20,22,0.8)" : "rgba(255,255,255,0.8)",
          borderRadius: 24,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.5)",
          padding: size === "lg" ? 40 : size === "sm" ? 20 : 32,
          ...(Platform.OS === "web" ? {
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          } : {}),
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 24,
          elevation: 12,
        }}
      >
        {/* Animated Cricket Ball */}
        <View className="items-center justify-center" style={{ width: ballSize + 40, height: ballSize + 40 }}>
          {/* Pulsing ring */}
          <Animated.View
            className="absolute rounded-full"
            style={[
              ringStyle,
              {
                width: ballSize + 32,
                height: ballSize + 32,
                borderWidth: 2,
                borderColor: "#0066FF",
                backgroundColor: "transparent",
              },
            ]}
          />
          
          {/* Second ring (delayed) */}
          <Animated.View
            className="absolute rounded-full"
            style={[
              {
                width: ballSize + 16,
                height: ballSize + 16,
                borderWidth: 1.5,
                borderColor: "#34C759",
                opacity: 0.15,
                transform: [{ scale: 1.1 }],
              },
            ]}
            pointerEvents="none"
          />

          {/* Cricket ball */}
          <Animated.View style={[ballBounceStyle]} className="items-center justify-center">
            <Animated.View
              className="items-center justify-center rounded-full"
              style={[
                ballRotationStyle,
                {
                  width: ballSize,
                  height: ballSize,
                  backgroundColor: "#CC0000",
                  shadowColor: "#CC0000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 8,
                },
              ]}
            >
              {/* Ball seam */}
              <View
                className="absolute w-full"
                style={{
                  height: 2,
                  backgroundColor: "#FFFFFF",
                  opacity: 0.6,
                  transform: [{ rotate: "0deg" }],
                }}
              />
              <View
                className="absolute w-full"
                style={{
                  height: 2,
                  backgroundColor: "#FFFFFF",
                  opacity: 0.6,
                  transform: [{ rotate: "90deg" }],
                }}
              />
              {/* Ball center dot */}
              <View
                className="rounded-full"
                style={{
                  width: ballSize * 0.15,
                  height: ballSize * 0.15,
                  backgroundColor: "#FFFFFF",
                  opacity: 0.3,
                }}
              />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Message with shimmer */}
        <View className="overflow-hidden" style={{ borderRadius: 6 }}>
          <Text
            className="font-semibold text-center"
            style={{
              fontSize: messageFontSize,
              color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)",
            }}
          >
            {loadingMessage}
          </Text>
          {/* Shimmer line */}
          <Animated.View
            className="absolute bottom-0 h-[2px]"
            style={[
              shimmerStyle,
              {
                width: 80,
                backgroundColor: "#0066FF",
                opacity: 0.4,
                borderRadius: 1,
              },
            ]}
          />
        </View>

        {/* Loading dots */}
        <View className="flex-row gap-1.5">
          <Animated.View className="rounded-full" style={[{ width: 6, height: 6, backgroundColor: "#0066FF" }, dot1Style]} />
          <Animated.View className="rounded-full" style={[{ width: 6, height: 6, backgroundColor: "#0066FF" }, dot2Style]} />
          <Animated.View className="rounded-full" style={[{ width: 6, height: 6, backgroundColor: "#0066FF" }, dot3Style]} />
        </View>
      </View>

      {/* Ambient particles */}
      {fullscreen && (
        <>
          <Animated.View
            className="absolute rounded-full"
            style={[
              particle1Style,
              {
                width: 4,
                height: 4,
                backgroundColor: "#0066FF",
                opacity: 0.3,
                top: "35%",
                right: "25%",
              },
            ]}
          />
          <Animated.View
            className="absolute rounded-full"
            style={[
              particle2Style,
              {
                width: 3,
                height: 3,
                backgroundColor: "#34C759",
                opacity: 0.25,
                top: "55%",
                left: "20%",
              },
            ]}
          />
        </>
      )}
    </Animated.View>
  );
}
