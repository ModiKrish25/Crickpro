/**
 * CinematicBackground — Stadium atmosphere under floodlights.
 *
 * Renders a dark cinematic backdrop (#050806 → #07120D → #0A1A12)
 * with a subtle radial stadium glow, floating atmospheric particles,
 * and a faint cricket-ground silhouette.
 */
import { View, Platform } from "react-native";
import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

// ─── Colors ──────────────────────────────────────────────────────────────────

const BG_GRADIENT = ["#050806", "#07120D", "#0A1A12"];
const FLOODLIGHT_COLOR = "rgba(183, 255, 62, 0.04)";
const PARTICLE_COLOR = "rgba(183, 255, 62, 0.15)";

// ─── Ambient glow particle ────────────────────────────────────────────────────

function AmbientParticle({ index }: { index: number }) {
  const driftY = useSharedValue(0);
  const driftX = useSharedValue(0);
  const opacity = useSharedValue(0.1);

  useEffect(() => {
    const duration = 4000 + index * 1000;
    driftY.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1, false,
    );
    driftX.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: duration * 0.5, easing: Easing.inOut(Easing.sin) }),
        withTiming(-0.3, { duration: duration * 0.5, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: duration * 0.3, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.05, { duration: duration * 0.7, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(driftY.value, [0, 1], [0, -60]) },
      { translateX: interpolate(driftX.value, [0, 1], [0, 30]) },
    ],
    opacity: opacity.value,
  }));

  const positions = [
    { top: "30%", left: "20%", size: 3 },
    { top: "50%", left: "75%", size: 2 },
    { top: "65%", left: "40%", size: 4 },
    { top: "25%", left: "60%", size: 2.5 },
    { top: "75%", left: "15%", size: 3 },
  ];
  const pos = positions[index % positions.length];

  return (
    <Animated.View
      className="absolute rounded-full"
      style={[
        animatedStyle,
        {
          top: pos.top as any,
          left: pos.left as any,
          width: pos.size,
          height: pos.size,
          backgroundColor: PARTICLE_COLOR,
        },
      ]}
      pointerEvents="none"
    />
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface CinematicBackgroundProps {
  /** Intensity multiplier for the stadium glow (0–1) */
  intensity?: number;
  /** Whether particles should animate */
  showParticles?: boolean;
}

export function CinematicBackground({
  intensity = 1,
  showParticles = true,
}: CinematicBackgroundProps) {
  const reducedMotion = useReducedMotion();
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Slow fade-in of stadium floodlight bloom
    glowOpacity.value = withTiming(1 * intensity, {
      duration: 2000,
      easing: Easing.inOut(Easing.sin),
    });
  }, [intensity]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Web: use CSS background gradients for performance
  if (Platform.OS === "web") {
    return (
      <View
        className="absolute inset-0"
        style={{
          backgroundColor: BG_GRADIENT[0],
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 50% 50%, ${FLOODLIGHT_COLOR} 0%, transparent 70%),
            radial-gradient(ellipse 100% 40% at 50% 100%, rgba(0,0,0,0.4) 0%, transparent 80%)
          `,
        } as any}
        pointerEvents="none"
      >
        {/* Floodlight glow — animated */}
        <Animated.View
          className="absolute inset-0"
          style={[
            glowStyle,
            {
              backgroundImage: `
                radial-gradient(ellipse 60% 50% at 50% 30%, rgba(183,255,62,0.06) 0%, transparent 70%),
                radial-gradient(ellipse 50% 40% at 50% 60%, rgba(0,102,255,0.03) 0%, transparent 60%)
              `,
            } as any,
          ]}
        />
        {/* Ground silhouette hint */}
        <View
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "15%",
            backgroundImage: `
              linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)
            `,
          } as any}
        />
        {/* Particles */}
        {showParticles && !reducedMotion && (
          <>
            <AmbientParticle index={0} />
            <AmbientParticle index={1} />
            <AmbientParticle index={2} />
            <AmbientParticle index={3} />
            <AmbientParticle index={4} />
          </>
        )}
      </View>
    );
  }

  // Native: use layered Views
  return (
    <View className="absolute inset-0" style={{ backgroundColor: BG_GRADIENT[0] }} pointerEvents="none">
      {/* Floodlight glow */}
      <Animated.View
        className="absolute inset-0"
        style={[
          glowStyle,
          {
            backgroundColor: FLOODLIGHT_COLOR,
            borderRadius: 9999,
            transform: [{ scaleX: 1.5 }],
            top: "20%",
            left: "10%",
            right: "10%",
            bottom: "30%",
          },
        ]}
      />
      {/* Ground silhouette */}
      <View
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: "15%",
          backgroundColor: "rgba(0,0,0,0.2)",
        }}
      />
      {/* Particles */}
      {showParticles && !reducedMotion && (
        <>
          <AmbientParticle index={0} />
          <AmbientParticle index={1} />
          <AmbientParticle index={2} />
        </>
      )}
    </View>
  );
}

export default CinematicBackground;
