/**
 * GlassPreloader — Next-Gen Ultra-Premium Futuristic Cricket Preloader
 * 
 * Features:
 * - Dynamic Orbiting Particle Rings & 3D Glowing Cricket Ball
 * - Smooth Scale & Fade Entrance / Exit Transitions
 * - Animated Rotating Status Messages with Shimmer Effect
 * - Neon Holographic Progress Track with Traveling Light Pulse
 * - Pitch Dark Emerald Glassmorphism Card (#050B08 palette)
 */
import React, { useEffect, useState } from "react";
import { View, Text, Platform, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

interface GlassPreloaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  visible?: boolean;
  fullscreen?: boolean;
}

const CRICKET_STATUS_MESSAGES = [
  "⚡ Initializing CricPro Engine...",
  "🏏 Setting up the match pitch...",
  "🪙 Tossing the coin...",
  "📊 Preparing live scorecard...",
  "🔥 Warming up bowlers & batters...",
  "✨ Syncing real-time scoring data...",
];

export function GlassPreloader({
  message,
  size = "md",
  visible = true,
  fullscreen = false,
}: GlassPreloaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  // Reanimated Shared Values
  const spinOuter = useSharedValue(0);
  const spinInner = useSharedValue(360);
  const ballBounce = useSharedValue(0);
  const pulseRing = useSharedValue(1);
  const progressVal = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (!visible) return;

    // Cycle status messages smoothly every 1.5 seconds
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % CRICKET_STATUS_MESSAGES.length);
    }, 1500);

    // Continuous 360-degree rotation (Clockwise)
    spinOuter.value = withRepeat(
      withTiming(360, { duration: 2400, easing: Easing.linear }),
      -1,
      false
    );

    // Continuous 360-degree rotation (Counter-Clockwise)
    spinInner.value = withRepeat(
      withTiming(0, { duration: 1800, easing: Easing.linear }),
      -1,
      false
    );

    // Ball bounce with elastic easing
    ballBounce.value = withRepeat(
      withSequence(
        withTiming(-14, { duration: 500, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) })
      ),
      -1,
      true
    );

    // Radar glow pulse
    pulseRing.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Background ambient glow oscillation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000, easing: Easing.ease }),
        withTiming(0.3, { duration: 1000, easing: Easing.ease })
      ),
      -1,
      true
    );

    // Neon progress track sweep
    progressVal.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 300, easing: Easing.linear })
      ),
      -1,
      false
    );

    return () => clearInterval(interval);
  }, [visible]);

  const spinOuterStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinOuter.value}deg` }],
  }));

  const spinInnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinInner.value}deg` }],
  }));

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ballBounce.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseRing.value }],
    opacity: interpolate(pulseRing.value, [1, 1.35], [0.7, 0.1]),
  }));

  const ambientGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressVal.value * 100}%`,
  }));

  const dotGlowStyle = useAnimatedStyle(() => ({
    left: `${progressVal.value * 94}%`,
  }));

  if (!visible) return null;

  const currentMsg = message || CRICKET_STATUS_MESSAGES[messageIndex];

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(250)}
      style={fullscreen ? [styles.fullscreenOverlay, Platform.OS === "web" ? { position: "fixed" as any } : {}] : styles.inlineContainer}
    >
      {/* Ambient Emerald Backdrop Glow */}
      <Animated.View style={[styles.ambientGlow, ambientGlowStyle]} />

      {/* Futuristic Pitch Dark Glass Card */}
      <View style={styles.glassCard}>
        {/* Animated Cricket Hologram Orbit Area */}
        <View style={styles.animationArea}>
          {/* Pulsing Radar Ring */}
          <Animated.View style={[styles.radarRing, pulseStyle]} />

          {/* Outer Orbit Ring with Light Particles */}
          <Animated.View style={[styles.outerOrbit, spinOuterStyle]}>
            <View style={styles.orbitNode1} />
            <View style={styles.orbitNode2} />
          </Animated.View>

          {/* Inner Counter-Rotating Orbit Ring */}
          <Animated.View style={[styles.innerOrbit, spinInnerStyle]}>
            <View style={styles.innerOrbitNode} />
          </Animated.View>

          {/* Bouncing Core Leather Cricket Ball */}
          <Animated.View style={[bounceStyle]}>
            <View style={styles.cricketBall}>
              <View style={styles.ballSeamMain} />
              <View style={styles.ballSeamSecondary} />
              <View style={styles.ballGlowCenter} />
            </View>
          </Animated.View>
        </View>

        {/* Dynamic Status Text & Brand Subtitle */}
        <View style={styles.textContainer}>
          <Text style={styles.messageText}>{currentMsg}</Text>
          <View style={styles.subtextWrapper}>
            <View style={styles.liveIndicatorDot} />
            <Text style={styles.brandSubtext}>CRICKPRO REALTIME ENGINE</Text>
          </View>
        </View>

        {/* Neon Holographic Progress Bar Track */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
          <Animated.View style={[styles.progressGlowDot, dotGlowStyle]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullscreenOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(5, 11, 8, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99999,
  },
  inlineContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ambientGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(16, 185, 129, 0.22)",
    filter: Platform.OS === "web" ? ("blur(40px)" as any) : undefined,
  },
  glassCard: {
    backgroundColor: "#0B1511",
    borderWidth: 1.5,
    borderColor: "rgba(16, 185, 129, 0.35)",
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 28,
    alignItems: "center",
    width: 290,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  animationArea: {
    width: 90,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  radarRing: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  outerOrbit: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: "rgba(16, 185, 129, 0.4)",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  orbitNode1: {
    position: "absolute",
    top: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowRadius: 6,
    shadowOpacity: 0.9,
  },
  orbitNode2: {
    position: "absolute",
    bottom: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },
  innerOrbit: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  innerOrbitNode: {
    position: "absolute",
    left: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F59E0B",
  },
  cricketBall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#991B1B",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  ballSeamMain: {
    position: "absolute",
    width: "100%",
    height: 2,
    backgroundColor: "#FFFFFF",
    opacity: 0.9,
  },
  ballSeamSecondary: {
    position: "absolute",
    height: "100%",
    width: 2,
    backgroundColor: "#FFFFFF",
    opacity: 0.9,
  },
  ballGlowCenter: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    opacity: 0.5,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  messageText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subtextWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  brandSubtext: {
    color: "#10B981",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  progressTrack: {
    width: "100%",
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 3,
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 3,
  },
  progressGlowDot: {
    position: "absolute",
    top: -1,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#FFFFFF",
    shadowColor: "#10B981",
    shadowRadius: 6,
    shadowOpacity: 1,
  },
});
