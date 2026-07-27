/**
 * AnimatedCricketBall — Premium ball entrance animation.
 *
 * Ball enters from upper-right with a curved trajectory, spins
 * naturally (seam visible), and settles at center with a subtle
 * impact pulse glow.
 */
import { View } from "react-native";
import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  TIMELINE, SPRING, BALL, getBallSize,
} from "./animation-config";

interface AnimatedCricketBallProps {
  /** Screen width for responsive sizing */
  screenWidth: number;
  /** Called when ball reaches center (impact moment) */
  onImpact?: () => void;
  /** Whether to start the animation */
  animate?: boolean;
}

export function AnimatedCricketBall({
  screenWidth,
  onImpact,
  animate = true,
}: AnimatedCricketBallProps) {
  const reducedMotion = useReducedMotion();
  const ballSize = getBallSize(screenWidth);

  // Position
  const translateX = useSharedValue(reducedMotion ? 0 : BALL.ENTRY_X);
  const translateY = useSharedValue(reducedMotion ? 0 : BALL.ENTRY_Y);
  // Rotation for spin
  const rotation = useSharedValue(0);
  // Impact glow
  const impactGlow = useSharedValue(0);
  const impactRing = useSharedValue(0);
  const impactRingOpacity = useSharedValue(0);

  useEffect(() => {
    if (!animate) return;

    if (reducedMotion) {
      translateX.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });
      impactGlow.value = withTiming(0.3, { duration: 200 });
      onImpact?.();
      return;
    }

    // 1. Ball enters from upper-right with curved trajectory
    const entryDuration = (TIMELINE.BALL_IMPACT - TIMELINE.BALL_ENTRY) * 1000;

    translateX.value = withTiming(0, {
      duration: entryDuration,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });

    translateY.value = withTiming(0, {
      duration: entryDuration * 1.1,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    });

    // 2. Continuous rotation during flight
    rotation.value = withRepeat(
      withTiming(360 * BALL.FLIGHT_ROTATION_SPEED, {
        duration: 1000,
        easing: Easing.linear,
      }),
      Math.ceil(BALL.FLIGHT_ROTATION_SPEED),
      false,
    );

    // 3. Impact pulse when ball reaches center
    const impactDelay = entryDuration;
    impactGlow.value = withDelay(
      impactDelay - 100,
      withTiming(0.6, { duration: 150, easing: Easing.out(Easing.cubic) }),
    );

    impactRing.value = withDelay(
      impactDelay,
      withSpring(1.5, SPRING.ELASTIC),
    );
    impactRingOpacity.value = withDelay(
      impactDelay,
      withTiming(0.6, { duration: 200 }),
    );

    // 4. Signal parent when ball reaches center
    const timer = setTimeout(() => onImpact?.(), impactDelay + 50);
    return () => clearTimeout(timer);
  }, [animate, reducedMotion]);

  const ballStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(impactGlow.value, [0, 0.6, 1], [0, 0.4, 0]),
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: impactRing.value }],
    opacity: impactRingOpacity.value,
  }));

  return (
    <View className="items-center justify-center" style={{ width: ballSize + 40, height: ballSize + 40 }}>
      {/* Impact glow */}
      <Animated.View
        className="absolute rounded-full"
        style={[
          glowStyle,
          {
            width: ballSize + 32,
            height: ballSize + 32,
            backgroundColor: "rgba(183, 255, 62, 0.15)",
          },
        ]}
        pointerEvents="none"
      />
      {/* Impact ring */}
      <Animated.View
        className="absolute rounded-full"
        style={[
          ringStyle,
          {
            width: ballSize + 16,
            height: ballSize + 16,
            borderWidth: 2,
            borderColor: "rgba(183, 255, 62, 0.4)",
          },
        ]}
        pointerEvents="none"
      />
      {/* Ball */}
      <Animated.View style={ballStyle}>
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: ballSize,
            height: ballSize,
            backgroundColor: "#CC0000",
            shadowColor: "#CC0000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.5,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          {/* Seam line 1 */}
          <View
            className="absolute w-full"
            style={{
              height: 2,
              backgroundColor: "#FFFFFF",
              opacity: 0.5,
              transform: [{ rotate: "30deg" }],
            }}
          />
          {/* Seam line 2 */}
          <View
            className="absolute w-full"
            style={{
              height: 2,
              backgroundColor: "#FFFFFF",
              opacity: 0.5,
              transform: [{ rotate: "-30deg" }],
            }}
          />
          {/* Seam line 3 (perpendicular) */}
          <View
            className="absolute h-full"
            style={{
              width: 2,
              backgroundColor: "#FFFFFF",
              opacity: 0.3,
              transform: [{ rotate: "0deg" }],
            }}
          />
          {/* Center dot */}
          <View
            className="rounded-full"
            style={{
              width: ballSize * 0.12,
              height: ballSize * 0.12,
              backgroundColor: "#FFFFFF",
              opacity: 0.3,
            }}
          />
        </View>
      </Animated.View>
    </View>
  );
}

export default AnimatedCricketBall;
