/**
 * GlassPreloader - Premium preloader with high-energy animated cricket graphics
 * 
 * Features:
 * - Animated spinning & bouncing red cricket ball with white seam
 * - Pulsing emerald and blue glow rings
 * - Shimmering loading message with animated progress bar
 * - Multi-platform support (Web CSS Keyframes + Reanimated)
 */
import React, { useEffect } from "react";
import { View, Text, Platform, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";

interface GlassPreloaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  visible?: boolean;
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
  message = "Setting up the pitch...",
  size = "md",
  visible = true,
  fullscreen = false,
}: GlassPreloaderProps) {
  // Shared values for continuous animations
  const spin = useSharedValue(0);
  const bounce = useSharedValue(0);
  const pulse = useSharedValue(1);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    // Ball spin
    spin.value = withRepeat(
      withTiming(360, { duration: 1800, easing: Easing.linear }),
      -1,
      false
    );

    // Ball bounce
    bounce.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 450, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 450, easing: Easing.in(Easing.quad) })
      ),
      -1,
      true
    );

    // Glow pulse
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Loading bar fill
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 200, easing: Easing.linear })
      ),
      -1,
      false
    );
  }, [visible]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.25], [0.6, 0.2]),
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (!visible) return null;

  return (
    <View
      style={fullscreen ? [styles.fullscreenOverlay, Platform.OS === "web" ? { position: "fixed" as any } : {}] : styles.inlineContainer}
    >
      {/* Dark Frosted Glass Container */}
      <View style={styles.glassCard}>
        {/* Animated Cricket Ball & Ring Area */}
        <View style={styles.animationArea}>
          {/* Pulsing Outer Emerald Ring */}
          <Animated.View style={[styles.pulseRing, pulseStyle]} />

          {/* Bouncing & Spinning Red Cricket Ball */}
          <Animated.View style={[bounceStyle]}>
            <Animated.View style={[styles.cricketBall, spinStyle]}>
              {/* Ball Seam Lines */}
              <View style={styles.ballSeamHorizontal} />
              <View style={styles.ballSeamVertical} />
              <View style={styles.ballCoreDot} />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Loading Message */}
        <View style={styles.textContainer}>
          <Text style={styles.messageText}>{message}</Text>
          <Text style={styles.brandSubtext}>CRICKPRO ENGINE</Text>
        </View>

        {/* Animated Emerald Progress Bar */}
        <View style={styles.progressBarBackground}>
          <Animated.View style={[styles.progressBarFill, progressStyle]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreenOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(5, 11, 8, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99999,
  },
  inlineContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  glassCard: {
    backgroundColor: "#0B1511",
    borderWidth: 1.5,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 24,
    alignItems: "center",
    minWidth: 260,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
  },
  animationArea: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  pulseRing: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  cricketBall: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#B91C1C",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  ballSeamHorizontal: {
    position: "absolute",
    width: "100%",
    height: 2,
    backgroundColor: "#FFFFFF",
    opacity: 0.8,
  },
  ballSeamVertical: {
    position: "absolute",
    height: "100%",
    width: 2,
    backgroundColor: "#FFFFFF",
    opacity: 0.8,
  },
  ballCoreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    opacity: 0.4,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  messageText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  brandSubtext: {
    color: "#10B981",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  progressBarBackground: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 2,
  },
});
