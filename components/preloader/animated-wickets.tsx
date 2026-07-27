/**
 * AnimatedWickets — Wicket reveal with impact pulse and bail reaction.
 *
 * After the ball reaches center, wickets appear with a subtle spring
 * animation. Bails react with a small hop on impact.
 */
import { View } from "react-native";
import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { TIMELINE, SPRING } from "./animation-config";

interface AnimatedWicketsProps {
  /** Screen width for responsive sizing */
  screenWidth: number;
  /** Whether to animate */
  animate?: boolean;
}

const STUMP_WIDTH = 4;
const STUMP_HEIGHT_RATIO = 0.55;
const BAIL_HEIGHT = 3.5;
const BAIL_WIDTH = 32;

export function AnimatedWickets({ screenWidth, animate = true }: AnimatedWicketsProps) {
  const reducedMotion = useReducedMotion();
  const containerSize = Math.min(screenWidth * 0.35, 140);
  const stumpHeight = containerSize * STUMP_HEIGHT_RATIO;
  const gap = 3;

  // Staggered stump reveal
  const stumpLeft = useSharedValue(reducedMotion ? 1 : 0);
  const stumpCenter = useSharedValue(reducedMotion ? 1 : 0);
  const stumpRight = useSharedValue(reducedMotion ? 1 : 0);
  // Bail hop
  const bailLeft = useSharedValue(reducedMotion ? 0 : 0);
  const bailRight = useSharedValue(reducedMotion ? 0 : 0);
  // Impact pulse
  const impactScale = useSharedValue(0);
  const impactOpacity = useSharedValue(0);

  useEffect(() => {
    if (!animate) return;
    const baseDelay = TIMELINE.BALL_IMPACT * 1000;
    const stumpDuration = reducedMotion ? 200 : 400;

    // Stumps appear with stagger (left → center → right)
    stumpLeft.value = withDelay(baseDelay, withTiming(1, { duration: stumpDuration, easing: Easing.out(Easing.cubic) }));
    stumpCenter.value = withDelay(baseDelay + 80, withTiming(1, { duration: stumpDuration, easing: Easing.out(Easing.cubic) }));
    stumpRight.value = withDelay(baseDelay + 160, withTiming(1, { duration: stumpDuration, easing: Easing.out(Easing.cubic) }));

    if (!reducedMotion) {
      // Bails react with a hop
      bailLeft.value = withDelay(
        baseDelay + 200,
        withSequence(
          withSpring(-9, SPRING.ELASTIC),
          withSpring(0, { damping: 10, stiffness: 180, mass: 0.6 }),
        ),
      );
      bailRight.value = withDelay(
        baseDelay + 260,
        withSequence(
          withSpring(-7, SPRING.ELASTIC),
          withSpring(1, { damping: 10, stiffness: 180, mass: 0.6 }),
          withSpring(0, { damping: 12, stiffness: 200, mass: 0.7 }),
        ),
      );

      // Impact shockwave
      impactScale.value = withDelay(
        baseDelay + 150,
        withSpring(1, { damping: 8, stiffness: 100, mass: 0.8 }),
      );
      impactOpacity.value = withDelay(
        baseDelay + 150,
        withTiming(0.5, { duration: 200, easing: Easing.out(Easing.cubic) }),
      );
    }
  }, [animate, reducedMotion]);

  const stumpLeftStyle = useAnimatedStyle(() => ({
    opacity: stumpLeft.value,
    transform: [
      { translateY: interpolateStump(stumpLeft.value) },
    ],
  }));
  const stumpCenterStyle = useAnimatedStyle(() => ({
    opacity: stumpCenter.value,
    transform: [
      { translateY: interpolateStump(stumpCenter.value) },
    ],
  }));
  const stumpRightStyle = useAnimatedStyle(() => ({
    opacity: stumpRight.value,
    transform: [
      { translateY: interpolateStump(stumpRight.value) },
    ],
  }));

  const bailLeftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bailLeft.value }],
  }));
  const bailRightStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bailRight.value }],
  }));

  const impactStyle = useAnimatedStyle(() => ({
    transform: [{ scale: impactScale.value }],
    opacity: impactOpacity.value,
  }));

  const totalWidth = STUMP_WIDTH * 3 + gap * 2;
  const startX = (containerSize - totalWidth) / 2;

  return (
    <View style={{ width: containerSize, height: containerSize, alignItems: "center", justifyContent: "center" }}>
      {/* Impact shockwave */}
      <Animated.View
        className="absolute rounded-full"
        style={[
          impactStyle,
          {
            width: containerSize * 0.8,
            height: containerSize * 0.8,
            borderWidth: 1.5,
            borderColor: "rgba(183, 255, 62, 0.3)",
          },
        ]}
        pointerEvents="none"
      />

      {/* Wicket group */}
      <View style={{ height: stumpHeight + BAIL_HEIGHT + 6, justifyContent: "flex-end", alignItems: "center" }}>
        {/* Bails */}
        <View className="flex-row items-end" style={{ gap: 0, marginBottom: -1 }}>
          <Animated.View
            style={[
              bailLeftStyle,
              {
                width: BAIL_WIDTH / 2,
                height: BAIL_HEIGHT,
                backgroundColor: "#D4A017",
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
                marginRight: 0.5,
              },
            ]}
          />
          <Animated.View
            style={[
              bailRightStyle,
              {
                width: BAIL_WIDTH / 2,
                height: BAIL_HEIGHT,
                backgroundColor: "#D4A017",
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
                marginLeft: 0.5,
              },
            ]}
          />
        </View>

        {/* Stumps */}
        <View className="flex-row" style={{ gap }}>
          {/* Left stump */}
          <Animated.View
            style={[
              stumpLeftStyle,
              {
                width: STUMP_WIDTH,
                height: stumpHeight,
                backgroundColor: "#D4A017",
                borderBottomLeftRadius: 1,
                borderBottomRightRadius: 1,
              },
            ]}
          />
          {/* Center stump (taller) */}
          <Animated.View
            style={[
              stumpCenterStyle,
              {
                width: STUMP_WIDTH,
                height: stumpHeight * 1.08,
                backgroundColor: "#E8B830",
                borderBottomLeftRadius: 1,
                borderBottomRightRadius: 1,
              },
            ]}
          />
          {/* Right stump */}
          <Animated.View
            style={[
              stumpRightStyle,
              {
                width: STUMP_WIDTH,
                height: stumpHeight,
                backgroundColor: "#D4A017",
                borderBottomLeftRadius: 1,
                borderBottomRightRadius: 1,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

// Helper: interpolate stump from translateY
function interpolateStump(value: number): number {
  'worklet';
  // value: 0 (hidden, below) → 1 (visible, normal position)
  if (value >= 1) return 0;
  return (1 - value) * 40; // slide up from 40px below
}

export default AnimatedWickets;
