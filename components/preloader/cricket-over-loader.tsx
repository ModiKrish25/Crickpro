/**
 * CricketOverLoader — Six-ball "over" progress indicator.
 *
 * Displays six small circles (deliveries) that fill sequentially
 * with a bounce/pop animation. Underneath, text cycles through
 * cricket-themed loading messages.
 *
 * ○ ○ ○ ○ ○ ○  →  ● ● ● ● ● ●  (one by one)
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
import { OVER_LOADER, getOverDotSize } from "./animation-config";

interface CricketOverLoaderProps {
  /** Screen width for responsive sizing */
  screenWidth: number;
  /** Number of completed deliveries (0-6) */
  completedBalls: number;
  /** Whether to animate */
  animate?: boolean;
}

function BallDot({
  index,
  completed,
  animate,
  size,
  reducedMotion,
}: {
  index: number;
  completed: boolean;
  animate: boolean;
  size: number;
  reducedMotion: boolean;
}) {
  const fill = useSharedValue(completed ? 1 : 0);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (completed && animate) {
      const delay = OVER_LOADER.BALL_GAP * 1000;
      fill.value = withDelay(
        index * delay,
        withTiming(1, { duration: OVER_LOADER.BALL_DURATION * 1000, easing: Easing.out(Easing.cubic) }),
      );
      if (!reducedMotion) {
        scale.value = withDelay(
          index * delay + OVER_LOADER.BALL_DURATION * 1000,
          withSequence(
            withSpring(OVER_LOADER.POP_SCALE, { damping: 8, stiffness: 250, mass: 0.4 }),
            withSpring(OVER_LOADER.REST_SCALE, { damping: 12, stiffness: 200, mass: 0.6 }),
          ),
        );
        glowOpacity.value = withDelay(
          index * delay,
          withTiming(1, { duration: 300 }),
        );
      }
    }
  }, [completed, animate]);

  const dotStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(183, 255, 62, ${fill.value === 1 ? 1 : 0.2})`,
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="items-center justify-center" style={{ width: size + 8, height: size + 8 }}>
      {/* Glow ring */}
      <Animated.View
        className="absolute rounded-full"
        style={[
          glowStyle,
          {
            width: size + 6,
            height: size + 6,
            backgroundColor: "rgba(183, 255, 62, 0.1)",
          },
        ]}
        pointerEvents="none"
      />
      {/* Dot */}
      <Animated.View
        className="rounded-full"
        style={[
          dotStyle,
          { width: size, height: size },
        ]}
      />
    </View>
  );
}

export function CricketOverLoader({
  screenWidth,
  completedBalls,
  animate = true,
}: CricketOverLoaderProps) {
  const reducedMotion = useReducedMotion();
  const dotSize = getOverDotSize(screenWidth);
  const balls = Array.from({ length: 6 }, (_, i) => i < completedBalls);

  return (
    <View className="items-center gap-3">
      {/* Six-ball display */}
      <View className="flex-row" style={{ gap: 6 }}>
        {balls.map((completed, i) => (
          <BallDot
            key={i}
            index={i}
            completed={completed}
            animate={animate}
            size={dotSize}
            reducedMotion={reducedMotion}
          />
        ))}
      </View>
    </View>
  );
}

export default CricketOverLoader;
